const { Op } = require('sequelize');
const { Expense } = require('../models');

// GET /api/expenses
const getAllExpenses = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { search, category, startDate, endDate, sortBy, sortOrder } = req.query;

    const where = { userId };

    if (category) where.category = category;

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date[Op.gte] = startDate;
      if (endDate) where.date[Op.lte] = endDate;
    }

    if (search) {
      where[Op.or] = [
        { description: { [Op.like]: `%${search}%` } },
        { category: { [Op.like]: `%${search}%` } },
      ];
    }

    const order = [[sortBy || 'date', (sortOrder || 'DESC').toUpperCase()]];

    const allMatching = await Expense.findAll({ where, order });
    const total = allMatching.reduce((sum, item) => sum + parseFloat(item.amount), 0);

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 20, 1);
    const totalCount = allMatching.length;
    const totalPages = Math.max(Math.ceil(totalCount / limit), 1);
    const startIdx = (page - 1) * limit;
    const expenses = allMatching.slice(startIdx, startIdx + limit);

    res.status(200).json({
      success: true,
      message: 'Expenses retrieved successfully',
      data: {
        expenses,
        total,
        count: totalCount,
        pagination: { page, limit, totalCount, totalPages },
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/expenses/:id
const getExpenseById = async (req, res, next) => {
  try {
    const expense = await Expense.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    res.status(200).json({ success: true, message: 'Expense retrieved', data: { expense } });
  } catch (error) {
    next(error);
  }
};

// POST /api/expenses
const createExpense = async (req, res, next) => {
  try {
    const { amount, category, description, date } = req.body;

    const expense = await Expense.create({
      userId: req.user.id,
      amount,
      category,
      description: description || null,
      date,
    });

    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      data: { expense },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/expenses/:id
const updateExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    const { amount, category, description, date } = req.body;

    if (amount !== undefined) expense.amount = amount;
    if (category !== undefined) expense.category = category;
    if (description !== undefined) expense.description = description;
    if (date !== undefined) expense.date = date;

    await expense.save();

    res.status(200).json({
      success: true,
      message: 'Expense updated successfully',
      data: { expense },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/expenses/:id
const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    await expense.destroy();

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
};