const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === 'string' && re.test(email);
};

const isStrongEnoughPassword = (password) => {
  return typeof password === 'string' && password.length >= 6;
};

const isPositiveNumber = (value) => {
  const num = Number(value);
  return !isNaN(num) && num > 0;
};

const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Business',
  'Investment',
  'Gift',
  'Bonus',
  'Other',
];

const EXPENSE_CATEGORIES = [
  'Food',
  'Transportation',
  'Rent',
  'Utilities',
  'Shopping',
  'Entertainment',
  'Health',
  'Education',
  'Bills',
  'Travel',
  'Insurance',
  'Other',
];

const validateRegisterInput = ({ name, email, password, confirmPassword }) => {
  const errors = {};
  if (!name || !name.trim()) errors.name = 'Name is required';
  if (!email || !email.trim()) errors.email = 'Email is required';
  else if (!isValidEmail(email)) errors.email = 'Email must be valid';
  if (!password) errors.password = 'Password is required';
  else if (!isStrongEnoughPassword(password))
    errors.password = 'Password must be at least 6 characters';
  if (password !== confirmPassword)
    errors.confirmPassword = 'Passwords do not match';
  return errors;
};

const validateLoginInput = ({ email, password }) => {
  const errors = {};
  if (!email) errors.email = 'Email is required';
  if (!password) errors.password = 'Password is required';
  return errors;
};

const validateTransactionInput = ({ amount, category, date }, categoryList) => {
  const errors = {};
  if (amount === undefined || amount === null || amount === '')
    errors.amount = 'Amount is required';
  else if (!isPositiveNumber(amount))
    errors.amount = 'Amount must be a positive number';
  if (!category) errors.category = 'Category is required';
  else if (categoryList && !categoryList.includes(category))
    errors.category = 'Invalid category';
  if (!date) errors.date = 'Date is required';
  return errors;
};

const validateBudgetInput = ({ amount, category, month, year }) => {
  const errors = {};
  if (amount === undefined || amount === null || amount === '')
    errors.amount = 'Amount is required';
  else if (!isPositiveNumber(amount))
    errors.amount = 'Amount must be a positive number';
  if (!category) errors.category = 'Category is required';
  if (!month) errors.month = 'Month is required';
  if (!year) errors.year = 'Year is required';
  return errors;
};

module.exports = {
  isValidEmail,
  isStrongEnoughPassword,
  isPositiveNumber,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  validateRegisterInput,
  validateLoginInput,
  validateTransactionInput,
  validateBudgetInput,
};
