const {
  app, request, setupDatabase, clearData, closeDatabase,
  registerUser, authHeader, plantVerificationCode, plantResetCode, uniqueEmail,
} = require('./helpers');
const { User, Expense, RefreshToken } = require('../models');

beforeAll(setupDatabase);
beforeEach(clearData);
afterAll(closeDatabase);

describe('POST /api/auth/register', () => {
  it('creates an account and returns tokens without exposing the password', async () => {
    const email = uniqueEmail('new');
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: '  Ama Mensah ', email: email.toUpperCase(), password: 'secret123', confirmPassword: 'secret123' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(res.body.data.refreshToken).toEqual(expect.any(String));
    expect(res.body.data.user).toMatchObject({ name: 'Ama Mensah', email, currency: 'GHS', isVerified: false });
    expect(res.body.data.user).not.toHaveProperty('password');
  });

  it('stores a hashed password, never the plain one', async () => {
    const { user } = await registerUser({ password: 'secret123', confirmPassword: 'secret123' });
    const row = await User.findByPk(user.id);
    expect(row.password).not.toBe('secret123');
    expect(row.password).toMatch(/^\$2[aby]\$/); // bcrypt hash
  });

  it('rejects a duplicate email (case-insensitive) with 409', async () => {
    const { email } = await registerUser();
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Other', email: email.toUpperCase(), password: 'secret123', confirmPassword: 'secret123' });
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it.each([
    ['missing name', { name: '' }, 'name'],
    ['invalid email', { email: 'not-an-email' }, 'email'],
    ['short password', { password: '123', confirmPassword: '123' }, 'password'],
    ['mismatched confirmation', { confirmPassword: 'different' }, 'confirmPassword'],
  ])('returns 400 for %s', async (_label, override, field) => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', email: uniqueEmail(), password: 'secret123', confirmPassword: 'secret123', ...override });
    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveProperty(field);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials', async () => {
    const { email, password } = await registerUser();
    const res = await request(app).post('/api/auth/login').send({ email, password });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(res.body.data.user.email).toBe(email);
  });

  it('is case-insensitive on the email', async () => {
    const { email, password } = await registerUser();
    const res = await request(app).post('/api/auth/login').send({ email: email.toUpperCase(), password });
    expect(res.status).toBe(200);
  });

  it('gives the same error for a wrong password and an unknown email', async () => {
    const { email } = await registerUser();
    const wrongPassword = await request(app).post('/api/auth/login').send({ email, password: 'nope-nope' });
    const unknownEmail = await request(app).post('/api/auth/login').send({ email: uniqueEmail('ghost'), password: 'secret123' });

    expect(wrongPassword.status).toBe(400);
    expect(unknownEmail.status).toBe(400);
    expect(wrongPassword.body.message).toBe(unknownEmail.body.message); // can't enumerate accounts
  });

  it('returns 400 when fields are missing', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveProperty('email');
    expect(res.body.errors).toHaveProperty('password');
  });
});

describe('GET /api/auth/me (protected route)', () => {
  it('returns the current user for a valid token', async () => {
    const { accessToken, email } = await registerUser();
    const res = await request(app).get('/api/auth/me').set(authHeader(accessToken));
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(email);
    expect(res.body.data.user).not.toHaveProperty('password');
  });

  it('rejects a missing token with 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects a garbage token with 401', async () => {
    const res = await request(app).get('/api/auth/me').set(authHeader('not.a.real.token'));
    expect(res.status).toBe(401);
  });

  it('rejects a token with the wrong "Bearer" format with 401', async () => {
    const { accessToken } = await registerUser();
    const res = await request(app).get('/api/auth/me').set('Authorization', accessToken);
    expect(res.status).toBe(401);
  });
});

describe('refresh tokens', () => {
  it('issues a new pair and invalidates the old refresh token (rotation)', async () => {
    const { refreshToken } = await registerUser();

    const first = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(first.status).toBe(200);
    expect(first.body.data.accessToken).toEqual(expect.any(String));
    expect(first.body.data.refreshToken).not.toBe(refreshToken);

    const reuse = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(reuse.status).toBe(401);
  });

  it('new access token works on protected routes', async () => {
    const { refreshToken } = await registerUser();
    const refreshed = await request(app).post('/api/auth/refresh').send({ refreshToken });
    const me = await request(app).get('/api/auth/me').set(authHeader(refreshed.body.data.accessToken));
    expect(me.status).toBe(200);
  });

  it('rejects a missing or unknown refresh token with 401', async () => {
    expect((await request(app).post('/api/auth/refresh').send({})).status).toBe(401);
    expect((await request(app).post('/api/auth/refresh').send({ refreshToken: 'bogus' })).status).toBe(401);
  });

  it('rejects an expired refresh token', async () => {
    const { refreshToken } = await registerUser();
    await RefreshToken.update({ expiresAt: new Date(Date.now() - 1000) }, { where: {} });
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(res.status).toBe(401);
  });

  it('logout revokes the refresh token', async () => {
    const { refreshToken } = await registerUser();
    const out = await request(app).post('/api/auth/logout').send({ refreshToken });
    expect(out.status).toBe(200);
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(res.status).toBe(401);
  });
});

