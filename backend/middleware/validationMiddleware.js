const {
  validateRegisterInput,
  validateLoginInput,
  validateTransactionInput,
  validateBudgetInput,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
} = require('../utils/validation');

const runValidation = (errors, res) => {
  if (Object.keys(errors).length > 0) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
    return true;
  }
  return false;
};

const validateRegister = (req, res, next) => {
  const errors = validateRegisterInput(req.body);
  if (runValidation(errors, res)) return;
  next();
};

const validateLogin = (req, res, next) => {
  const errors = validateLoginInput(req.body);
  if (runValidation(errors, res)) return;
  next();
};

const validateIncome = (req, res, next) => {
  const errors = validateTransactionInput(req.body, INCOME_CATEGORIES);
  if (runValidation(errors, res)) return;
  next();
};

const validateExpense = (req, res, next) => {
  const errors = validateTransactionInput(req.body, EXPENSE_CATEGORIES);
  if (runValidation(errors, res)) return;
  next();
};

const validateBudget = (req, res, next) => {
  const errors = validateBudgetInput(req.body);
  if (runValidation(errors, res)) return;
  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateIncome,
  validateExpense,
  validateBudget,
};
