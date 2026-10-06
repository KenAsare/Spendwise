// Opt IN to the rate limiter (it is normally switched off under test).
// Must be set before the app is loaded. Needs no database: requests are
// rejected by validation after passing the limiter, so no queries run.
process.env.ENABLE_RATE_LIMIT = 'true';

const request = require('supertest');
const app = require('../app');

describe('auth rate limiting', () => {
  it('blocks login attempts after 10 requests from one IP with 429', async () => {
    const statuses = [];
    for (let i = 0; i < 11; i++) {
      const res = await request(app).post('/api/auth/login').send({}); // 400 = got past the limiter
      statuses.push(res.status);
    }
    expect(statuses.slice(0, 10).every((s) => s === 400)).toBe(true);
    expect(statuses[10]).toBe(429);
  });
});