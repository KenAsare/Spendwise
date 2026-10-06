const express = require('express');
const router = express.Router();
const {
  getAllBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget,
} = require('../controllers/budgetController');
const { authenticate } = require('../middleware/authMiddleware');
const { validateBudget } = require('../middleware/validationMiddleware');

router.use(authenticate);

router.get('/', getAllBudgets);
router.post('/', validateBudget, createBudget);
router.get('/:id', getBudgetById);
router.put('/:id', updateBudget);
router.delete('/:id', deleteBudget);

module.exports = router;
