const { SavingsGoal } = require('../models');

const withProgress = (goal) => {
  const target = parseFloat(goal.targetAmount);
  const current = parseFloat(goal.currentAmount);
  const percentage = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
  return {
    ...goal.toJSON(),
    percentage,
    remaining: Math.max(target - current, 0),
    achieved: current >= target,
  };
};

// GET /api/savings-goals
const getAllGoals = async (req, res, next) => {
  try {
    const goals = await SavingsGoal.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      success: true,
      message: 'Savings goals retrieved',
      data: { goals: goals.map(withProgress) },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/savings-goals
const createGoal = async (req, res, next) => {
  try {
    const { name, targetAmount, targetDate } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Goal name is required' });
    }
    if (!targetAmount || Number(targetAmount) <= 0) {
      return res.status(400).json({ success: false, message: 'Target amount must be a positive number' });
    }

    const goal = await SavingsGoal.create({
      userId: req.user.id,
      name: name.trim(),
      targetAmount,
      targetDate: targetDate || null,
    });

    res.status(201).json({
      success: true,
      message: 'Savings goal created successfully',
      data: { goal: withProgress(goal) },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/savings-goals/:id
const updateGoal = async (req, res, next) => {
  try {
    const goal = await SavingsGoal.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Savings goal not found' });
    }

    const { name, targetAmount, targetDate } = req.body;
    if (name !== undefined) goal.name = name.trim();
    if (targetAmount !== undefined) goal.targetAmount = targetAmount;
    if (targetDate !== undefined) goal.targetDate = targetDate;

    await goal.save();

    res.status(200).json({
      success: true,
      message: 'Savings goal updated successfully',
      data: { goal: withProgress(goal) },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/savings-goals/:id
const deleteGoal = async (req, res, next) => {
  try {
    const goal = await SavingsGoal.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Savings goal not found' });
    }

    await goal.destroy();

    res.status(200).json({
      success: true,
      message: 'Savings goal deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/savings-goals/:id/contribute
const contributeToGoal = async (req, res, next) => {
  try {
    const { amount } = req.body;
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be a positive number' });
    }

    const goal = await SavingsGoal.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Savings goal not found' });
    }

    goal.currentAmount = parseFloat(goal.currentAmount) + Number(amount);
    await goal.save();

    res.status(200).json({
      success: true,
      message: 'Contribution added successfully',
      data: { goal: withProgress(goal) },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/savings-goals/:id/withdraw
const withdrawFromGoal = async (req, res, next) => {
  try {
    const { amount } = req.body;
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be a positive number' });
    }

    const goal = await SavingsGoal.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Savings goal not found' });
    }

    const newAmount = parseFloat(goal.currentAmount) - Number(amount);
    if (newAmount < 0) {
      return res.status(400).json({ success: false, message: 'Cannot withdraw more than the current saved amount' });
    }

    goal.currentAmount = newAmount;
    await goal.save();

    res.status(200).json({
      success: true,
      message: 'Withdrawal recorded successfully',
      data: { goal: withProgress(goal) },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  contributeToGoal,
  withdrawFromGoal,
};