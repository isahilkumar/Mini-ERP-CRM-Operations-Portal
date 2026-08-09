# 🏢 Mini ERP & CRM Operations Portal

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Render](https://img.shields.io/badge/Deployed%20on-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://mini-erp-crm-operations-portal-v50w.onrender.com)
[![AWS S3](https://img.shields.io/badge/Images%20on-AWS%20S3-FF9900?style=for-the-badge&logo=amazons3&logoColor=white)](https://aws.amazon.com/s3/)

A full-stack enterprise Operations Portal built for managing **Customers (CRM)**, **Products & Inventory**, **Stock Movements**, **Sales Challans**, and **User Accounts** with strict **Role-Based Access Control (RBAC)**.

---

## 🌐 Live Demo

> **🚀 Production URL:** [https://mini-erp-crm-operations-portal-v50w.onrender.com](https://mini-erp-crm-operations-portal-v50w.onrender.com)

> ℹ️ **Note:** Hosted on Render's free tier — the server may take a short moment to wake up on first visit after extended inactivity.

### 🔑 Demo Login Credentials

| Role | Default Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **Admin** | `Operations Director` | `admin@example.com` | `password123` |
| **Sales** | `Sales Exec` | `sales@example.com` | `password123` |
| **Warehouse** | `Warehouse Mgr` | `warehouse@example.com` | `password123` |
| **Accounts** | `Accounts Exec` | `accounts@example.com` | `password123` |

---

## 🚀 Features

### 🔐 1. Role-Based Access Control (RBAC)
- **Admin**: Complete system access across CRM, Inventory, Sales Challans, Stock Audit Logs, and User Account Management.
- **Sales**: Manage customer accounts, add interaction notes, view product catalog, and issue Sales Challans.
- **Warehouse**: Full inventory management, stock level updates, product image uploads, and movement audit logs.
- **Accounts**: Review sales challans, track customer order histories, and audit transaction records.

### 👑 2. Admin Accounts Control Panel _(New)_
The Admin has a dedicated **Accounts Management** page with full control over all user accounts in the system:

- **Create Accounts** — Add new user accounts with any role (Sales, Warehouse, Accounts, or Admin).
- **Edit Accounts** — Update any user's name, email, role, or reset their password.
- **Delete Accounts** — Remove accounts with integrity checks (blocks deletion if user has linked transactions).
- **ON / OFF Status Toggle** — Instantly activate or deactivate any account. Deactivated accounts are blocked from logging in with a clear error message.
- **Go Inside Account (Impersonation)** — Admin can instantly switch into any user's session to view and operate the portal exactly as that user sees it, without needing their password.
- **Exit & Return to Admin** — A persistent top banner displays while impersonating with a one-click **"Exit & Return to Admin"** button.

### 💼 3. Customer CRM
- Chronological customer interaction logs & follow-up notes.
- Customer lifecycle management (Leads, Active Accounts, Inactive Accounts).
- Complete transaction history and active sales orders per customer.

### 📦 4. Inventory & Stock Tracking
- Real-time inventory tracking with low-stock alerts.
- Product catalog management with image upload capabilities.
- Immutable automated stock movement logging (IN, OUT, ADJUSTMENT).

### 🧾 5. Sales Challans & Cart System
- Multi-item interactive sales order/challan builder.
- Automatic stock deduction upon challan confirmation.
- **Database Transaction Protection**: Wrapped in SQL transactions to prevent negative stock and race conditions.

### ☁️ 6. AWS S3 Cloud Image Storage
- Product images are uploaded directly to **AWS S3** for permanent, scalable cloud storage.
- Supports **dynamic storage switching**: automatically uses S3 in production (when AWS env vars are configured) and falls back to local disk in development.
- Uses `@aws-sdk/client-s3` + `multer-s3` for seamless streaming uploads directly to S3 — no intermediate disk writes.
- Full **graceful fallback**: if AWS credentials are not set, the app continues to work using local `uploads/` directory.

### 🎨 7. Modern UI & UX
- Custom polished enterprise interface with smooth animations and micro-interactions.
- Dynamic data tables, search filters, role-colored badges, and responsive layout.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 (Vite) + TypeScript
- **Styling**: Modern Vanilla CSS with CSS custom properties & utility animations
- **Icons**: Lucide React Icons
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js & Express 5 (TypeScript)
- **ORM**: Prisma ORM
- **Database**: PostgreSQL (production) / SQLite (local dev)
- **Authentication**: JWT (JSON Web Tokens) & `bcryptjs` password hashing
- **Compression**: `compression` middleware (Gzip/Deflate for ~70% smaller asset transfers)
- **File Uploads**: `multer` + `multer-s3` — S3 cloud storage with local disk fallback

### Cloud & Infrastructure
- **Deployment**: [Render](https://render.com) — Single Web Service serving both frontend and backend
- **Database Hosting**: Render Managed PostgreSQL
- **Image Storage**: [AWS S3](https://aws.amazon.com/s3/) — `@aws-sdk/client-s3` for persistent product image storage
- **CI/CD**: Auto-deploy from GitHub `main` branch on every push

---

## 📁 Repository Structure

```text
Mini-ERP-CRM-Operations-Portal/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma               # Prisma Data Models & Database Schema
│   │   ├── migrations/                 # SQL migration history
│   │   └── seed_roles.ts               # Default user seed script
│   ├── src/
│   │   ├── controllers/                # Request handlers
│   │   │   ├── authController.ts       # Login, Register
│   │   │   ├── userController.ts       # User CRUD + Impersonation
│   │   │   ├── customerController.ts   # CRM handlers
│   │   │   ├── productController.ts    # Inventory handlers
│   │   │   └── challanController.ts    # Sales Challan handlers
│   │   ├── middleware/
│   │   │   └── authMiddleware.ts       # JWT protect & RBAC authorize
│   │   ├── routes/                     # Express API routing definitions
│   │   ├── utils/                      # Prisma client, S3 config
│   │   └── server.ts                   # Application entry point
│   ├── uploads/                        # Local product image storage (fallback)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.tsx              # Sidebar, topbar & impersonation banner
│   │   ├── context/
│   │   │   └── AuthContext.tsx         # Auth state + impersonation handlers
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx           # Role-aware summary dashboard
│   │   │   ├── Accounts.tsx            # Admin user management panel
│   │   │   ├── Customers.tsx           # CRM management
│   │   │   ├── Products.tsx            # Inventory & product catalog
│   │   │   ├── Challans.tsx            # Sales challans
│   │   │   ├── StockLogs.tsx           # Inventory audit trail
│   │   │   └── Login.tsx               # Auth page
│   │   ├── App.tsx                     # App routing & protected routes
│   │   └── index.css                   # Main stylesheet & global themes
│   └── package.json
├── render.yaml                         # Render IaC deployment config
├── docker-compose.yml                  # Docker PostgreSQL container
├── Mini_ERP_Postman_Collection.json    # Postman API Testing Collection
└── README.md
```

---

## ⚡ Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/)
- [PostgreSQL](https://www.postgresql.org/) (or SQLite for local dev)

---

### 1. Environment Setup

Create `.env` files in the `backend/` directory:

#### **Backend (`backend/.env`)**
```env
PORT=5000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mini_erp?schema=public"
JWT_SECRET="super_secret_jwt_key_change_in_production"

# ☁️ AWS S3 — Optional (for persistent cloud image storage)
# If NOT set, product images fall back to local disk storage
AWS_ACCESS_KEY_ID="your_aws_access_key_id"
AWS_SECRET_ACCESS_KEY="your_aws_secret_access_key"
AWS_REGION="eu-north-1"
AWS_S3_BUCKET_NAME="your-s3-bucket-name"
```

#### **Frontend (`frontend/.env`)**
```env
# Optional: only needed if deploying frontend separately
# Leave empty to use relative /api path (recommended for single-service deployment)
VITE_API_BASE_URL="http://localhost:5000/api"
```

---

### 2. Backend Setup

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

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
> The frontend application will run at: `http://localhost:5173`

---

## 🔑 Default Seed Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `password123` |
| **Sales** | `sales@example.com` | `password123` |
| **Warehouse** | `warehouse@example.com` | `password123` |
| **Accounts** | `accounts@example.com` | `password123` |

---

## 🧪 API Endpoints

A complete **Postman Collection** is included: [`Mini_ERP_Postman_Collection.json`](./Mini_ERP_Postman_Collection.json).

### Key Routes Overview

| Category | Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/login` | Authenticate user & receive JWT | Public |
| **Auth** | `POST` | `/api/auth/register` | Register a new user | Public |
| **Users** | `GET` | `/api/users` | List all user accounts | Admin |
| **Users** | `POST` | `/api/users` | Create a new user account | Admin |
| **Users** | `PUT` | `/api/users/:id` | Update user details / toggle ON-OFF | Admin |
| **Users** | `DELETE` | `/api/users/:id` | Delete user account | Admin |
| **Users** | `POST` | `/api/users/:id/impersonate` | Enter another user's session | Admin |
| **CRM** | `GET` | `/api/customers` | Fetch all customer accounts | Admin, Sales, Accounts |
| **CRM** | `POST` | `/api/customers` | Create a new customer lead | Admin, Sales |
| **CRM** | `PUT` | `/api/customers/:id` | Update customer details / add note | Admin, Sales |
| **Products** | `GET` | `/api/products` | Get inventory list with stock levels | All Roles |
| **Products** | `POST` | `/api/products` | Create product with image upload | Admin, Warehouse |
| **Products** | `PUT` | `/api/products/:id` | Update product / adjust stock | Admin, Warehouse |
| **Challans** | `GET` | `/api/challans` | List all sales challans | All Roles |
| **Challans** | `POST` | `/api/challans` | Create & issue new sales challan | Admin, Sales |

---

## 🐳 Docker Setup (Optional)

Run PostgreSQL locally via Docker:

```bash
docker-compose up -d
```

---

## 🛡️ Database Transaction & Inventory Integrity

- **Preventing Negative Stock**: When a sales challan is created, the system checks product stock availability within a database transaction block (`prisma.$transaction`).
- **Atomic Operations**: If stock for any item in the order is insufficient, the entire transaction rolls back cleanly, preventing partial updates.
- **Automated Stock Audit**: Every stock deduction automatically inserts a row into the `StockLog` table with a historical timestamp and reference details.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
