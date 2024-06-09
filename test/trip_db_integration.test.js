const { MongoClient, WriteError, ObjectId } = require('mongodb');
const { TripDB } = require('../module/trip_db');

jest.mock('mongodb');
jest.mock('puppeteer', () => {
    const close = jest.fn();
    return {
        launch: jest.fn().mockResolvedValue({
            newPage: jest.fn().mockResolvedValue({
                goto: jest.fn().mockResolvedValue(),
                evaluate: jest.fn().mockResolvedValue({}),
                waitForNavigation: jest.fn().mockResolvedValue(),
                close
            }),
            close
        })
    };
});

describe('TripDB Integration Tests', () => {
    let tripDB;
    let mockDb;
    let mockCarsCollection;
    let mockTripCollection;

    beforeEach(() => {
        mockCarsCollection = {
            findOne: jest.fn(),
            find: jest.fn().mockReturnValue({ toArray: jest.fn() }),
            insertOne: jest.fn(),
            replaceOne: jest.fn(),
            deleteOne: jest.fn()
        };

        mockTripCollection = {
            findOne: jest.fn(),
            find: jest.fn().mockReturnValue({ toArray: jest.fn() }),
            insertOne: jest.fn(),
            replaceOne: jest.fn(),
            deleteOne: jest.fn()
        };

        mockDb = {
            collection: jest.fn().mockImplementation((name) => {
                if (name === 'cars') return mockCarsCollection;
                if (name === 'trip') return mockTripCollection;
                return null;
            })
        };

        MongoClient.mockImplementation(() => ({
            connect: jest.fn().mockResolvedValue(),
            db: jest.fn().mockReturnValue(mockDb)
        }));

        tripDB = new TripDB();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch all cars', async () => {
        const cars = [{ make: 'Toyota', model: 'Corolla' }];
        mockCarsCollection.find().toArray.mockResolvedValue(cars);

        const fetchedCars = await tripDB.fetchCars();
        expect(fetchedCars).toEqual(cars);
    });

    it('should add a new car', async () => {
        const carInfo = {
            registration: 'ABC123',
            vin: '1HGCM82633A123456',
            registration_date: '2023-06-01'
        };

        mockCarsCollection.findOne.mockResolvedValue(null);
        mockCarsCollection.insertOne.mockResolvedValue({ insertedId: new ObjectId() });

        const carId = await tripDB.addCar(carInfo, 'driver');
        expect(carId).toBeInstanceOf(ObjectId);
    });

    it('should throw error if unauthorized user tries to add car', async () => {
        const carInfo = {
            registration: 'ABC123',
            vin: '1HGCM82633A123456',
            registration_date: '2023-06-01'
        };

        await expect(tripDB.addCar(carInfo, 'regular')).rejects.toThrowError('User not authorized to add cars');
    });

    it('should fetch all trips', async () => {
        const trips = [{ destination: 'City A', distance: 100 }];
        mockTripCollection.find().toArray.mockResolvedValue(trips);

        const fetchedTrips = await tripDB.fetchTrips();
        expect(fetchedTrips).toEqual(trips);
    });

    it('should add a new trip', async () => {
        const tripInfo = {
            username: 'driver1',
            destination: 'City B',
            distance: 150
        };

        mockTripCollection.findOne.mockResolvedValue(null);
        mockTripCollection.insertOne.mockResolvedValue({ insertedId: new ObjectId() });

        const tripId = await tripDB.addTrip(tripInfo, 'admin');
        expect(tripId).toBeInstanceOf(ObjectId);
    });

    it('should throw error if unauthorized user tries to add trip', async () => {
        const tripInfo = {
            username: 'driver1',
            destination: 'City B',
            distance: 150
        };

        await expect(tripDB.addTrip(tripInfo, 'regular')).rejects.toThrowError('Unauthorized user');
    });

    it('should find a trip by criteria', async () => {
        const tripInfo = {
            username: 'driver1',
            destination: 'City A',
            distance: 100
        };

        mockTripCollection.findOne.mockResolvedValue(tripInfo);

        const foundTrip = await tripDB.findTrip({ username: 'driver1', destination: 'City A' });
        expect(foundTrip).toEqual(tripInfo);
    });

    it('should update an existing trip', async () => {
        const tripId = new ObjectId();
        const existingTrip = {
            _id: tripId,
            username: 'driver1',
            destination: 'City A',
            distance: 100
        };
        const updatedTrip = {
            _id: tripId,
            username: 'driver1',
            destination: 'City B',
            distance: 150
        };

        mockTripCollection.find.mockReturnValue({ toArray: jest.fn().mockResolvedValue([existingTrip]) });
        mockTripCollection.replaceOne.mockResolvedValue({ modifiedCount: 1 });

        const result = await tripDB.updateTrip(tripId, updatedTrip, 'driver');
        expect(result).toBe(true);
    });

    it('should delete an existing trip', async () => {
        const tripId = new ObjectId();

        mockTripCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });

        const result = await tripDB.deleteTrip(tripId, 'driver');
        expect(result).toBeUndefined();
    });

    it('should throw error if trip does not exist during deletion', async () => {
        const tripId = new ObjectId();

        mockTripCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });

        await expect(tripDB.deleteTrip(tripId, 'driver')).rejects.toThrowError(WriteError);
    });

    it('should find a car by criteria', async () => {
        const carInfo = {
            registration: 'ABC123',
            vin: '1HGCM82633A123456'
        };

        mockCarsCollection.findOne.mockResolvedValue(carInfo);

        const foundCar = await tripDB.findCar({ registration: 'ABC123' });
        expect(foundCar).toEqual(carInfo);
    });

    it('should update an existing car', async () => {
        const carId = new ObjectId();
        const existingCar = {
            _id: carId,
            registration: 'ABC123',
            vin: '1HGCM82633A123456'
        };
        const updatedCar = {
            _id: carId,
            registration: 'XYZ789',
            vin: '1HGCM82633A654321'
        };

        mockCarsCollection.find.mockReturnValue({ toArray: jest.fn().mockResolvedValue([existingCar]) });
        mockCarsCollection.replaceOne.mockResolvedValue({ modifiedCount: 1 });

        const result = await tripDB.updateCar(carId, updatedCar, 'driver');
        expect(result).toBe(true);
    });

    it('should delete an existing car', async () => {
        const carId = new ObjectId();

        mockCarsCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });

        const result = await tripDB.deleteCar(carId, 'driver');
        expect(result).toBeUndefined();
    });

    it('should throw error if car does not exist during deletion', async () => {
        const carId = new ObjectId();

        mockCarsCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });

        await expect(tripDB.deleteCar(carId, 'driver')).rejects.toThrowError(WriteError);
    });
});
