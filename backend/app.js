require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const incomeRoutes = require('./routes/incomeRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');
const recurringRoutes = require('./routes/recurringRoutes');
const savingsGoalRoutes = require('./routes/savingsGoalRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { generalLimiter } = require('./middleware/rateLimitMiddleware');

const app = express();

const getAllowedOrigins = () => {
  const raw = process.env.CLIENT_URL || 'http://localhost:5173';

  return raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => {
      if (value === '*') return '*';
      return /^https?:\/\//i.test(value) ? value : `https://${value}`;
    });
};

// 'dev' gives concise colored output while coding locally; 'combined' is
// the standard Apache-style format most log aggregators (hosting
// providers, log services) expect once this runs in production.
app.use(
  morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
    skip: () => process.env.NODE_ENV === 'test', // keep test output clean
  })
);
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = getAllowedOrigins();

      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.replace(/\/$/, '');
      const isAllowed = allowedOrigins.some((allowedOrigin) => {
        if (allowedOrigin === '*') return true;
        return allowedOrigin.replace(/\/$/, '') === normalizedOrigin;
      });

      if (isAllowed) {
        return callback(null, true);
      }

      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', generalLimiter);

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Spendwise API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/recurring', recurringRoutes);
app.use('/api/savings-goals', savingsGoalRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;