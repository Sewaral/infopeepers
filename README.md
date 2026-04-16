# 🌱 Smart Chili Farm System

## 🚀 Sprint 1 – Guide Registration System

This project is part of a full-stack **Smart Chili Farm System** built using the MERN stack (MongoDB, Express, React, Node.js).  
Sprint 1 focuses on setting up the basic system infrastructure and implementing **guide registration functionality**.

---

## 🎯 Project Goal

To create a system that allows farm guides to register and store their information securely in a database.

---

## 🧩 Features (Sprint 1)

### 🧑‍🌾 Guide Registration
- Users can register as guides
- Form fields:
  - Full Name
  - Email
  - Password
  - Confirm Password
  - Job Details

### ✔ Validation
- Required field validation
- Email format validation
- Password confirmation check

---

## 🖥️ Frontend (React)
- Registration page UI
- Controlled form inputs
- Error handling and validation messages
- API integration with backend

---

## ⚙️ Backend (Node.js + Express)
- REST API endpoint:
  - `POST /api/guides/register`
- Input validation
- Password hashing using bcrypt
- Error handling system

---

## 🗄️ Database (MongoDB)
- Database: `guidesDB`
- Collection: `guides`
- Stored data:
  - Full Name
  - Email
  - Hashed Password
  - Job Details

---

## 🔄 System Flow
1. User fills registration form (Frontend)
2. Data is sent to backend API
3. Backend validates input
4. Password is hashed
5. Data is saved in MongoDB
6. Response sent back to user

---

## 🛠️ Technologies Used
- React.js
- Node.js
- Express.js
- MongoDB
- Axios / Fetch API
- bcrypt

---

## 📌 Sprint 1 Outcome
- Guide registration system is fully functional
- Frontend and backend are connected
- Data is successfully stored in MongoDB
- Basic system architecture is ready for future features

---

## 🚀 Next Sprint Preview
- User login authentication
- Role-based access (Admin / Guide / Visitor)
- Farm tour management system
- Chili plant catalog system

---

## 👨‍💻 Author
Project developed as part of academic coursework.
