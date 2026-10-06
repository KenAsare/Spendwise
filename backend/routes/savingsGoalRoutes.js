const express = require('express');
const router = express.Router();
const {
  getAllGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  contributeToGoal,
  withdrawFromGoal,
} = require('../controllers/savingsGoalController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/', getAllGoals);
router.post('/', createGoal);
router.put('/:id', updateGoal);
router.delete('/:id', deleteGoal);
router.post('/:id/contribute', contributeToGoal);
router.post('/:id/withdraw', withdrawFromGoal);

module.exports = router;