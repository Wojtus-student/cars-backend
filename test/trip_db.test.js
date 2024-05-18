// test/trip_db.test.js
const { MongoClient } = require('mongodb');
const { TripDB } = require('../module/trip_db');

jest.mock('mongodb');

describe('TripDB', () => {
  let tripDB;
  let mockCollection;

  beforeEach(() => {
    mockCollection = {
      find: jest.fn(() => ({ toArray: jest.fn().mockResolvedValue([]) })),
      insertOne: jest.fn(),
      findOne: jest.fn(),
      replaceOne: jest.fn(),
      deleteOne: jest.fn(),
    };

    MongoClient.mockImplementation(() => ({
      connect: jest.fn().mockResolvedValue(),
      db: jest.fn(() => ({
        collection: jest.fn(() => mockCollection),
      })),
    }));

    tripDB = new TripDB();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should add a new trip', async () => {
    const tripInfo = { destination: 'Paris', driver: 'testdriver' };

    mockCollection.insertOne.mockResolvedValue({ insertedId: '123' });

    const newId = await tripDB.addTrip(tripInfo, 'driver');

    expect(mockCollection.insertOne).toHaveBeenCalledTimes(1);
    expect(newId).toEqual('123');
  });

  it('should fetch trips by username', async () => {
    const fakeTrips = [{ destination: 'Paris', driver: 'testdriver' }];
    mockCollection.find.mockReturnValue({
      toArray: jest.fn().mockResolvedValue(fakeTrips),
    });

    const trips = await tripDB.fetchCars('testdriver');

    expect(mockCollection.find).toHaveBeenCalledWith({ username: 'testdriver' });
    expect(trips).toEqual(fakeTrips);
  });
});
