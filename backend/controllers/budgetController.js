const { Op } = require('sequelize');
const { Budget, Expense } = require('../models');

const getStatus = (percentage) => {
  if (percentage >= 100) return 'Over budget';
  if (percentage >= 80) return 'Near limit';
  return 'Healthy';
};

const attachProgress = async (budget) => {
  const userId = budget.userId;
  const startDate = `${budget.year}-${String(budget.month).padStart(2, '0')}-01`;
  const endDateObj = new Date(budget.year, budget.month, 0); // last day of month
  const endDate = endDateObj.toISOString().split('T')[0];

  const expenses = await Expense.findAll({
    where: {
      userId,
      category: budget.category,
      date: { [Op.between]: [startDate, endDate] },
    },
  });

  const spent = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const budgetAmount = parseFloat(budget.amount);
  const remaining = budgetAmount - spent;
  const percentage = budgetAmount > 0 ? Math.round((spent / budgetAmount) * 100) : 0;

  return {
    ...budget.toJSON(),
    spent,
    remaining,
    percentage,
    status: getStatus(percentage),
  };
};

// GET /api/budgets
const getAllBudgets = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { month, year, category } = req.query;

    const where = { userId };
    if (month) where.month = month;
    if (year) where.year = year;
    if (category) where.category = category;

    const budgets = await Budget.findAll({
      where,
      order: [
        ['year', 'DESC'],
        ['month', 'DESC'],
      ],
    });

    const budgetsWithProgress = await Promise.all(budgets.map(attachProgress));

    res.status(200).json({
      success: true,
      message: 'Budgets retrieved successfully',
      data: { budgets: budgetsWithProgress },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/budgets/:id
const getBudgetById = async (req, res, next) => {
  try {
    const budget = await Budget.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    const budgetWithProgress = await attachProgress(budget);

    res.status(200).json({
      success: true,
      message: 'Budget retrieved',
      data: { budget: budgetWithProgress },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/budgets
const createBudget = async (req, res, next) => {
  try {
    const { category, amount, month, year } = req.body;

    const existing = await Budget.findOne({
      where: { userId: req.user.id, category, month, year },
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A budget for this category and month already exists',
      });
    }

    const budget = await Budget.create({
      userId: req.user.id,
      category,
      amount,
      month,
      year,
    });

    const budgetWithProgress = await attachProgress(budget);

    res.status(201).json({
      success: true,
      message: 'Budget created successfully',
      data: { budget: budgetWithProgress },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/budgets/:id
const updateBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    const { category, amount, month, year } = req.body;

    if (category !== undefined) budget.category = category;
    if (amount !== undefined) budget.amount = amount;
    if (month !== undefined) budget.month = month;
    if (year !== undefined) budget.year = year;

    await budget.save();

    const budgetWithProgress = await attachProgress(budget);

    res.status(200).json({
      success: true,
      message: 'Budget updated successfully',
      data: { budget: budgetWithProgress },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/budgets/:id
const deleteBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    await budget.destroy();

    res.status(200).json({
      success: true,
      message: 'Budget deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget,
};
