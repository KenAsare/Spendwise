const request = require('supertest');
const app = require('../app');
const {
  sequelize,
  User,
  EmailVerificationToken,
  PasswordResetToken,
} = require('../models');
const { hashOTP } = require('../utils/jwt');

// Safety net: these tests DROP and recreate every table. Refuse to run
// unless we are pointed at a database whose name ends in "_test".
const assertTestDatabase = () => {
  const name = sequelize.config.database || '';
  if (!/_test$/.test(name)) {
    throw new Error(
      `Refusing to run tests against database "${name}". ` +
        'Use a dedicated database whose name ends in "_test" (default: spendwise_test).'
    );
  }
};

// Call once per test file (beforeAll): fresh empty tables.
const setupDatabase = async () => {
  assertTestDatabase();
  await sequelize.sync({ force: true });
};

// Call between tests (beforeEach): deleting users cascades to all their data.
const clearData = async () => {
  assertTestDatabase();
  await User.destroy({ where: {} });
};

const closeDatabase = async () => {
  await sequelize.close();
};

// register() sends the verification email in the background. Wait for that
// to finish so it can't race with later steps or with the next test's cleanup.
const waitForVerificationToken = async (userId, timeoutMs = 3000) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const row = await EmailVerificationToken.findOne({ where: { userId } });
    if (row) return row;
    await new Promise((r) => setTimeout(r, 25));
  }
  return null;
};

let counter = 0;
const uniqueEmail = (prefix = 'user') => `${prefix}${Date.now()}${counter++}@example.com`;

const defaultUser = (overrides = {}) => ({
  name: 'Test User',
  email: uniqueEmail(),
  password: 'secret123',
  confirmPassword: 'secret123',
  ...overrides,
});

// Registers through the real endpoint. Returns the user, tokens and credentials.
const registerUser = async (overrides = {}) => {
  const payload = defaultUser(overrides);
  const res = await request(app).post('/api/auth/register').send(payload);
  if (res.status !== 201) {
    throw new Error(`registerUser failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  await waitForVerificationToken(res.body.data.user.id);
  return {
    user: res.body.data.user,
    accessToken: res.body.data.accessToken,
    refreshToken: res.body.data.refreshToken,
    email: payload.email.toLowerCase(),
    password: payload.password,
  };
};

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

// The real codes are only emailed/logged, so tests plant a code they know.
const plantVerificationCode = async (userId, code = '123456') => {
  await EmailVerificationToken.destroy({ where: { userId } });
  await EmailVerificationToken.create({
    userId,
    tokenHash: hashOTP(code, userId),
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
  });
  return code;
};

const plantResetCode = async (userId, code = '654321', expiresAt) => {
  await PasswordResetToken.destroy({ where: { userId } });
  await PasswordResetToken.create({
    userId,
    tokenHash: hashOTP(code, userId),
    expiresAt: expiresAt || new Date(Date.now() + 15 * 60 * 1000),
  });
  return code;
};

module.exports = {
  app,
  request,
  setupDatabase,
  clearData,
  closeDatabase,
  registerUser,
  authHeader,
  plantVerificationCode,
  plantResetCode,
  uniqueEmail,
};