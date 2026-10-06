const rateLimit = require('express-rate-limit');

// Automated tests fire dozens of register/login calls from one IP, which
// would trip the limiter. It is switched off under NODE_ENV=test, except
// when a test opts in with ENABLE_RATE_LIMIT=true to test the limiter itself.
const skipInTests = () =>
  process.env.NODE_ENV === 'test' && process.env.ENABLE_RATE_LIMIT !== 'true';

// Applies to login and register: blocks brute-force credential guessing.
// 10 attempts per 15 minutes per IP, then locked out with a 429.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  skip: skipInTests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many attempts. Please try again in a few minutes.',
  },
});

// A looser general limiter for the rest of the API, as a safety net
// against accidental infinite loops or scraping.
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  skip: skipInTests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please slow down and try again shortly.',
  },
});

module.exports = { authLimiter, generalLimiter };