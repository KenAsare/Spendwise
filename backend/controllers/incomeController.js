const { Op } = require('sequelize');
const { Income } = require('../models');

// GET /api/income
const getAllIncome = async (req, res, next) => {
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

    // Fetch every matching row first — needed anyway to compute an accurate
    // total across the FULL filtered set, not just the current page — then
    // slice in memory for pagination. Fine at personal-finance-app scale;
    // would move to DB-level LIMIT/OFFSET if datasets grew much larger.
    const allMatching = await Income.findAll({ where, order });
    const total = allMatching.reduce((sum, item) => sum + parseFloat(item.amount), 0);

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 20, 1);
    const totalCount = allMatching.length;
    const totalPages = Math.max(Math.ceil(totalCount / limit), 1);
    const startIdx = (page - 1) * limit;
    const income = allMatching.slice(startIdx, startIdx + limit);

    res.status(200).json({
      success: true,
      message: 'Income retrieved successfully',
      data: {
        income,
        total,
        count: totalCount,
        pagination: { page, limit, totalCount, totalPages },
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/income/:id
const getIncomeById = async (req, res, next) => {
  try {
    const income = await Income.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!income) {
      return res.status(404).json({ success: false, message: 'Income record not found' });
    }

    res.status(200).json({ success: true, message: 'Income retrieved', data: { income } });
  } catch (error) {
    next(error);
  }
};

// POST /api/income
const createIncome = async (req, res, next) => {
  try {
    const { amount, category, description, date } = req.body;

    const income = await Income.create({
      userId: req.user.id,
      amount,
      category,
      description: description || null,
      date,
    });

    res.status(201).json({
      success: true,
      message: 'Income added successfully',
      data: { income },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/income/:id
const updateIncome = async (req, res, next) => {
  try {
    const income = await Income.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!income) {
      return res.status(404).json({ success: false, message: 'Income record not found' });
    }

    const { amount, category, description, date } = req.body;

    if (amount !== undefined) income.amount = amount;
    if (category !== undefined) income.category = category;
    if (description !== undefined) income.description = description;
    if (date !== undefined) income.date = date;

    await income.save();

    res.status(200).json({
      success: true,
      message: 'Income updated successfully',
      data: { income },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/income/:id
const deleteIncome = async (req, res, next) => {
  try {
    const income = await Income.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!income) {
      return res.status(404).json({ success: false, message: 'Income record not found' });
    }

    await income.destroy();

    res.status(200).json({
      success: true,
      message: 'Income deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllIncome,
  getIncomeById,
  createIncome,
  updateIncome,
  deleteIncome,
};