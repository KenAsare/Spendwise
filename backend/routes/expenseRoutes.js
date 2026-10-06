const express = require('express');
const router = express.Router();
const {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
} = require('../controllers/expenseController');
const { authenticate } = require('../middleware/authMiddleware');
const { validateExpense } = require('../middleware/validationMiddleware');

router.use(authenticate);

router.get('/', getAllExpenses);
router.post('/', validateExpense, createExpense);
router.get('/:id', getExpenseById);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

module.exports = router;
