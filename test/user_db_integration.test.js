const { MongoClient, ObjectId } = require('mongodb');
const { UserDB } = require('../module/user_db');
const Errors = require('../module/rest_ceptions');

jest.mock('mongodb');
jest.mock('node:crypto', () => ({
    createHmac: () => ({
        update: () => ({
            digest: () => 'hashedpassword'
        })
    })
}));

describe('UserDB Integration Tests', () => {
    let userDB;
    let mockConnect;
    let mockCollection;

    beforeEach(() => {
        userDB = new UserDB();
        mockConnect = MongoClient.prototype.connect.mockResolvedValue();
        mockCollection = {
            findOne: jest.fn(),
            find: jest.fn().mockReturnValue({ toArray: jest.fn() }),
            insertOne: jest.fn(),
            replaceOne: jest.fn(),
            deleteOne: jest.fn()
        };
        userDB.usersCollection = mockCollection;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should process user data correctly', () => {
        const userInfo = {
            username: 'testuser',
            password: 'testpassword',
            email: 'testuser@example.com',
            role: 'admin'
        };

        const processedUser = userDB.process(userInfo);
        expect(processedUser).toHaveProperty('username', 'testuser');
        expect(processedUser).toHaveProperty('password', 'hashedpassword');
        expect(processedUser).toHaveProperty('email', 'testuser@example.com');
        expect(processedUser).toHaveProperty('role', 'admin');
    });

    it('should add a new user', async () => {
        const userInfo = {
            username: 'testuser',
            password: 'testpassword',
            email: 'testuser@example.com',
            role: 'admin'
        };

        mockCollection.findOne.mockResolvedValue(null);
        mockCollection.insertOne.mockResolvedValue({ insertedId: new ObjectId() });

        const userId = await userDB.add(userInfo);
        expect(userId).toBeInstanceOf(ObjectId);
    });

    it('should throw error if user already exists', async () => {
        const userInfo = {
            username: 'testuser',
            password: 'testpassword',
            email: 'testuser@example.com',
            role: 'admin'
        };

        mockCollection.findOne.mockResolvedValue(userInfo);

        await expect(userDB.add(userInfo)).rejects.toThrowError(Errors.ClientError);
    });

    it('should fetch user by ID', async () => {
        const userId = new ObjectId();
        const userInfo = {
            _id: userId,
            username: 'testuser',
            password: 'testpassword',
            email: 'testuser@example.com',
            role: 'admin'
        };

        mockCollection.findOne.mockResolvedValue(userInfo);

        const fetchedUser = await userDB.fetchById(userId);
        expect(fetchedUser).toEqual(userInfo);
    });

    it('should authenticate user with correct credentials', async () => {
        const userInfo = {
            _id: new ObjectId(),
            username: 'testuser',
            password: 'hashedpassword',
            email: 'testuser@example.com',
            role: 'admin'
        };

        mockCollection.findOne.mockResolvedValue(userInfo);

        const authenticatedUser = await userDB.authUser({ username: 'testuser', password: 'testpassword' });
        expect(authenticatedUser).toEqual(userInfo);
    });

    it('should throw error for wrong credentials', async () => {
        const userInfo = {
            _id: new ObjectId(),
            username: 'testuser',
            password: 'hashedpassword',
            email: 'testuser@example.com',
            role: 'admin'
        };

        mockCollection.findOne.mockResolvedValue(userInfo);

        await expect(userDB.authUser({ username: 'testuser', password: 'wrongpassword' })).rejects.toThrowError(Errors.ClientError);
    });

    it('should fetch all users', async () => {
        const users = [
            { username: 'testuser1', email: 'testuser1@example.com', role: 'admin' },
            { username: 'testuser2', email: 'testuser2@example.com', role: 'driver' }
        ];

        mockCollection.find().toArray.mockResolvedValue(users);

        const fetchedUsers = await userDB.fetchAll();
        expect(fetchedUsers).toEqual(users);
    });

    it('should update an existing user', async () => {
        const userId = new ObjectId();
        const existingUser = {
            _id: userId,
            username: 'testuser',
            password: 'hashedpassword',
            email: 'testuser@example.com',
            role: 'admin'
        };
        const updatedUser = {
            _id: userId,
            username: 'testuser',
            password: 'newhashedpassword',
            email: 'testuser@example.com',
            role: 'admin'
        };

        mockCollection.findOne.mockResolvedValue(existingUser);
        mockCollection.replaceOne.mockResolvedValue({ modifiedCount: 1 });

        await userDB.update(userId, updatedUser);
        expect(mockCollection.replaceOne).toHaveBeenCalledWith(existingUser, updatedUser);
    });

    it('should delete an existing user', async () => {
        const userId = new ObjectId();

        mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });

        await userDB.delete(userId);
        expect(mockCollection.deleteOne).toHaveBeenCalledWith({ _id: userId });
    });

    it('should throw error if user does not exist during deletion', async () => {
        const userId = new ObjectId();

        mockCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });

        await expect(userDB.delete(userId)).rejects.toThrowError(Errors.InternalError);
    });

});
