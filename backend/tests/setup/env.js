// Runs before every test file, BEFORE the app (and its DB connection) loads.
// dotenv never overrides variables that already exist, so values set here
// win over anything in .env. DB_USER / DB_PASSWORD / DB_HOST still come from .env.
process.env.NODE_ENV = 'test';
process.env.DB_NAME = process.env.TEST_DB_NAME || 'spendwise_test';
process.env.JWT_SECRET = 'test-secret-do-not-use-in-production';
process.env.JWT_ACCESS_EXPIRES_IN = '15m';

// Never send real email from tests (empty = "not configured" => codes are only logged).
process.env.SMTP_HOST = '';
process.env.SMTP_USER = '';
process.env.SMTP_PASS = '';
process.env.BREVO_API_KEY = '';
process.env.EMAIL_FROM = '';
// Silence expected noise (dev-mode OTP banners, handled-error stack traces).
// Run `SHOW_LOGS=1 npm test` to see them while debugging.
if (!process.env.SHOW_LOGS) {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
}