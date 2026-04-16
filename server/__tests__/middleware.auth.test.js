const jwt = require('jsonwebtoken');
const { protect, requireRole } = require('../middleware/auth');
const { createRes } = require('./utils');

describe('middleware/auth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('protect returns 401 when token header missing', () => {
    const req = { headers: {} };
    const res = createRes();
    const next = jest.fn();

    protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized, no token' });
    expect(next).not.toHaveBeenCalled();
  });

  test('protect returns 401 when token is invalid', () => {
    jest.spyOn(jwt, 'verify').mockImplementation(() => {
      throw new Error('invalid');
    });

    const req = { headers: { authorization: 'Bearer bad-token' } };
    const res = createRes();
    const next = jest.fn();

    protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized, invalid token' });
    expect(next).not.toHaveBeenCalled();
  });

  test('protect attaches decoded user and calls next for valid token', () => {
    const payload = { id: 'u1', role: 'admin' };
    jest.spyOn(jwt, 'verify').mockReturnValue(payload);

    const req = { headers: { authorization: 'Bearer ok-token' } };
    const res = createRes();
    const next = jest.fn();

    protect(req, res, next);

    expect(req.user).toEqual(payload);
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('requireRole allows matching role', () => {
    const req = { user: { role: 'admin' } };
    const res = createRes();
    const next = jest.fn();
    const middleware = requireRole('admin', 'guide');

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  test('requireRole blocks non-matching role', () => {
    const req = { user: { role: 'visitor' } };
    const res = createRes();
    const next = jest.fn();
    const middleware = requireRole('admin');

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Access denied' });
    expect(next).not.toHaveBeenCalled();
  });
});
