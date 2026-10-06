# Spendwise — Expense & Budget Management System

A full-stack expense and budget management application. React (Vite) frontend,
Node.js/Express backend, MySQL database via Sequelize, JWT authentication.

This has been built and **verified end-to-end**: registration, login, JWT auth,
income/expense/budget CRUD, dashboard aggregation, and reports were all tested
live against a running MySQL-compatible database before delivery. The frontend
was also built successfully with Vite with zero errors.

---

## 1. Project structure

```
spendwise/
├── backend/          Express API, Sequelize models, JWT auth
├── frontend/          React (Vite) client
└── Spendwise.postman_collection.json   Postman collection for API testing
```

See in-app comments and the folder layout below for details:

```
backend/
├── config/database.js         Sequelize MySQL connection
├── controllers/                Route handlers (auth, income, expenses, budgets, dashboard, reports)
├── middleware/                 authMiddleware (JWT), errorMiddleware, validationMiddleware
├── models/                     User, Income, Expense, Budget + associations (models/index.js)
├── routes/                     Express routers per resource
├── utils/                      jwt.js, validation.js
├── app.js                      Express app (middleware + routes)
├── server.js                   Entry point (DB connect/sync + listen)
└── .env.example

frontend/
├── src/
│   ├── components/
│   │   ├── common/             Navbar, Sidebar, Layout, ProtectedRoute, Modal, ConfirmDialog,
│   │   │                       SearchBar, FilterBar, TransactionTable, Loading/Empty/Error states
│   │   ├── dashboard/          StatCard
│   │   ├── income/             IncomeForm
│   │   ├── expenses/           ExpenseForm
│   │   ├── budgets/            BudgetForm, BudgetCard
│   │   └── charts/             ChartCard
│   ├── pages/                  Landing, Login, Register, Dashboard, Income, Expenses,
│   │                           Budgets, Transactions, Reports, Profile, Settings
│   ├── context/                AuthContext, ThemeContext, ToastContext
│   ├── services/api.js         Centralized Axios instance + all API calls
│   ├── utils/format.js         Currency/date formatting helpers
│   ├── App.jsx, main.jsx, index.css
└── .env.example
```

---

## 2. Prerequisites

- Node.js 18+ and npm
- MySQL 8+ (or MariaDB 10.6+) running locally or accessible remotely

---

## 3. Database setup

Create the database (the app will create tables automatically via Sequelize
`sync()` — you only need to create the empty schema):

```sql
CREATE DATABASE spendwise_db;
-- optional: a dedicated user instead of root
CREATE USER 'spendwise'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON spendwise_db.* TO 'spendwise'@'localhost';
FLUSH PRIVILEGES;
```

---

## 4. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` with your real database credentials and a strong JWT secret:

```
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_NAME=spendwise_db
DB_USER=root
DB_PASSWORD=your_password

JWT_SECRET=change_this_to_a_long_random_secret
JWT_EXPIRES_IN=7d

CLIENT_URL=http://localhost:5173
```

Start the API:

```bash
npm run dev     # nodemon, auto-restarts on changes
# or
npm start
```

On first run you should see:
```
Database connection established successfully.
Database synced.
Spendwise API running on http://localhost:5000
```

Verify it's alive: `curl http://localhost:5000/api/health`

---

## 5. Frontend setup

In a second terminal:

```bash
cd frontend
npm install
cp .env.example .env
```

`.env` should point at your running backend:
```
VITE_API_URL=http://localhost:5000/api
```

Start the dev server:

```bash
npm run dev
```

Open **http://localhost:5173**. You should land on the public landing page,
from which you can register a new account and get straight into the
dashboard.

---

## 6. Postman testing

Import `Spendwise.postman_collection.json` into Postman. It includes:

- **Auth**: register (+ duplicate-email / missing-field cases), login (+ wrong
  password), get current user (+ no-token / invalid-token cases), update
  profile, change password, update settings, logout
- **Income / Expenses / Budgets**: full CRUD, plus invalid-amount and
  non-existent-record cases
- **Dashboard**: aggregated real-time stats
- **Reports**: monthly, income, expense, and budget reports

The collection auto-captures the JWT into a `token` collection variable after
Register/Login, so every subsequent authenticated request works without
manual copy-pasting. Run **Register** or **Login** first.

---

## 7. API endpoint reference

All endpoints are prefixed with `/api`. Protected endpoints require
`Authorization: Bearer <token>`.

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Create account (name, email, password, confirmPassword) |
| POST | `/auth/login` | Log in (email, password) → JWT |
| POST | `/auth/logout` | Logout (protected) |
| GET | `/auth/me` | Current user (protected) |
| PUT | `/auth/profile` | Update name/email (protected) |
| PUT | `/auth/password` | Change password (protected) |
| PUT | `/auth/settings` | Update currency preference (protected) |

### Income
| Method | Endpoint | Description |
|---|---|---|
| GET | `/income` | List (supports `search`, `category`, `startDate`, `endDate`, `sortBy`, `sortOrder`) |
| POST | `/income` | Create |
| GET | `/income/:id` | Get one |
| PUT | `/income/:id` | Update |
| DELETE | `/income/:id` | Delete |

### Expenses
Same shape as Income, at `/expenses`.

### Budgets
| Method | Endpoint | Description |
|---|---|---|
| GET | `/budgets` | List (supports `month`, `year`, `category`), each with computed `spent`/`remaining`/`percentage`/`status` |
| POST | `/budgets` | Create (rejects duplicate category+month+year with 409) |
| GET | `/budgets/:id` | Get one, with progress |
| PUT | `/budgets/:id` | Update |
| DELETE | `/budgets/:id` | Delete |

### Dashboard
| Method | Endpoint | Description |
|---|---|---|
| GET | `/dashboard` | Totals, current-month stats, recent transactions, 6-month income/expense trend, expense-by-category, budget overview, financial summary |

### Reports
| Method | Endpoint | Description |
|---|---|---|
| GET | `/reports` | Monthly financial report (`month`/`year` or `startDate`/`endDate`) |
| GET | `/reports/income` | Income report (totals, average, by-category) |
| GET | `/reports/expenses` | Expense report (totals, average, highest category, by-category) |
| GET | `/reports/budgets` | Budget report with per-budget progress |

### Response shape
```json
// success
{ "success": true, "message": "...", "data": { ... } }
// error
{ "success": false, "message": "...", "errors": { "field": "..." } }
```

---

## 8. Security notes

- Passwords are hashed with bcrypt (never stored or returned in plain text).
- JWT is required on every protected route; the `authenticate` middleware
  verifies the token and attaches `req.user`.
- Every income/expense/budget query is scoped to `req.user.id` — there is no
  endpoint that lets one user read, edit, or delete another user's records.
- `.env` is git-ignored; only `.env.example` (no real secrets) is committed.

---

## 9. What was verified before delivery

This project was smoke-tested against a live MySQL-compatible server:
register → duplicate-register (409) → login → invalid-login (400) →
authenticated `/me` → create income → create expense → invalid-expense
validation (400) → create budget → dashboard (real aggregated totals) →
monthly report → unauthenticated request (401) → unknown route (404). All
passed. The frontend was also built with `vite build` with zero errors.
