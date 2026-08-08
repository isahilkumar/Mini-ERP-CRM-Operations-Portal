# 🏢 Mini ERP & CRM Operations Portal

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Render](https://img.shields.io/badge/Deployed%20on-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://mini-erp-crm-operations-portalmini-erp.onrender.com)
[![AWS S3](https://img.shields.io/badge/Images%20on-AWS%20S3-FF9900?style=for-the-badge&logo=amazons3&logoColor=white)](https://aws.amazon.com/s3/)

A full-stack enterprise Operations Portal built for managing **Customers (CRM)**, **Products & Inventory**, **Stock Movements**, and **Sales Challans** with strict **Role-Based Access Control (RBAC)**.

## 🌐 Live Demo

> **🚀 Production URL:** [https://mini-erp-crm-operations-portalmini-erp.onrender.com](https://mini-erp-crm-operations-portalmini-erp.onrender.com)

> ⚠️ **Note:** Hosted on Render's free tier — the server may take **~30 seconds to wake up** on first visit after inactivity.

### 🔑 Demo Login Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `password123` |
| **Sales** | `sales@example.com` | `password123` |
| **Warehouse** | `warehouse@example.com` | `password123` |
| **Accounts** | `accounts@example.com` | `password123` |

---



## 🚀 Features

### 🔐 1. Role-Based Access Control (RBAC)
- **Admin**: Complete system access across CRM, Inventory, Sales Challans, and Stock Audit Logs.
- **Sales**: Manage customer accounts, add interaction notes, view product catalog, and issue Sales Challans.
- **Warehouse**: Full inventory management, stock level updates, product image uploads, and movement audit logs.
- **Accounts**: Review sales challans, track customer order histories, and audit transaction records.

### 💼 2. Customer CRM
- Chronological customer interaction logs & follow-up notes.
- Customer lifecycle management (Leads, Active Accounts, Inactive Accounts).
- Complete transaction history and active sales orders per customer.

### 📦 3. Inventory & Stock Tracking
- Real-time inventory tracking with low-stock alerts.
- Product catalog management with image upload capabilities (`multer`).
- Immutable automated stock movement logging (IN, OUT, ADJUSTMENT).

### 🧾 4. Sales Challans & Cart System
- Multi-item interactive sales order/challan builder.
- Automatic stock deduction upon challan confirmation.
- **Database Transaction Protection**: Wrapped in SQL transactions to prevent negative stock and race conditions.

### 🎨 5. Modern UI & UX
- Custom dark/light mode polished enterprise interface.
- Dynamic data tables, search filters, modal dialogs, and responsive layout.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 (Vite) + TypeScript
- **Styling**: Modern Vanilla CSS with CSS custom properties & utility animations
- **Icons**: Lucide React Icons
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js & Express (TypeScript)
- **ORM**: Prisma ORM
- **Database**: PostgreSQL / SQLite
- **Authentication**: JWT (JSON Web Tokens) & `bcryptjs` password hashing
- **File Uploads**: Multer (Local storage / static serving)

---

## 📁 Repository Structure

```text
Mini-ERP-CRM-Operations-Portal/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma         # Prisma Data Models & Database Schema
│   ├── src/
│   │   ├── controllers/          # Request handlers (Auth, CRM, Products, Challans)
│   │   ├── middleware/           # Auth & RBAC validation middleware
│   │   ├── routes/               # Express API routing definitions
│   │   ├── utils/                # Prisma client initialization
│   │   └── server.ts             # Application entry point
│   ├── uploads/                  # Product image storage directory
│   ├── .env.example              # Backend environment variables template
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/           # Reusable UI components & Sidebar layout
│   │   ├── context/              # Authentication context provider
│   │   ├── pages/                # Operations portal views (Dashboard, Products, CRM, Challans)
│   │   ├── App.tsx               # App routing & protected routes
│   │   └── index.css             # Main stylesheet & global themes
│   ├── .env.example              # Frontend environment variables template
│   └── package.json
├── docker-compose.yml            # Docker containerization configuration
├── Mini_ERP_Postman_Collection.json # Postman API Testing Collection
└── README.md
```

---

## ⚡ Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [PostgreSQL](https://www.postgresql.org/) (or SQLite for local dev)

---

### 1. Environment Setup

Create `.env` files in both the `backend/` and `frontend/` directories.

#### **Backend (`backend/.env`)**
```env
PORT=5000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mini_erp?schema=public"
JWT_SECRET="super_secret_jwt_key_change_in_production"
```

#### **Frontend (`frontend/.env`)**
```env
VITE_API_BASE_URL="http://localhost:5000/api"
```

---

### 2. Backend Installation & Database Migration

Navigate to the backend directory and run:

```bash
cd backend
npm install

# Generate Prisma Client & push schema to your database
npx prisma generate
npx prisma db push

# (Optional) Seed the database with default roles & initial admin user
npx tsx prisma/seed_roles.ts

# Start backend dev server
npm run dev
```
> The backend server will run at: `http://localhost:5000`

---

### 3. Frontend Installation

In a new terminal window, navigate to the frontend directory:

```bash
cd frontend
npm install

# Start Vite dev server
npm run dev
```
> The frontend application will run at: `http://localhost:5173`

---

## 🔑 Default Seed Credentials

After running the database seed script, you can log in with:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `password123` |
| **Sales** | `sales@example.com` | `password123` |
| **Warehouse** | `warehouse@example.com` | `password123` |
| **Accounts** | `accounts@example.com` | `password123` |

---

## 🧪 API Endpoints & Testing

A complete **Postman Collection** is included in the project root: [`Mini_ERP_Postman_Collection.json`](./Mini_ERP_Postman_Collection.json). Import this file directly into Postman to test all routes.

### Key Routes Overview

| Category | Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/register` | Register a new user | Public / Admin |
| **Auth** | `POST` | `/api/auth/login` | Authenticate user & receive JWT token | Public |
| **CRM** | `GET` | `/api/customers` | Fetch all customer accounts | Admin, Sales, Accounts |
| **CRM** | `POST` | `/api/customers` | Create a new customer lead | Admin, Sales |
| **CRM** | `POST` | `/api/customers/:id/notes` | Append follow-up note to customer | Admin, Sales |
| **Products** | `GET` | `/api/products` | Get inventory list with stock levels | All Roles |
| **Products** | `POST` | `/api/products` | Create product with image upload | Admin, Warehouse |
| **Products** | `PUT` | `/api/products/:id` | Update product details / adjust stock | Admin, Warehouse |
| **Challans** | `GET` | `/api/challans` | List all sales challans | All Roles |
| **Challans** | `POST` | `/api/challans` | Create & issue new sales challan | Admin, Sales |
| **Logs** | `GET` | `/api/stock-logs` | Audit trail of inventory movements | Admin, Warehouse |

---

## 🐳 Docker Setup (Optional)

You can run the PostgreSQL database via Docker:

```bash
docker-compose up -d
```

---

## 🛡️ Database Transaction & Inventory Integrity

- **Preventing Negative Stock**: When a sales challan is created, the system checks product stock availability within a database transaction block (`prisma.$transaction`).
- **Atomic Operations**: If stock for any item in the order is insufficient, the entire transaction rolls back cleanly, preventing partial updates.
- **Automated Stock Audit**: Every stock deduction automatically inserts a row into the `StockLog` table with historical timestamp and reference details.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
