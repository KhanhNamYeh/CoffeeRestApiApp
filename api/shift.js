const express = require("express");
const router = express.Router();
const ExcelJS = require("exceljs");
const pool = require("../db"); 
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.get("/schedule", async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                s.shift_date,
                s.shift_time,
                u.name
            FROM 
                staff_shifts s
            LEFT JOIN shift_assignment sa ON sa.id_shift = s.id_shift
            LEFT JOIN users u ON sa.id_user = u.id_user
            ORDER BY 
                s.shift_date ASC,
                FIELD(s.shift_time, 'morning', 'afternoon', 'evening');
        `);

        const shiftMap = {};
        for (const row of rows) {
            const date = row.shift_date instanceof Date
                ? toLocalDateString(row.shift_date)
                : row.shift_date;
            const key = `${date}|${row.shift_time}`;
            if (!shiftMap[key]) {
                shiftMap[key] = {
                    shift_date: date,
                    shift_time: row.shift_time,
                    staff: []
                };
            }
            if (row.name) shiftMap[key].staff.push(row.name);
        }
        const result = Object.values(shiftMap);

        res.json(result);
    } catch (err) {
        res.status(500).json({ message: "Database error", error: err.message });
    }
});

router.get("/download", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT id_user, name FROM users WHERE role = 'staff'");
        const staffIds = rows.map(row => row.id_user);
        const staffNames = rows.map(row => row.name);
        const staffHeaders = rows.map(row => `${row.id_user} - ${row.name}`);
        const today = new Date();
        const daysUntilNextMonday = (8 - today.getDay()) % 7 || 7;
        const startDate = new Date(today.getTime() + daysUntilNextMonday * 86400000);
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Next Week Schedule");

        sheet.addRow(["Date", "Shift", ...staffHeaders]);

        const shifts = ["Morning", "Afternoon", "Evening"];
        let rowIndex = 2; 
        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(startDate.getTime() + i * 86400000);
            const formattedDate = currentDate.toLocaleDateString("en-GB", {
                weekday: "long",
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            });
            for (const shift of shifts) {
                const row = sheet.addRow([formattedDate, shift, ...Array(staffNames.length).fill("")]);
                for (let col = 3; col <= 2 + staffNames.length; col++) {
                    row.getCell(col).alignment = { vertical: "middle", horizontal: "center" };
                }
            }
            sheet.mergeCells(`A${rowIndex}:A${rowIndex + 2}`);
            sheet.getCell(`A${rowIndex}`).alignment = { vertical: "middle", horizontal: "center" };
            rowIndex += 3;
        }

        res.setHeader("Content-Disposition", "attachment; filename=next_week_schedule.xlsx");
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error("Error generating Excel file:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

router.post("/upload", upload.single('file'), async (req, res) => {
    try {
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(req.file.path);

        const sheet = workbook.worksheets[0];
        const data = [];
        sheet.eachRow((row, rowNumber) => {
            data.push(row.values);
        });

        // 1. Xác định tuần cần thao tác
        let startDate;
        if (data.length > 1 && data[1][1]) {
            const match = data[1][1].match(/(\d{2})\/(\d{2})\/(\d{4})/);
            if (match) {
                startDate = new Date(`${match[3]}-${match[2]}-${match[1]}`);
            } else {
                const today = new Date();
                const daysUntilNextMonday = (8 - today.getDay()) % 7 || 7;
                startDate = new Date(today.getTime() + daysUntilNextMonday * 86400000);
            }
        } else {
            const today = new Date();
            const daysUntilNextMonday = (8 - today.getDay()) % 7 || 7;
            startDate = new Date(today.getTime() + daysUntilNextMonday * 86400000);
        }

        // 2. Nếu file chỉ có header, xóa toàn bộ assignment của tuần và return
        if (data.length > 0) {
            const weekDates = [];
            for (let i = 0; i < 7; i++) {
                const date = new Date(startDate.getTime() + i * 86400000);
                weekDates.push(toLocalDateString(date));
            }
            const [currentAssignments] = await pool.query(
                `SELECT sa.id_user, s.shift_date, s.shift_time
                 FROM shift_assignment sa
                 JOIN staff_shifts s ON sa.id_shift = s.id_shift
                 WHERE s.shift_date IN (${weekDates.map(() => '?').join(',')})`,
                weekDates
            );
            const removePromises = [];
            for (const a of currentAssignments) {
                removePromises.push(
                    pool.query(
                        "CALL remove_user_from_shift(?, ?, ?)",
                        [a.id_user, a.shift_date, a.shift_time]
                    )
                );
            }
            await Promise.all(removePromises);
        }

        // 3. Tạo ca làm cho 7 ngày tiếp theo nếu chưa có
        const mondayStr = toLocalDateString(startDate);
        const [existRows] = await pool.query(
            "SELECT * FROM staff_shifts WHERE shift_date = ?",
            [mondayStr]
        );

        if (existRows.length === 0) {
            const shifts = ["morning", "afternoon", "evening"];
            const insertPromises = [];
            for (let i = 0; i < 7; i++) {
                const date = new Date(startDate.getTime() + i * 86400000);
                const dateStr = toLocalDateString(date);
                for (const shift of shifts) {
                    insertPromises.push(
                        pool.query(
                            "INSERT INTO staff_shifts (shift_date, shift_time) VALUES (?, ?)",
                            [dateStr, shift]
                        )
                    );
                }
            }
            await Promise.all(insertPromises);
        }

        // 4. Đọc lại toàn bộ staff_shifts để lấy id_shift
        const [shiftsRows] = await pool.query("SELECT * FROM staff_shifts");
        const shiftMap = {};
        for (const s of shiftsRows) {
            shiftMap[`${s.shift_date}|${s.shift_time}`] = s.id_shift;
        }

        // 5. Đọc header để lấy id_user
        const header = data[0];
        const userIds = header.slice(3).map(h => parseInt(h.split(' - ')[0]));

        // 6. Duyệt file, chỉ thêm assignment nếu có 'x'
        const assignPromises = [];
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (!row || row.length < 3) continue;
            const date = formatDate(row[1]);
            const shift = row[2] && typeof row[2] === 'string' ? row[2].toLowerCase() : '';
            for (let j = 3; j < row.length; j++) {
                const id_user = userIds[j - 3];
                const cellHasX = row[j] && row[j].toString().trim().toLowerCase() === 'x';
                if (id_user && date && shift && cellHasX) {
                    assignPromises.push(
                        pool.query(
                            "CALL assign_user_to_shift(?, ?, ?)",
                            [id_user, date, shift]
                        )
                    );
                }
            }
        }
        await Promise.all(assignPromises);

        res.json({ message: "Shifts and assignments updated from Excel file." });
    } catch (err) {
        console.error("Error uploading Excel file:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

function formatDate(dateStr) {
    const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (!match) return '';
    return `${match[3]}-${match[2]}-${match[1]}`;
}

function toLocalDateString(date) {
    if (!(date instanceof Date)) date = new Date(date);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

module.exports = router;