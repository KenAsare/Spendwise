const { Op } = require('sequelize');
const { Income, Expense, Budget } = require('../models');
const { generateDueTransactions } = require('./recurringController');

const monthNames = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// GET /api/dashboard
const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Passively generate any due recurring income/expense entries before
    // computing dashboard totals, so they're reflected immediately.
    await generateDueTransactions(userId);

    const [allIncome, allExpenses, allBudgets] = await Promise.all([
      Income.findAll({ where: { userId } }),
      Expense.findAll({ where: { userId } }),
      Budget.findAll({ where: { userId } }),
    ]);

    const totalIncome = allIncome.reduce((s, i) => s + parseFloat(i.amount), 0);
    const totalExpenses = allExpenses.reduce((s, e) => s + parseFloat(e.amount), 0);
    const balance = totalIncome - totalExpenses;
    const totalBudget = allBudgets.reduce((s, b) => s + parseFloat(b.amount), 0);

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const currentMonthBudgets = allBudgets.filter(
      (b) => b.month === currentMonth && b.year === currentYear
    );
    const currentMonthBudgetTotal = currentMonthBudgets.reduce(
      (s, b) => s + parseFloat(b.amount),
      0
    );

    const currentMonthExpenses = allExpenses.filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
    });
    const currentMonthExpenseTotal = currentMonthExpenses.reduce(
      (s, e) => s + parseFloat(e.amount),
      0
    );
    const remainingBudget = currentMonthBudgetTotal - currentMonthExpenseTotal;

    const currentMonthIncome = allIncome.filter((i) => {
      const d = new Date(i.date);
      return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
    });
    const currentMonthIncomeTotal = currentMonthIncome.reduce(
      (s, i) => s + parseFloat(i.amount),
      0
    );
    const currentMonthBalance = currentMonthIncomeTotal - currentMonthExpenseTotal;

    // Recent transactions (combine income + expenses, sorted by date desc, take 8)
    const recentTransactions = [
      ...allIncome.map((i) => ({
        id: `income-${i.id}`,
        type: 'income',
        category: i.category,
        description: i.description,
        amount: parseFloat(i.amount),
        date: i.date,
      })),
      ...allExpenses.map((e) => ({
        id: `expense-${e.id}`,
        type: 'expense',
        category: e.category,
        description: e.description,
        amount: -parseFloat(e.amount),
        date: e.date,
      })),
    ]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 8);

    // Income vs Expenses over last 6 months
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();

      const monthIncome = allIncome
        .filter((inc) => {
          const dd = new Date(inc.date);
          return dd.getMonth() + 1 === m && dd.getFullYear() === y;
        })
        .reduce((s, inc) => s + parseFloat(inc.amount), 0);

      const monthExpense = allExpenses
        .filter((exp) => {
          const dd = new Date(exp.date);
          return dd.getMonth() + 1 === m && dd.getFullYear() === y;
        })
        .reduce((s, exp) => s + parseFloat(exp.amount), 0);

      monthlyTrend.push({
        month: `${monthNames[m - 1]} ${y}`,
        income: monthIncome,
        expenses: monthExpense,
      });
    }

    // Expense by category
    const categoryMap = {};
    allExpenses.forEach((e) => {
      categoryMap[e.category] = (categoryMap[e.category] || 0) + parseFloat(e.amount);
    });
    const expenseByCategory = Object.entries(categoryMap).map(([category, amount]) => ({
      category,
      amount,
    }));

    // Highest expense category
    let highestCategory = null;
    let highestAmount = 0;
    Object.entries(categoryMap).forEach(([category, amount]) => {
      if (amount > highestAmount) {
        highestAmount = amount;
        highestCategory = category;
      }
    });

    // Budget overview (current month, with progress)
    const budgetOverview = currentMonthBudgets.map((b) => {
      const spent = allExpenses
        .filter((e) => {
          const d = new Date(e.date);
          return (
            e.category === b.category &&
            d.getMonth() + 1 === b.month &&
            d.getFullYear() === b.year
          );
        })
        .reduce((s, e) => s + parseFloat(e.amount), 0);
      const amount = parseFloat(b.amount);
      const percentage = amount > 0 ? Math.round((spent / amount) * 100) : 0;
      return {
        id: b.id,
        category: b.category,
        amount,
        spent,
        remaining: amount - spent,
        percentage,
        status: percentage >= 100 ? 'Over budget' : percentage >= 80 ? 'Near limit' : 'Healthy',
      };
    });

    res.status(200).json({
      success: true,
      message: 'Dashboard data retrieved successfully',
      data: {
        summary: {
          totalIncome,
          totalExpenses,
          balance,
          totalBudget,
          remainingBudget,
        },
        currentMonth: {
          income: currentMonthIncomeTotal,
          expenses: currentMonthExpenseTotal,
          balance: currentMonthBalance,
        },
        recentTransactions,
        monthlyTrend,
        expenseByCategory,
        budgetOverview,
        financialSummary: {
          highestExpenseCategory: highestCategory,
          totalTransactions: allIncome.length + allExpenses.length,
          currentMonthIncome: currentMonthIncomeTotal,
          currentMonthExpenses: currentMonthExpenseTotal,
          currentMonthBalance,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard };