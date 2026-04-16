jest.mock('../models/Guide', () => ({
  find: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
}));

const Guide = require('../models/Guide');
const { getGuides, updateGuideStatus, deleteGuide } = require('../controllers/guideController');
const { createRes } = require('./utils');

describe('controllers/guideController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getGuides returns guides list', async () => {
    const guides = [{ _id: 'g1', fullName: 'Guide 1' }];
    const sort = jest.fn().mockResolvedValue(guides);
    const select = jest.fn().mockReturnValue({ sort });
    Guide.find.mockReturnValue({ select });

    const res = createRes();
    await getGuides({}, res);

    expect(Guide.find).toHaveBeenCalled();
    expect(select).toHaveBeenCalledWith('-password');
    expect(sort).toHaveBeenCalledWith('-createdAt');
    expect(res.json).toHaveBeenCalledWith(guides);
  });

  test('getGuides handles server error', async () => {
    Guide.find.mockImplementation(() => {
      throw new Error('db fail');
    });

    const res = createRes();
    await getGuides({}, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].message).toBe('Server error');
  });

  test('updateGuideStatus returns 400 for invalid status', async () => {
    const req = { body: { status: 'wrong' }, params: { id: 'g1' } };
    const res = createRes();

    await updateGuideStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid status' });
  });

  test('updateGuideStatus returns 404 when guide not found', async () => {
    const select = jest.fn().mockResolvedValue(null);
    Guide.findByIdAndUpdate.mockReturnValue({ select });
    const req = { body: { status: 'approved' }, params: { id: 'gX' } };
    const res = createRes();

    await updateGuideStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Guide not found' });
  });

  test('updateGuideStatus updates guide successfully', async () => {
    const updated = { _id: 'g1', status: 'approved' };
    const select = jest.fn().mockResolvedValue(updated);
    Guide.findByIdAndUpdate.mockReturnValue({ select });

    const req = { body: { status: 'approved' }, params: { id: 'g1' } };
    const res = createRes();
    await updateGuideStatus(req, res);

    expect(Guide.findByIdAndUpdate).toHaveBeenCalledWith('g1', { status: 'approved' }, { new: true });
    expect(res.json).toHaveBeenCalledWith(updated);
  });

  test('updateGuideStatus handles server error', async () => {
    Guide.findByIdAndUpdate.mockImplementation(() => {
      throw new Error('db fail');
    });

    const req = { body: { status: 'approved' }, params: { id: 'g1' } };
    const res = createRes();
    await updateGuideStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].message).toBe('Server error');
  });

  test('deleteGuide returns 404 when missing', async () => {
    Guide.findByIdAndDelete.mockResolvedValue(null);

    const req = { params: { id: 'g1' } };
    const res = createRes();
    await deleteGuide(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Guide not found' });
  });

  test('deleteGuide deletes successfully', async () => {
    Guide.findByIdAndDelete.mockResolvedValue({ _id: 'g1' });

    const req = { params: { id: 'g1' } };
    const res = createRes();
    await deleteGuide(req, res);

    expect(res.json).toHaveBeenCalledWith({ message: 'Guide deleted' });
  });

  test('deleteGuide handles server error', async () => {
    Guide.findByIdAndDelete.mockRejectedValue(new Error('db fail'));

    const req = { params: { id: 'g1' } };
    const res = createRes();
    await deleteGuide(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].message).toBe('Server error');
  });
});
