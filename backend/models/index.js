const sequelize = require('../config/database');
const User = require('./User');
const Income = require('./Income');
const Expense = require('./Expense');
const Budget = require('./Budget');
const RefreshToken = require('./RefreshToken');
const PasswordResetToken = require('./PasswordResetToken');
const EmailVerificationToken = require('./EmailVerificationToken');
const RecurringTransaction = require('./RecurringTransaction');
const SavingsGoal = require('./SavingsGoal');

// User -> Income
User.hasMany(Income, { foreignKey: 'userId', onDelete: 'CASCADE' });
Income.belongsTo(User, { foreignKey: 'userId' });

// User -> Expense
User.hasMany(Expense, { foreignKey: 'userId', onDelete: 'CASCADE' });
Expense.belongsTo(User, { foreignKey: 'userId' });

// User -> Budget
User.hasMany(Budget, { foreignKey: 'userId', onDelete: 'CASCADE' });
Budget.belongsTo(User, { foreignKey: 'userId' });

// User -> RefreshToken
User.hasMany(RefreshToken, { foreignKey: 'userId', onDelete: 'CASCADE' });
RefreshToken.belongsTo(User, { foreignKey: 'userId' });

// User -> PasswordResetToken
User.hasMany(PasswordResetToken, { foreignKey: 'userId', onDelete: 'CASCADE' });
PasswordResetToken.belongsTo(User, { foreignKey: 'userId' });

// User -> EmailVerificationToken
User.hasMany(EmailVerificationToken, { foreignKey: 'userId', onDelete: 'CASCADE' });
EmailVerificationToken.belongsTo(User, { foreignKey: 'userId' });

// User -> RecurringTransaction
User.hasMany(RecurringTransaction, { foreignKey: 'userId', onDelete: 'CASCADE' });
RecurringTransaction.belongsTo(User, { foreignKey: 'userId' });

// User -> SavingsGoal
User.hasMany(SavingsGoal, { foreignKey: 'userId', onDelete: 'CASCADE' });
SavingsGoal.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  sequelize,
  User,
  Income,
  Expense,
  Budget,
  RefreshToken,
  PasswordResetToken,
  EmailVerificationToken,
  RecurringTransaction,
  SavingsGoal,
};