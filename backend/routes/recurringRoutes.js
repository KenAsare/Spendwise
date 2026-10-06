const express = require('express');
const router = express.Router();
const {
  getAllRecurring,
  createRecurring,
  updateRecurring,
  deleteRecurring,
} = require('../controllers/recurringController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/', getAllRecurring);
router.post('/', createRecurring);
router.put('/:id', updateRecurring);
router.delete('/:id', deleteRecurring);

module.exports = router;