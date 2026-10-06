const express = require('express');
const router = express.Router();
const {
  getAllIncome,
  getIncomeById,
  createIncome,
  updateIncome,
  deleteIncome,
} = require('../controllers/incomeController');
const { authenticate } = require('../middleware/authMiddleware');
const { validateIncome } = require('../middleware/validationMiddleware');

router.use(authenticate);

router.get('/', getAllIncome);
router.post('/', validateIncome, createIncome);
router.get('/:id', getIncomeById);
router.put('/:id', updateIncome);
router.delete('/:id', deleteIncome);

module.exports = router;
