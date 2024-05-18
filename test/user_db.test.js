// test/user_db.test.js
const { MongoClient } = require('mongodb');
const { UserDB } = require('../module/user_db');
const Errors = require('../module/rest_ceptions');

jest.mock('mongodb');

describe('UserDB', () => {
  let userDB;
  let mockCollection;

  beforeEach(() => {
    mockCollection = {
      findOne: jest.fn(),
      insertOne: jest.fn(),
      replaceOne: jest.fn(),
      deleteOne: jest.fn(),
    };

    MongoClient.mockImplementation(() => ({
      connect: jest.fn().mockResolvedValue(),
      db: jest.fn(() => ({
        collection: jest.fn(() => mockCollection),
      })),
    }));

    userDB = new UserDB();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should add a new user', async () => {
    const userInfo = {
      username: 'testuser',
      password: 'password123',
      email: 'test@example.com',
      role: 'regular',
    };

    mockCollection.insertOne.mockResolvedValue({ insertedId: '123' });

    const newId = await userDB.add(userInfo);

    expect(mockCollection.insertOne).toHaveBeenCalledTimes(1);
    expect(newId).toEqual('123');
  });

  it('should fetch a user by ID', async () => {
    const fakeId = '60c72b2f9b1d4c3f8b75f4b1';
    const fakeUser = { _id: fakeId, username: 'testuser' };

    mockCollection.findOne.mockResolvedValue(fakeUser);

    const user = await userDB.fetchById(fakeId);

    expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: fakeId });
    expect(user).toEqual(fakeUser);
  });
});
