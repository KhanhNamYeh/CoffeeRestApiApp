document.getElementById('uploadForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const fileInput = document.getElementById('excelFile');
    const file = fileInput.files[0];
    if (!file) {
        alert('Please select a file!');
        return;
    }
    const formData = new FormData();
    formData.append('file', file);

    fetch('/shift/upload', { 
        method: 'POST',
        body: formData
    })
    .then(async response => {
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Upload failed!');
        }
        return response.json();
    })
    .then(data => {
        alert('Upload successful!');
    })
    .catch(error => {
        alert('Upload failed: ' + error.message);
        console.error(error);
    });
});

// Get current date
let currentDate = new Date();

// Start from Monday of current week
let startOfWeek = new Date(currentDate);
startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1);

// Format date as YYYY-MM-DD
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Format date for display
function formatDisplayDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Update header with dates
function updateHeader() {
    const weekHeader = document.getElementById('weekHeader');
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    weekHeader.innerHTML = '';
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        
        const th = document.createElement('th');
        th.innerHTML = `${days[i]}<br>(${formatDisplayDate(date)})`;
        weekHeader.appendChild(th);
    }
    
    // Update date range display
    const startDate = formatDisplayDate(startOfWeek);
    const endDate = formatDisplayDate(new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000));
    document.getElementById('dateRange').textContent = `${startDate} - ${endDate}`;
}

// Fetch shifts from API
async function fetchShifts() {
    try {
        const response = await fetch('http://localhost:3000/shift/schedule');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching shifts:', error);
        return [];
    }
}

// Filter shifts for a specific date and time
function filterShifts(shifts, date, time) {
    const dateStr = formatDate(date);
    return shifts.filter(shift => shift.shift_date === dateStr && shift.shift_time === time);
}

// Create shift cell content
function createShiftCell(shifts) {
    const td = document.createElement('td');

    // Nếu không có ca làm nào
    if (shifts.length === 0) {
        td.innerHTML = '<div class="no-shift">No shift scheduled</div>';
        return td;
    }

    // Lấy staff từ shifts[0] (vì mỗi ca chỉ có 1 object, staff là mảng)
    const staff = shifts[0].staff || [];
    let content = '';

    if (staff.length === 0) {
        td.innerHTML = '<div class="no-shift">No shift scheduled</div>';
        return td;
    }

    staff.forEach(name => {
        content += `<div class="shift-details">${name}</div>`;
    });

    const shiftDiv = document.createElement('div');
    shiftDiv.className = `shift ${shifts[0].shift_time}`;
    shiftDiv.innerHTML = `
        <div class="shift-title">${shifts[0].shift_time.charAt(0).toUpperCase() + shifts[0].shift_time.slice(1)}</div>
        ${content}
    `;
    td.appendChild(shiftDiv);
    return td;
}

// Load schedule for current week
async function loadSchedule() {
    const shifts = await fetchShifts();
    
    const morningRow = document.getElementById('morningShifts');
    const afternoonRow = document.getElementById('afternoonShifts');
    const eveningRow = document.getElementById('eveningShifts');
    
    morningRow.innerHTML = '';
    afternoonRow.innerHTML = '';
    eveningRow.innerHTML = '';
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        
        const morningShifts = filterShifts(shifts, date, 'morning');
        const afternoonShifts = filterShifts(shifts, date, 'afternoon');
        const eveningShifts = filterShifts(shifts, date, 'evening');
        
        morningRow.appendChild(createShiftCell(morningShifts));
        afternoonRow.appendChild(createShiftCell(afternoonShifts));
        eveningRow.appendChild(createShiftCell(eveningShifts));
    }
}

// Navigate to previous week
function previousWeek() {
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    updateHeader();
    loadSchedule();
}

// Navigate to next week
function nextWeek() {
    startOfWeek.setDate(startOfWeek.getDate() + 7);
    updateHeader();
    loadSchedule();
}

// Add event listeners
document.getElementById('prevWeek').addEventListener('click', previousWeek);
document.getElementById('nextWeek').addEventListener('click', nextWeek);

// Initialize
updateHeader();
loadSchedule();