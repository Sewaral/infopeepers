jest.mock('../models/User', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndDelete: jest.fn(),
}));

const User = require('../models/User');
const { getUsers, deleteUser } = require('../controllers/userController');
const { createRes } = require('./utils');

describe('controllers/userController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getUsers returns visitors list', async () => {
    const users = [{ _id: '1', fullName: 'A' }];
    const sort = jest.fn().mockResolvedValue(users);
    const select = jest.fn().mockReturnValue({ sort });
    User.find.mockReturnValue({ select });

    const req = {};
    const res = createRes();

    await getUsers(req, res);

    expect(User.find).toHaveBeenCalledWith({ role: 'visitor' });
    expect(select).toHaveBeenCalledWith('-password');
    expect(sort).toHaveBeenCalledWith('-createdAt');
    expect(res.json).toHaveBeenCalledWith(users);
  });

  test('getUsers handles server error', async () => {
    User.find.mockImplementation(() => {
      throw new Error('db fail');
    });

    const res = createRes();
    await getUsers({}, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].message).toBe('Server error');
  });

  test('deleteUser returns 404 when user missing', async () => {
    User.findById.mockResolvedValue(null);

    const req = { params: { id: 'none' } };
    const res = createRes();
    await deleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
  });

  test('deleteUser blocks deleting admin account', async () => {
    User.findById.mockResolvedValue({ _id: 'a1', role: 'admin' });

    const req = { params: { id: 'a1' } };
    const res = createRes();
    await deleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Cannot delete admin account' });
  });

  test('deleteUser deletes non-admin successfully', async () => {
    User.findById.mockResolvedValue({ _id: 'u1', role: 'visitor' });
    User.findByIdAndDelete.mockResolvedValue({});

    const req = { params: { id: 'u1' } };
    const res = createRes();
    await deleteUser(req, res);

    expect(User.findByIdAndDelete).toHaveBeenCalledWith('u1');
    expect(res.json).toHaveBeenCalledWith({ message: 'User deleted' });
  });

  test('deleteUser handles server error', async () => {
    User.findById.mockRejectedValue(new Error('db fail'));

    const req = { params: { id: 'u1' } };
    const res = createRes();
    await deleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].message).toBe('Server error');
  });
});
