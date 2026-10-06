// Income and expenses share the same behaviour, so one suite covers both.
const {
  app, request, setupDatabase, clearData, closeDatabase, registerUser, authHeader,
} = require('./helpers');

beforeAll(setupDatabase);
beforeEach(clearData);
afterAll(closeDatabase);

const suites = [
  { name: 'income', path: '/api/income', listKey: 'income', itemKey: 'income', category: 'Salary', otherCategory: 'Freelance', badCategory: 'Food' },
  { name: 'expenses', path: '/api/expenses', listKey: 'expenses', itemKey: 'expense', category: 'Food', otherCategory: 'Rent', badCategory: 'Salary' },
];

describe.each(suites)('$name API', ({ path, listKey, itemKey, category, otherCategory, badCategory }) => {
  const make = (token, body = {}) =>
    request(app).post(path).set(authHeader(token)).send({
      amount: 100, category, description: 'Test entry', date: '2026-03-15', ...body,
    });

  describe('authentication', () => {
    it.each(['get', 'post'])('rejects unauthenticated %s with 401', async (method) => {
      const res = await request(app)[method](path).send({});
      expect(res.status).toBe(401);
    });
  });

  describe('create', () => {
    it('creates a record owned by the logged-in user', async () => {
      const { accessToken, user } = await registerUser();
      const res = await make(accessToken, { amount: 250.5 });

      expect(res.status).toBe(201);
      const item = res.body.data[itemKey];
      expect(item).toMatchObject({ category, description: 'Test entry', date: '2026-03-15', userId: user.id });
      expect(Number(item.amount)).toBe(250.5);
    });

    it('stores a missing description as null', async () => {
      const { accessToken } = await registerUser();
      const res = await make(accessToken, { description: undefined });
      expect(res.status).toBe(201);
      expect(res.body.data[itemKey].description).toBeNull();
    });

    it.each([
      ['missing amount', { amount: undefined }, 'amount'],
      ['zero amount', { amount: 0 }, 'amount'],
      ['negative amount', { amount: -5 }, 'amount'],
      ['non-numeric amount', { amount: 'abc' }, 'amount'],
      ['missing category', { category: undefined }, 'category'],
      ['category from the other type', { category: badCategory }, 'category'],
      ['missing date', { date: undefined }, 'date'],
    ])('returns 400 for %s', async (_label, override, field) => {
      const { accessToken } = await registerUser();
      const res = await make(accessToken, override);
      expect(res.status).toBe(400);
      expect(res.body.errors).toHaveProperty(field);
    });
  });

  describe('list, filter, sort and paginate', () => {
    it('returns only the current user’s records', async () => {
      const a = await registerUser();
      const b = await registerUser();
      await make(a.accessToken);
      await make(b.accessToken);
      await make(b.accessToken);

      const res = await request(app).get(path).set(authHeader(a.accessToken));
      expect(res.status).toBe(200);
      expect(res.body.data[listKey]).toHaveLength(1);
      expect(res.body.data.count).toBe(1);
    });

    it('returns a total across all matching records', async () => {
      const { accessToken } = await registerUser();
      await make(accessToken, { amount: 10 });
      await make(accessToken, { amount: 20.5 });
      const res = await request(app).get(path).set(authHeader(accessToken));
      expect(res.body.data.total).toBeCloseTo(30.5, 2);
    });

    it('filters by category', async () => {
      const { accessToken } = await registerUser();
      await make(accessToken, { category });
      await make(accessToken, { category: otherCategory });
      const res = await request(app).get(path).query({ category: otherCategory }).set(authHeader(accessToken));
      expect(res.body.data[listKey]).toHaveLength(1);
      expect(res.body.data[listKey][0].category).toBe(otherCategory);
    });

    it('filters by date range (inclusive)', async () => {
      const { accessToken } = await registerUser();
      await make(accessToken, { date: '2026-01-10' });
      await make(accessToken, { date: '2026-02-10' });
      await make(accessToken, { date: '2026-03-10' });
      const res = await request(app).get(path)
        .query({ startDate: '2026-02-01', endDate: '2026-02-28' }).set(authHeader(accessToken));
      expect(res.body.data[listKey]).toHaveLength(1);
      expect(res.body.data[listKey][0].date).toBe('2026-02-10');
    });

    it('searches description text', async () => {
      const { accessToken } = await registerUser();
      await make(accessToken, { description: 'weekly groceries' });
      await make(accessToken, { description: 'something else' });
      const res = await request(app).get(path).query({ search: 'grocer' }).set(authHeader(accessToken));
      expect(res.body.data[listKey]).toHaveLength(1);
    });

    it('sorts newest first by default and oldest first when asked', async () => {
      const { accessToken } = await registerUser();
      await make(accessToken, { date: '2026-01-01' });
      await make(accessToken, { date: '2026-06-01' });

      const desc = await request(app).get(path).set(authHeader(accessToken));
      expect(desc.body.data[listKey].map((r) => r.date)).toEqual(['2026-06-01', '2026-01-01']);

      const asc = await request(app).get(path).query({ sortOrder: 'ASC' }).set(authHeader(accessToken));
      expect(asc.body.data[listKey].map((r) => r.date)).toEqual(['2026-01-01', '2026-06-01']);
    });

    it('paginates: page size, last partial page, and totals', async () => {
      const { accessToken } = await registerUser();
      for (let i = 1; i <= 25; i++) {
        await make(accessToken, { amount: i, date: `2026-03-${String(i).padStart(2, '0')}` });
      }

      const page1 = await request(app).get(path).query({ page: 1, limit: 10 }).set(authHeader(accessToken));
      expect(page1.body.data[listKey]).toHaveLength(10);
      expect(page1.body.data.pagination).toEqual({ page: 1, limit: 10, totalCount: 25, totalPages: 3 });

      const page3 = await request(app).get(path).query({ page: 3, limit: 10 }).set(authHeader(accessToken));
      expect(page3.body.data[listKey]).toHaveLength(5);

      const beyond = await request(app).get(path).query({ page: 9, limit: 10 }).set(authHeader(accessToken));
      expect(beyond.body.data[listKey]).toHaveLength(0);

      // total covers ALL 25 records (1+2+...+25 = 325), not just the page shown
      expect(page1.body.data.total).toBe(325);
    });

    it('defaults to 20 per page and survives nonsense page values', async () => {
      const { accessToken } = await registerUser();
      for (let i = 0; i < 22; i++) await make(accessToken);
      const res = await request(app).get(path).query({ page: -4, limit: 'abc' }).set(authHeader(accessToken));
      expect(res.status).toBe(200);
      expect(res.body.data[listKey]).toHaveLength(20);
      expect(res.body.data.pagination.page).toBe(1);
    });
  });

  describe('read / update / delete', () => {
    it('gets a single record by id', async () => {
      const { accessToken } = await registerUser();
      const created = (await make(accessToken)).body.data[itemKey];
      const res = await request(app).get(`${path}/${created.id}`).set(authHeader(accessToken));
      expect(res.status).toBe(200);
      expect(res.body.data[itemKey].id).toBe(created.id);
    });

    it('updates only the fields provided', async () => {
      const { accessToken } = await registerUser();
      const created = (await make(accessToken, { amount: 100 })).body.data[itemKey];

      const res = await request(app).put(`${path}/${created.id}`).set(authHeader(accessToken))
        .send({ amount: 175.25, description: 'Edited' });
      expect(res.status).toBe(200);

      const item = res.body.data[itemKey];
      expect(Number(item.amount)).toBe(175.25);
      expect(item.description).toBe('Edited');
      expect(item.category).toBe(category); // untouched
      expect(item.date).toBe('2026-03-15'); // untouched
    });

    it('deletes a record, after which it is gone', async () => {
      const { accessToken } = await registerUser();
      const created = (await make(accessToken)).body.data[itemKey];

      expect((await request(app).delete(`${path}/${created.id}`).set(authHeader(accessToken))).status).toBe(200);
      expect((await request(app).get(`${path}/${created.id}`).set(authHeader(accessToken))).status).toBe(404);
      expect((await request(app).delete(`${path}/${created.id}`).set(authHeader(accessToken))).status).toBe(404);
    });

    it('returns 404 for an id that does not exist', async () => {
      const { accessToken } = await registerUser();
      expect((await request(app).get(`${path}/999999`).set(authHeader(accessToken))).status).toBe(404);
      expect((await request(app).put(`${path}/999999`).set(authHeader(accessToken)).send({ amount: 1 })).status).toBe(404);
      expect((await request(app).delete(`${path}/999999`).set(authHeader(accessToken))).status).toBe(404);
    });
  });

  describe('data isolation between users', () => {
    it('stops another user from reading, editing or deleting a record', async () => {
      const owner = await registerUser();
      const intruder = await registerUser();
      const created = (await make(owner.accessToken, { amount: 500 })).body.data[itemKey];
      const url = `${path}/${created.id}`;

      expect((await request(app).get(url).set(authHeader(intruder.accessToken))).status).toBe(404);
      expect((await request(app).put(url).set(authHeader(intruder.accessToken)).send({ amount: 1 })).status).toBe(404);
      expect((await request(app).delete(url).set(authHeader(intruder.accessToken))).status).toBe(404);

      // ...and the owner's record is untouched
      const still = await request(app).get(url).set(authHeader(owner.accessToken));
      expect(still.status).toBe(200);
      expect(Number(still.body.data[itemKey].amount)).toBe(500);
    });
  });
});