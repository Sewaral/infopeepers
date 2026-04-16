jest.mock('express-validator', () => ({
  validationResult: jest.fn(),
}));

jest.mock('../models/Pepper', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndDelete: jest.fn(),
}));

const { validationResult } = require('express-validator');
const Pepper = require('../models/Pepper');
const {
  addPepper,
  getPeppers,
  getPepper,
  deletePepper,
} = require('../controllers/pepperController');
const { createRes } = require('./utils');

describe('controllers/pepperController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    validationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });
  });

  test('addPepper returns 400 on validation error', async () => {
    validationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => [{ msg: 'bad input' }],
    });

    const req = { body: {}, user: { id: 'admin1' } };
    const res = createRes();
    await addPepper(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ errors: [{ msg: 'bad input' }] });
  });

  test('addPepper returns 409 when duplicate exists', async () => {
    Pepper.findOne.mockResolvedValue({ _id: 'p1' });
    const req = {
      body: { name: 'Bell', description: 'desc' },
      user: { id: 'admin1' },
    };
    const res = createRes();

    await addPepper(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ message: 'A pepper with this name already exists' });
  });

  test('addPepper creates pepper successfully', async () => {
    const created = { _id: 'p2', name: 'Bell' };
    Pepper.findOne.mockResolvedValue(null);
    Pepper.create.mockResolvedValue(created);

    const req = {
      body: {
        name: '  Bell  ',
        description: '  Sweet  ',
        imageUrl: '',
        origin: '',
        color: '',
      },
      user: { id: 'admin1' },
    };
    const res = createRes();
    await addPepper(req, res);

    expect(Pepper.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(created);
  });

  test('addPepper handles server error', async () => {
    Pepper.findOne.mockRejectedValue(new Error('db fail'));
    const req = { body: { name: 'Bell', description: 'desc' }, user: { id: 'admin1' } };
    const res = createRes();

    await addPepper(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].message).toBe('Server error');
  });

  test('getPeppers returns all peppers when no search', async () => {
    const peppers = [{ _id: 'p1' }];
    const sort = jest.fn().mockResolvedValue(peppers);
    const select = jest.fn().mockReturnValue({ sort });
    Pepper.find.mockReturnValue({ select });
    const req = { query: {} };
    const res = createRes();

    await getPeppers(req, res);

    expect(Pepper.find).toHaveBeenCalledWith({});
    expect(res.json).toHaveBeenCalledWith(peppers);
  });

  test('getPeppers applies search filter', async () => {
    const sort = jest.fn().mockResolvedValue([]);
    const select = jest.fn().mockReturnValue({ sort });
    Pepper.find.mockReturnValue({ select });
    const req = { query: { search: ' hab ' } };
    const res = createRes();

    await getPeppers(req, res);

    expect(Pepper.find).toHaveBeenCalledWith({
      name: { $regex: 'hab', $options: 'i' },
    });
  });

  test('getPeppers handles server error', async () => {
    Pepper.find.mockImplementation(() => {
      throw new Error('db fail');
    });
    const res = createRes();

    await getPeppers({ query: {} }, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].message).toBe('Server error');
  });

  test('getPepper returns 404 when not found', async () => {
    const populate = jest.fn().mockResolvedValue(null);
    Pepper.findById.mockReturnValue({ populate });
    const req = { params: { id: 'none' } };
    const res = createRes();

    await getPepper(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Pepper not found' });
  });

  test('getPepper returns pepper when found', async () => {
    const pepper = { _id: 'p1', name: 'Bell' };
    const populate = jest.fn().mockResolvedValue(pepper);
    Pepper.findById.mockReturnValue({ populate });
    const req = { params: { id: 'p1' } };
    const res = createRes();

    await getPepper(req, res);

    expect(res.json).toHaveBeenCalledWith(pepper);
  });

  test('getPepper handles server error', async () => {
    Pepper.findById.mockImplementation(() => {
      throw new Error('db fail');
    });
    const req = { params: { id: 'p1' } };
    const res = createRes();

    await getPepper(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].message).toBe('Server error');
  });

  test('deletePepper returns 404 when not found', async () => {
    Pepper.findByIdAndDelete.mockResolvedValue(null);
    const req = { params: { id: 'p1' } };
    const res = createRes();

    await deletePepper(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Pepper not found' });
  });

  test('deletePepper deletes successfully', async () => {
    Pepper.findByIdAndDelete.mockResolvedValue({ _id: 'p1' });
    const req = { params: { id: 'p1' } };
    const res = createRes();

    await deletePepper(req, res);

    expect(res.json).toHaveBeenCalledWith({ message: 'Pepper deleted' });
  });

  test('deletePepper handles server error', async () => {
    Pepper.findByIdAndDelete.mockRejectedValue(new Error('db fail'));
    const req = { params: { id: 'p1' } };
    const res = createRes();

    await deletePepper(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].message).toBe('Server error');
  });
});
