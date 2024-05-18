const request = require('supertest');
const app = require('../main.js');
const { ObjectId } = require('mongodb');
const UserDB = require('../module/user_db.js').UserDB;
const TripDB = require('../module/trip_db.js').TripDB;

// Mock UserDB and TripDB classes
jest.mock('../module/user_db.js');
jest.mock('../module/trip_db.js');

describe('User Endpoints', () => {
    beforeEach(() => {
        UserDB.mockClear();
        TripDB.mockClear();
    });

    it('should create a new user', async () => {
        UserDB.prototype.process.mockReturnValue({
            username: 'testuser',
            password: 'hashedpassword',
            email: 'test@example.com',
            role: 'regular'
        });
        UserDB.prototype.add.mockResolvedValue(new ObjectId().toString());

        const res = await request(app)
            .post('/user')
            .send({ username: 'testuser', password: 'password123', email: 'test@example.com', role: 'regular' });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('newId');
    });

    it('should fetch a user by id', async () => {
        const userId = new ObjectId().toString();
        UserDB.prototype.fetchById.mockResolvedValue({ _id: userId, username: 'testuser', password: 'hashedpassword', email: 'test@example.com', role: 'regular' });

        const res = await request(app).get(`/user/${userId}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('_id', userId);
        expect(res.body).toHaveProperty('password', ':^)');
    });

    it('should update a user by id', async () => {
        const userId = new ObjectId().toString();
        UserDB.prototype.process.mockReturnValue({
            username: 'updateduser',
            password: 'newhashedpassword',
            email: 'updated@example.com',
            role: 'regular'
        });
        UserDB.prototype.update.mockResolvedValue();

        const res = await request(app)
            .put(`/user/${userId}`)
            .send({ username: 'updateduser', password: 'newpassword123', email: 'updated@example.com', role: 'regular' });
        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toEqual('User updated');
    });

    it('should delete a user by id', async () => {
        const userId = new ObjectId().toString();
        UserDB.prototype.delete.mockResolvedValue();

        const res = await request(app).delete(`/user/${userId}`);
        expect(res.statusCode).toEqual(200);
        expect(res.text).toEqual(`OK - Usuwanie usera ${userId}`);
    });
});

describe('Trip Endpoints', () => {
    beforeEach(() => {
        UserDB.mockClear();
        TripDB.mockClear();
    });

    it('should create a new trip', async () => {
        const insertedID = new ObjectId().toString();
        TripDB.prototype.addTrip.mockResolvedValue(insertedID);

        const res = await request(app)
            .post('/trip')
            .send({ name: 'Trip to the beach', user: { role: 'admin' } });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('_id', insertedID);
    });

    it('should fetch a trip by id', async () => {
        const tripID = new ObjectId().toString();
        TripDB.prototype.findTrip.mockResolvedValue({ _id: tripID, name: 'Trip to the beach' });

        const res = await request(app).get(`/trip/${tripID}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('body');
        expect(res.body.body).toHaveProperty('_id', tripID);
    });

    it('should fetch all trips', async () => {
        const tripID = new ObjectId().toString();
        TripDB.prototype.fetchTrips.mockResolvedValue([{ _id: tripID, name: 'Trip to the beach' }]);

        const res = await request(app).get('/trip');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('body');
        expect(res.body.body.length).toBeGreaterThan(0);
        expect(res.body.body[0]).toHaveProperty('_id', tripID);
        expect(res.body.body[0]).toHaveProperty('name', 'Trip to the beach');
    });

    it('should update a trip by id', async () => {
        const tripID = new ObjectId().toString();
        TripDB.prototype.updateTrip.mockResolvedValue(true);

        const res = await request(app)
            .put(`/trip/${tripID}`)
            .send({ name: 'Updated Trip' });
        expect(res.statusCode).toEqual(200);
    });

    it('should delete a trip by id', async () => {
        const tripID = new ObjectId().toString();
        TripDB.prototype.deleteTrip.mockResolvedValue();

        const res = await request(app)
            .delete(`/trip/${tripID}`)
            .send({ user: { role: 'admin' } });
        expect(res.statusCode).toEqual(200);
    });
});
