const { Op } = require('sequelize');
const { Income, Expense, Budget } = require('../models');

const buildDateWhere = (query) => {
  const { startDate, endDate, month, year } = query;
  const where = {};

  if (month && year) {
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const endObj = new Date(year, month, 0);
    const end = endObj.toISOString().split('T')[0];
    where.date = { [Op.between]: [start, end] };
  } else if (year) {
    where.date = { [Op.between]: [`${year}-01-01`, `${year}-12-31`] };
  } else if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date[Op.gte] = startDate;
    if (endDate) where.date[Op.lte] = endDate;
  }

  return where;
};

// GET /api/reports/income
const getIncomeReport = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { category } = req.query;
    const where = { userId, ...buildDateWhere(req.query) };
    if (category) where.category = category;

    const records = await Income.findAll({ where, order: [['date', 'DESC']] });
    const total = records.reduce((s, r) => s + parseFloat(r.amount), 0);

    const byCategory = {};
    records.forEach((r) => {
      byCategory[r.category] = (byCategory[r.category] || 0) + parseFloat(r.amount);
    });

    res.status(200).json({
      success: true,
      message: 'Income report generated',
      data: {
        records,
        total,
        count: records.length,
        average: records.length ? total / records.length : 0,
        byCategory: Object.entries(byCategory).map(([category, amount]) => ({ category, amount })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/reports/expenses
const getExpenseReport = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { category } = req.query;
    const where = { userId, ...buildDateWhere(req.query) };
    if (category) where.category = category;

    const records = await Expense.findAll({ where, order: [['date', 'DESC']] });
    const total = records.reduce((s, r) => s + parseFloat(r.amount), 0);

    const byCategory = {};
    records.forEach((r) => {
      byCategory[r.category] = (byCategory[r.category] || 0) + parseFloat(r.amount);
    });

    let highestCategory = null;
    let highestAmount = 0;
    Object.entries(byCategory).forEach(([category, amount]) => {
      if (amount > highestAmount) {
        highestAmount = amount;
        highestCategory = category;
      }
    });

    res.status(200).json({
      success: true,
      message: 'Expense report generated',
      data: {
        records,
        total,
        count: records.length,
        average: records.length ? total / records.length : 0,
        highestCategory,
        byCategory: Object.entries(byCategory).map(([category, amount]) => ({ category, amount })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/reports/budgets
const getBudgetReport = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { month, year, category } = req.query;

    const where = { userId };
    if (month) where.month = month;
    if (year) where.year = year;
    if (category) where.category = category;

    const budgets = await Budget.findAll({ where });

    const report = await Promise.all(
      budgets.map(async (b) => {
        const start = `${b.year}-${String(b.month).padStart(2, '0')}-01`;
        const endObj = new Date(b.year, b.month, 0);
        const end = endObj.toISOString().split('T')[0];

        const expenses = await Expense.findAll({
          where: {
            userId,
            category: b.category,
            date: { [Op.between]: [start, end] },
          },
        });
        const spent = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);
        const amount = parseFloat(b.amount);
        const percentage = amount > 0 ? Math.round((spent / amount) * 100) : 0;

        return {
          id: b.id,
          category: b.category,
          month: b.month,
          year: b.year,
          amount,
          spent,
          remaining: amount - spent,
          percentage,
          status: percentage >= 100 ? 'Over budget' : percentage >= 80 ? 'Near limit' : 'Healthy',
        };
      })
    );

    res.status(200).json({
      success: true,
      message: 'Budget report generated',
      data: { report },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/reports (monthly financial + category spending summary)
const getMonthlyReport = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const incomeWhere = { userId, ...buildDateWhere(req.query) };
    const expenseWhere = { userId, ...buildDateWhere(req.query) };

    const [incomeRecords, expenseRecords] = await Promise.all([
      Income.findAll({ where: incomeWhere }),
      Expense.findAll({ where: expenseWhere }),
    ]);

    const totalIncome = incomeRecords.reduce((s, r) => s + parseFloat(r.amount), 0);
    const totalExpenses = expenseRecords.reduce((s, r) => s + parseFloat(r.amount), 0);
    const netBalance = totalIncome - totalExpenses;

    const byCategory = {};
    expenseRecords.forEach((r) => {
      byCategory[r.category] = (byCategory[r.category] || 0) + parseFloat(r.amount);
    });

    let highestCategory = null;
    let highestAmount = 0;
    Object.entries(byCategory).forEach(([category, amount]) => {
      if (amount > highestAmount) {
        highestAmount = amount;
        highestCategory = category;
      }
    });

    const totalTransactions = incomeRecords.length + expenseRecords.length;
    const averageExpense = expenseRecords.length ? totalExpenses / expenseRecords.length : 0;

    res.status(200).json({
      success: true,
      message: 'Monthly financial report generated',
      data: {
        totalIncome,
        totalExpenses,
        netBalance,
        totalTransactions,
        highestSpendingCategory: highestCategory,
        averageExpense,
        categorySpending: Object.entries(byCategory).map(([category, amount]) => ({
          category,
          amount,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getIncomeReport,
  getExpenseReport,
  getBudgetReport,
  getMonthlyReport,
};
