const request = require('supertest');

jest.mock('../models/User', () => ({
  findOne: jest.fn(),
}));

jest.mock('../models/Guide', () => ({
  create: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(async (v) => `hashed:${v}`),
  compare: jest.fn(async (plain, hashed) => hashed === `hashed:${plain}`),
}));

const User = require('../models/User');
const Guide = require('../models/Guide');
const app = require('../app');

describe('flow: auth and guide approval (no DB)', () => {
  let adminToken;
  let guidesStore;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    jest.clearAllMocks();

    guidesStore = [];

    User.findOne.mockImplementation(async ({ email, role }) => {
      if (email === 'admin@peppers.com' && role === 'admin') {
        return {
          _id: 'admin-1',
          fullName: 'Admin',
          email: 'admin@peppers.com',
          role: 'admin',
          password: 'hashed:admin123',
        };
      }
      return null;
    });

    Guide.create.mockImplementation(async (payload) => {
      const created = { _id: 'guide-1', ...payload, createdAt: new Date().toISOString() };
      guidesStore.push(created);
      return created;
    });

    Guide.findOne.mockImplementation(async ({ email }) => guidesStore.find((g) => g.email === email) || null);

    Guide.find.mockImplementation(() => ({
      select: () => ({
        sort: async () => guidesStore,
      }),
    }));

    Guide.findByIdAndUpdate.mockImplementation((id, update) => ({
      select: async () => {
        const idx = guidesStore.findIndex((g) => g._id === id);
        if (idx < 0) return null;
        guidesStore[idx] = { ...guidesStore[idx], ...update };
        return guidesStore[idx];
      },
    }));
  });

  test('admin can login, view guides, approve guide, and guide can then login', async () => {
    const registerGuideRes = await request(app)
      .post('/api/auth/guide/register')
      .send({
        fullName: 'Guide One',
        email: 'guide1@peppers.com',
        password: 'guide123',
        confirmPassword: 'guide123',
        jobTitle: 'Field Guide',
        experience: '2 years',
      });

    expect(registerGuideRes.status).toBe(201);
    expect(registerGuideRes.body.message).toContain('Awaiting admin approval');

    const guideLoginPendingRes = await request(app)
      .post('/api/auth/guide/login')
      .send({
        email: 'guide1@peppers.com',
        password: 'guide123',
      });
    expect(guideLoginPendingRes.status).toBe(403);
    expect(guideLoginPendingRes.body.message).toContain('pending admin approval');

    const adminLoginRes = await request(app)
      .post('/api/auth/admin/login')
      .send({
        email: 'admin@peppers.com',
        password: 'admin123',
      });

    expect(adminLoginRes.status).toBe(200);
    adminToken = adminLoginRes.body.token;
    expect(adminLoginRes.body.user.role).toBe('admin');

    const getGuidesRes = await request(app)
      .get('/api/guides')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(getGuidesRes.status).toBe(200);
    expect(Array.isArray(getGuidesRes.body)).toBe(true);
    expect(getGuidesRes.body.length).toBe(1);

    const guideId = getGuidesRes.body[0]._id;

    const approveRes = await request(app)
      .patch(`/api/guides/${guideId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved' });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.status).toBe('approved');

    const guideLoginApprovedRes = await request(app)
      .post('/api/auth/guide/login')
      .send({
        email: 'guide1@peppers.com',
        password: 'guide123',
      });

    expect(guideLoginApprovedRes.status).toBe(200);
    expect(guideLoginApprovedRes.body.user.role).toBe('guide');

    const guideFromStore = await Guide.findOne({ email: 'guide1@peppers.com' });
    expect(guideFromStore.status).toBe('approved');
  });
});
