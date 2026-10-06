const { RecurringTransaction, Income, Expense } = require('../models');

const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Business', 'Investment', 'Gift', 'Bonus', 'Other'];
const EXPENSE_CATEGORIES = [
  'Food', 'Transportation', 'Rent', 'Utilities', 'Shopping', 'Entertainment',
  'Health', 'Education', 'Bills', 'Travel', 'Insurance', 'Other',
];

const daysInMonth = (month, year) => new Date(year, month, 0).getDate();

// Checks every active recurring template for this user and creates the
// real Income/Expense record for any month that's "due" but hasn't been
// generated yet — called automatically whenever relevant pages load, so
// no background job/cron process is needed.
const generateDueTransactions = async (userId) => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const templates = await RecurringTransaction.findAll({ where: { userId, active: true } });
  let generatedCount = 0;

  for (const template of templates) {
    const start = new Date(template.startDate);
    let cursorMonth, cursorYear;

    if (template.lastGeneratedMonth && template.lastGeneratedYear) {
      cursorMonth = template.lastGeneratedMonth + 1;
      cursorYear = template.lastGeneratedYear;
      if (cursorMonth > 12) {
        cursorMonth = 1;
        cursorYear += 1;
      }
    } else {
      cursorMonth = start.getMonth() + 1;
      cursorYear = start.getFullYear();
    }

    while (cursorYear < currentYear || (cursorYear === currentYear && cursorMonth <= currentMonth)) {
      const day = Math.min(template.dayOfMonth, daysInMonth(cursorMonth, cursorYear));
      const dateStr = `${cursorYear}-${String(cursorMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const description = template.description
        ? `${template.description} (recurring)`
        : `Recurring ${template.type}`;

      if (template.type === 'income') {
        await Income.create({
          userId,
          amount: template.amount,
          category: template.category,
          description,
          date: dateStr,
        });
      } else {
        await Expense.create({
          userId,
          amount: template.amount,
          category: template.category,
          description,
          date: dateStr,
        });
      }

      generatedCount += 1;
      template.lastGeneratedMonth = cursorMonth;
      template.lastGeneratedYear = cursorYear;

      cursorMonth += 1;
      if (cursorMonth > 12) {
        cursorMonth = 1;
        cursorYear += 1;
      }
    }

    await template.save();
  }

  return generatedCount;
};

// GET /api/recurring
const getAllRecurring = async (req, res, next) => {
  try {
    await generateDueTransactions(req.user.id);

    const templates = await RecurringTransaction.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      success: true,
      message: 'Recurring transactions retrieved',
      data: { recurring: templates },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/recurring
const createRecurring = async (req, res, next) => {
  try {
    const { type, amount, category, description, dayOfMonth, startDate } = req.body;

    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Type must be income or expense' });
    }
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be a positive number' });
    }
    const validCategories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    if (!category || !validCategories.includes(category)) {
      return res.status(400).json({ success: false, message: 'Invalid category for this type' });
    }
    if (!dayOfMonth || dayOfMonth < 1 || dayOfMonth > 31) {
      return res.status(400).json({ success: false, message: 'Day of month must be between 1 and 31' });
    }
    if (!startDate) {
      return res.status(400).json({ success: false, message: 'Start date is required' });
    }

    const template = await RecurringTransaction.create({
      userId: req.user.id,
      type,
      amount,
      category,
      description: description || null,
      dayOfMonth,
      startDate,
    });

    // Immediately generate anything already due (e.g. if startDate is in the past).
    await generateDueTransactions(req.user.id);

    res.status(201).json({
      success: true,
      message: 'Recurring transaction created successfully',
      data: { recurring: template },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/recurring/:id
const updateRecurring = async (req, res, next) => {
  try {
    const template = await RecurringTransaction.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!template) {
      return res.status(404).json({ success: false, message: 'Recurring transaction not found' });
    }

    const { amount, category, description, dayOfMonth, active } = req.body;
    if (amount !== undefined) template.amount = amount;
    if (category !== undefined) template.category = category;
    if (description !== undefined) template.description = description;
    if (dayOfMonth !== undefined) template.dayOfMonth = dayOfMonth;
    if (active !== undefined) template.active = active;

    await template.save();

    res.status(200).json({
      success: true,
      message: 'Recurring transaction updated successfully',
      data: { recurring: template },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/recurring/:id
const deleteRecurring = async (req, res, next) => {
  try {
    const template = await RecurringTransaction.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!template) {
      return res.status(404).json({ success: false, message: 'Recurring transaction not found' });
    }

    await template.destroy();

    res.status(200).json({
      success: true,
      message: 'Recurring transaction deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllRecurring,
  createRecurring,
  updateRecurring,
  deleteRecurring,
  generateDueTransactions,
};