# 🚀 FlowDesk

### IT Service Management Platform

A modern full-stack IT Service Management (ITSM) application built to simplify support ticket management, streamline issue resolution, and manage users through a centralized workspace.

🌐 **Live Application:** https://flowdesk-frontend-cy63.onrender.com

## ✨ Features

- 🔐 **JWT Authentication** — Secure user registration and login.
- 🎫 **Ticket Management** — Create, view, assign, and update support tickets.
- 👥 **Role-Based Access Control** — Separate permissions for Employees, Agents, and Administrators.
- 🛡️ **User Administration** — Manage user accounts and roles.
- 📊 **Dashboard & Reports** — Access support information through a centralized interface.
- 🎨 **Modern UI** — Responsive design with light and dark themes.
- ☁️ **Cloud Deployment** — Hosted frontend, backend, and database.

## 🛠️ Tech Stack

| Component | Technology |
|---|---|
| Frontend | React, Vite, JavaScript, CSS |
| Backend | Java 21, Spring Boot |
| Security | Spring Security, JWT |
| Database | PostgreSQL |
| Database Hosting | Neon |
| API Communication | REST API, Axios |
| Deployment | Render |
| Version Control | Git, GitHub |

## 🏗️ Architecture

```text
              User
               |
               v
      React + Vite Frontend
             Render
               |
          REST API / HTTPS
               |
               v
      Spring Boot Backend
             Render
               |
          JDBC Connection
               |
               v
       PostgreSQL Database
              Neon
```

## 👤 User Roles

**Employee**
- Register and log in.
- Create support tickets.
- Track ticket progress.

**Agent**
- Access support tickets.
- Manage ticket assignments.
- Update ticket statuses.

**Administrator**
- Manage users and their roles.
- Oversee support tickets.
- Access administrative features.

## 🚀 Run Locally

### Prerequisites

- Java 21
- Node.js and npm
- PostgreSQL
- Git

### 1. Clone the repository

```bash
git clone https://github.com/srijaykomarapu/flowdesk.git
cd flowdesk
```

### 2. Configure the backend

Configure your local PostgreSQL database and the required environment variables:

```text
FLOWDESK_DB_PASSWORD=your_database_password
FLOWDESK_JWT_SECRET=your_secure_jwt_secret
```

Check `backend/src/main/resources/application.properties` for the database name, username, and other settings.

### 3. Start the Spring Boot backend

Open a terminal:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Backend URL: `http://localhost:8080`

### 4. Start the React frontend

Open another terminal from the project root:

```powershell
cd frontend
npm install
npm run dev
```

Frontend URL: `http://localhost:5173`

Ensure the frontend API configuration and backend CORS settings match your local environment.

## ☁️ Deployment

FlowDesk uses the following deployment setup:

- **Frontend:** Render Static Site
- **Backend:** Render Web Service
- **Database:** Neon PostgreSQL

Production credentials and secrets should be configured using environment variables in the hosting dashboard.

*Note: Free hosting plans may have usage limits, inactivity-related pauses, or other provider-specific restrictions.*

## 🔒 Security

- JWT-based authentication.
- Role-based authorization for protected operations.
- Database credentials and JWT secrets stored outside source control.
- HTTPS for production communication.
- Restricted access to administrative operations.

Never commit real passwords, API secrets, or database connection credentials to GitHub.

## 🔮 Future Improvements

- Email notifications for ticket updates.
- Ticket priority and SLA management.
- Advanced analytics and reporting.
- Search, filtering, and pagination.
- Ticket comments and activity history.
- Automated tests and CI/CD integration.

## 🎯 Project Goal

FlowDesk demonstrates the development of a full-stack enterprise-style application using React, Spring Boot, PostgreSQL, REST APIs, authentication, authorization, and cloud deployment.

It combines frontend development, backend engineering, database integration, and deployment into a practical IT support management system.

## 👨‍💻 Author

**Srijay Komarapu**

GitHub: https://github.com/srijaykomarapu

---

⭐ If you find this project interesting, consider giving the repository a star.

**Built with React, Spring Boot, and PostgreSQL.**
