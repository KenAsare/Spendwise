// Fast tests that need no database.
const request = require('supertest');
const app = require('../app');
const {
  isValidEmail, isPositiveNumber, validateRegisterInput, validateTransactionInput,
  INCOME_CATEGORIES, EXPENSE_CATEGORIES,
} = require('../utils/validation');
const { hashOTP, generateOTP, hashRefreshToken } = require('../utils/jwt');

describe('app basics', () => {
  it('health check responds 200', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('unknown routes return a JSON 404', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('sets security headers (helmet)', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('does not allow protected data without a token', async () => {
    for (const p of ['/api/income', '/api/expenses', '/api/budgets', '/api/dashboard', '/api/auth/me']) {
      const res = await request(app).get(p);
      expect(res.status).toBe(401);
    }
  });
});

describe('validation helpers', () => {
  it('validates emails', () => {
    expect(isValidEmail('a@b.co')).toBe(true);
    expect(isValidEmail('nope')).toBe(false);
    expect(isValidEmail('a b@c.com')).toBe(false);
    expect(isValidEmail(null)).toBe(false);
  });

  it('accepts only positive numbers', () => {
    expect(isPositiveNumber('12.5')).toBe(true);
    expect(isPositiveNumber(0)).toBe(false);
    expect(isPositiveNumber(-1)).toBe(false);
    expect(isPositiveNumber('abc')).toBe(false);
  });

  it('reports every problem with a bad registration at once', () => {
    const errors = validateRegisterInput({ name: '', email: 'x', password: '1', confirmPassword: '2' });
    expect(Object.keys(errors).sort()).toEqual(['confirmPassword', 'email', 'name', 'password']);
  });

  it('keeps income and expense categories separate', () => {
    expect(validateTransactionInput({ amount: 5, category: 'Salary', date: '2026-01-01' }, INCOME_CATEGORIES)).toEqual({});
    expect(validateTransactionInput({ amount: 5, category: 'Salary', date: '2026-01-01' }, EXPENSE_CATEGORIES))
      .toHaveProperty('category');
  });
});

describe('token helpers', () => {
  beforeAll(() => { process.env.JWT_SECRET = 'x'; });

  it('generates 6-digit codes', () => {
    for (let i = 0; i < 200; i++) expect(generateOTP()).toMatch(/^\d{6}$/);
  });

  it('hashes the same code differently per user, but consistently for one user', () => {
    expect(hashOTP('123456', 1)).toBe(hashOTP('123456', 1));
    expect(hashOTP('123456', 1)).not.toBe(hashOTP('123456', 2));
  });

  it('never stores refresh tokens in plain text', () => {
    expect(hashRefreshToken('abc')).not.toBe('abc');
    expect(hashRefreshToken('abc')).toHaveLength(64);
  });
});