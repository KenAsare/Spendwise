const express = require('express');
const router = express.Router();
const {
  getIncomeReport,
  getExpenseReport,
  getBudgetReport,
  getMonthlyReport,
} = require('../controllers/reportController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/', getMonthlyReport);
router.get('/income', getIncomeReport);
router.get('/expenses', getExpenseReport);
router.get('/budgets', getBudgetReport);

module.exports = router;
