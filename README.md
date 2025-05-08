
# CoffeeRestApiApp ☕

A RESTful API for managing a coffee shop system, built with Node.js and Express.

## 🚀 Features

- 🍽️ Manage menu items (foods and drinks)
- 🧾 Create and update orders
- 📦 Track order status (`pending`, `processing`, `completed`, `cancelled`)
- 🪑 Supports both `takeaway` and `stay` order types
- 🔒 User authentication 
- 📊 Dashboard for admin 

## 🛠 Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MySQL

## 📁 Project Structure

```

project-root/
├── controllers/
├── routes/
├── models/
├── config/
├── middlewares/
├── .env
├── .gitignore
├── README.md
└── server.js

````

## 🧑‍💻 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/KhanhNamYeh/CoffeeRestApiApp.git
cd CoffeeRestApiApp

````

### 2. Install Dependencies

```bash
npm install
```


### 3. Run the Server

```bash
npm start
```

## 📬 API Endpoints

| Method | Endpoint     | Description        |
| ------ | ------------ | ------------------ |
| GET    | /menu        | Get all menu       |
| GET    | /user        | Get all user       |

## 🧾 License

This project is licensed under the MIT License.

---

Made with ❤️ by AP GROUP