describe('profile, settings and password', () => {
  it('updates name and currency', async () => {
    const { accessToken } = await registerUser();
    const profile = await request(app).put('/api/auth/profile').set(authHeader(accessToken)).send({ name: 'New Name' });
    expect(profile.status).toBe(200);
    expect(profile.body.data.user.name).toBe('New Name');

    const settings = await request(app).put('/api/auth/settings').set(authHeader(accessToken)).send({ currency: 'USD' });
    expect(settings.status).toBe(200);
    expect(settings.body.data.user.currency).toBe('USD');
  });

  it('refuses to change email to one already in use (409)', async () => {
    const a = await registerUser();
    const b = await registerUser();
    const res = await request(app).put('/api/auth/profile').set(authHeader(b.accessToken)).send({ email: a.email });
    expect(res.status).toBe(409);
  });

  it('changes the password: new one works, old one stops working', async () => {
    const { accessToken, email, password } = await registerUser();
    const res = await request(app)
      .put('/api/auth/password')
      .set(authHeader(accessToken))
      .send({ currentPassword: password, newPassword: 'brand-new-pass' });
    expect(res.status).toBe(200);

    expect((await request(app).post('/api/auth/login').send({ email, password: 'brand-new-pass' })).status).toBe(200);
    expect((await request(app).post('/api/auth/login').send({ email, password })).status).toBe(400);
  });

  it('rejects a wrong current password and a too-short new password', async () => {
    const { accessToken, password } = await registerUser();
    const wrong = await request(app).put('/api/auth/password').set(authHeader(accessToken))
      .send({ currentPassword: 'wrong-one', newPassword: 'brand-new-pass' });
    expect(wrong.status).toBe(400);

    const short = await request(app).put('/api/auth/password').set(authHeader(accessToken))
      .send({ currentPassword: password, newPassword: '123' });
    expect(short.status).toBe(400);
  });
});

describe('email verification', () => {
  it('verifies the account with the correct code', async () => {
    const { accessToken, user } = await registerUser();
    const code = await plantVerificationCode(user.id);

    const res = await request(app).post('/api/auth/verify-email').set(authHeader(accessToken)).send({ otp: code });
    expect(res.status).toBe(200);
    expect(res.body.data.user.isVerified).toBe(true);
  });

  it('rejects a wrong code and leaves the account unverified', async () => {
    const { accessToken, user } = await registerUser();
    await plantVerificationCode(user.id, '123456');

    const res = await request(app).post('/api/auth/verify-email').set(authHeader(accessToken)).send({ otp: '000000' });
    expect(res.status).toBe(400);
    expect((await User.findByPk(user.id)).isVerified).toBe(false);
  });

  it('requires login and a code', async () => {
    expect((await request(app).post('/api/auth/verify-email').send({ otp: '123456' })).status).toBe(401);
    const { accessToken } = await registerUser();
    expect((await request(app).post('/api/auth/verify-email').set(authHeader(accessToken)).send({})).status).toBe(400);
  });
});

describe('forgot / reset password', () => {
  it('gives the same generic answer whether or not the email exists', async () => {
    const { email } = await registerUser();
    const known = await request(app).post('/api/auth/forgot-password').send({ email });
    const unknown = await request(app).post('/api/auth/forgot-password').send({ email: uniqueEmail('ghost') });
    expect(known.status).toBe(200);
    expect(unknown.status).toBe(200);
    expect(known.body.message).toBe(unknown.body.message);
  });

  it('resets the password with a valid code and revokes all sessions', async () => {
    const { user, email, refreshToken } = await registerUser();
    await request(app).post('/api/auth/forgot-password').send({ email });
    const code = await plantResetCode(user.id);

    const res = await request(app).post('/api/auth/reset-password').send({ email, otp: code, password: 'after-reset-1' });
    expect(res.status).toBe(200);

    expect((await request(app).post('/api/auth/login').send({ email, password: 'after-reset-1' })).status).toBe(200);
    // the session that existed before the reset must be dead
    expect((await request(app).post('/api/auth/refresh').send({ refreshToken })).status).toBe(401);
  });

  it('a reset code can only be used once', async () => {
    const { user, email } = await registerUser();
    const code = await plantResetCode(user.id);
    expect((await request(app).post('/api/auth/reset-password').send({ email, otp: code, password: 'after-reset-1' })).status).toBe(200);
    expect((await request(app).post('/api/auth/reset-password').send({ email, otp: code, password: 'after-reset-2' })).status).toBe(400);
  });

  it('rejects a wrong code, an expired code, and a short password', async () => {
    const { user, email } = await registerUser();
    await plantResetCode(user.id, '654321');
    expect((await request(app).post('/api/auth/reset-password').send({ email, otp: '000000', password: 'after-reset-1' })).status).toBe(400);

    await plantResetCode(user.id, '654321', new Date(Date.now() - 1000));
    expect((await request(app).post('/api/auth/reset-password').send({ email, otp: '654321', password: 'after-reset-1' })).status).toBe(400);

    await plantResetCode(user.id, '654321');
    expect((await request(app).post('/api/auth/reset-password').send({ email, otp: '654321', password: '123' })).status).toBe(400);
  });
});

describe('DELETE /api/auth/account', () => {
  it('requires the correct password', async () => {
    const { accessToken } = await registerUser();
    expect((await request(app).delete('/api/auth/account').set(authHeader(accessToken)).send({})).status).toBe(400);
    expect((await request(app).delete('/api/auth/account').set(authHeader(accessToken)).send({ password: 'wrong' })).status).toBe(400);
  });

  it('deletes the user and all of their data', async () => {
    const { accessToken, user, email, password } = await registerUser();
    await Expense.create({ userId: user.id, amount: 10, category: 'Food', date: '2026-01-01' });

    const res = await request(app).delete('/api/auth/account').set(authHeader(accessToken)).send({ password });
    expect(res.status).toBe(200);

    expect(await Expense.count({ where: { userId: user.id } })).toBe(0);
    expect((await request(app).post('/api/auth/login').send({ email, password })).status).toBe(400);
    expect((await request(app).get('/api/auth/me').set(authHeader(accessToken))).status).toBe(401);
  });
});