const express = require('express');
const TripDB = require("./module/trip_db.js").TripDB;
const UserDB = require("./module/user_db.js").UserDB;
const Errors = require("./module/rest_ceptions.js");
const { ObjectId } = require('mongodb');

const app = express();
app.use(express.json());
const cors = require('cors');
const user_db = require('./module/user_db.js');


// Dodaj middleware CORS do wszystkich tras
app.use(cors());
//TODO - move to configuration
const PORT = process.env.PORT || 9000;

// app.listen(PORT, () => {
//     console.log("Cars listening on port: ", PORT);
// });

udb = new UserDB();

app.post('/auth', async (res, req) => {
    try {
        let foundUser = await udb.authUser(req.body);
        res.status(200).send(foundUser);
    } catch (e) {
        if (e.code != undefined) {
            res.status(e.code).send(e);

        } else {
            console.error(e);
            res.status(500).send('Internal server error');
        }
    }

});

app.get('/user', async (req, res) => {
    try {
        let foundUsers = await udb.fetchAll();
        for (let i = 0; i < foundUsers.length; i++)
            {
                foundUsers[i].password = ':v)';
            }
        res.status(200).send(foundUsers);
    } catch (e) {
        if (e.code != undefined) {
            res.status(e.code).send(e);

        } else {
            console.error(e);
            res.status(500).send('Internal server error');
        }
    }
});

// TODO - integrate with Mongodb
app.post('/user', async (req, res) => {
    try {

        let formattedUser = udb.process(req.body);
        console.log(formattedUser);
        let newId = await udb.add(formattedUser);
        res.status(200).send({ newId: newId });
    } catch (e) {
        if (e.code != undefined) {
            res.status(e.code).send(e);

        } else {
            console.error(e);
            res.status(500).send('Internal server error');
        }
    }
});

app.get('/user/:userId', async (req, res) => {
    try {
        let id = new ObjectId(req.params.userId);
        let foundUser = await udb.fetchById(id);
        console.log(foundUser);
        // if (foundUser != {}) foundUser.password = ':^)';
        res.status(200).send(foundUser);
    } catch (e) {
        if (e.code != undefined) {
            res.status(e.code).send(e);

        } else {
            console.error(e);
            res.status(500).send('Internal server error');
        }
    }
});

app.put('/user/:userId', async (req, res) => {
    try {
        let formattedUser = udb.process(req.body);
        
        await udb.update(new ObjectId(req.params.userId), formattedUser);
        res.status(200).send({ message: 'User updated' });
    } catch (e) {
        if (e.code != undefined) {
            res.status(e.code).send(e);

        } else {
            console.error(e);
            res.status(500).send('Internal server error');
        }
    }
});

app.delete('/user/:userId', (req, res) => {
    user_db.delete(req.params.userId);
    res.status(200).send(`OK - Usuwanie usera ${req.params.userId}`)
});

//------------------------Endpoints for CRUD operations on trips------------------------//

//TODO: change properties after getting template of body requests.
//TODO: add more sophisticated ways of searching for trip
const tripDB = new TripDB();
//Add trip
app.post('/trip', async (req, res) => {
    if (req.body == {}) {
        res.status(400).send({ message: "provided record is empty" });
    }
    else {
        try {
            console.log(req.body);
            console.log( req.body.user.role);
            let instertedID = await tripDB.addTrip(req.body, req.body.user.role);
            res.status(200).send({ _id: instertedID });
        } catch (e) {
            res.status(500).send({ message: e.message });
        }
    }
});
//Find trip
app.get('/trip/:tripFilter', async (req, res) => {
    let foundRecord = await tripDB.findTrip(req.params.tripFilter);
    if (foundRecord == null) {
        res.status(404).send();
    }
    else {
        res.status(200).send({ body: foundRecord });
    }
});
//Find trip by ID
app.get('/trips/:tripID', async (req, res) => {
    const tripID = req.params.tripID;
    console.log(88*"b");

    try {
        
		console.log(88*"b");
        const foundTrip = await tripDB.findTripByID(tripID);

        if (!foundTrip) {
            return res.status(404).send({ message: "Trip not found" });
        }

        return res.status(200).send({ body: foundTrip });
    } catch (e) {
        console.error(e);
        return res.status(500).send({ message: e.message });
    }
});
//Find all trips
app.get('/trip', async (req, res) => {
    
    
    let foundRecords = await tripDB.fetchTrips();
    if (foundRecords.length == 0) {
        res.status(404).send();
    }
    else {
        res.status(200).send({ body: foundRecords });
    }
});
//Find all trips
app.get('/v2/trip/', async (req, res) => {
    
    let query = req.query;
    console.log(query);
    let params = {};
    if (query.start) params.start = query.start;
    if (query.finish) params.finish = query.finish;
    if (query.data) params.data = query.data;
    if (query.time) params.time = query.time;
    if (query.numberPassangers) params.numberPassangers = query.numberPassangers;
    console.log(params);
    let foundRecords = await tripDB.fetchTripsAll(params);
    if (foundRecords.length == 0) {
        res.status(404).send();
    }
    else {
        res.status(200).send({ body: foundRecords });
    }
});
//Update trip
app.put('/trip/:tripID', async (req, res) => {
    console.log("aaaaaaaaaaaaaaaa");
    if (req.body == null) {
        res.status(400).send({ message: "provided update doesn't change anything" });
    }
    else {
        try {
            if (await tripDB.updateTrip(req.params.tripID, req.body, "admin")) {
                res.status(200).send();
            }
            res.status(404).send();
        } catch (e) {
            res.status(500).send({ message: e.message });
        }
    }
});
//Delete trip
app.delete('/trip/:tripID', async (req, res) => {
    try {
        await tripDB.deleteTrip(req.params.tripID, req.body.user.role);
        res.status(200).send();
    } catch (e) {
        res.status(500).send({ message: e.message });
    }
});
//get all cars
app.get('/car', async (req, res) => {
	
    if (req.body == {}) {
        res.status(400).send({ message: "provided record is empty" });
    }
    else {
        try {
            let instertedID = await tripDB.fetchCars();
            // res.status(200).send(JSON.stringify({ _id: instertedID }));
            res.status(200).send(instertedID);
        } catch (e) {
            res.status(500).send({ message: e.message });
        }
    }
});
//Add car
app.post('/car', async (req, res) => {
    let query = req.body;
    console.log(query);
    let params = {};
    if (query.registration) params.registration = query.registration;
    if (query.vin) params.vin = query.vin;
    if (query.registration_date) params.registration_date = query.registration_date;
    if (query.user) params.user = query.user;
    console.log(params);
    if (params == {}) {
        res.status(400).send({ message: "provided record is empty" });
    }
    else {
        try {
            let instertedID = await tripDB.addCar(params, params.user.role);
            console.log(instertedID);
            // res.status(200).send(JSON.stringify({ _id: instertedID }));
            res.status(200).send(instertedID);
        } catch (e) {
            res.status(500).send({ message: e.message });
        }
    }
});
//Find car
app.get('/car/:carFilter', async (req, res) => {
    let foundRecord = await tripDB.findCar(req.params.carFilter);
    if (foundRecord == null) {
        res.status(404).send();
    }
    else {
        res.status(200).send({ body: foundRecord });
    }
});
app.get('/cars/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const cars = await tripDB.getCarsByUserId(userId);
        res.status(200).send(cars);
    } catch (e) {
        res.status(500).send({ message: e.message });
    }
});
//Update car
app.put('/car/:carID', async (req, res) => {
    if (req.body == null) {
        res.status(400).send({ message: "provided update doesn't change anything" });
    }
    else {
        try {
            if (await tripDB.updateCar(req.params.carID, req.body)) {
                res.status(200).send();
            }
            res.status(404).send();
        } catch (e) {
            res.status(500).send({ message: e.message });
        }
    }
});
//Delete car
app.delete('/car/:carID', async (req, res) => {
    try {
        await tripDB.deleteCar(req.params.carID, req.body.user.role);
        res.status(200).send();
    } catch (e) {
        res.status(500).send({ message: e.message });
    }
});
module.exports = app;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log("Cars listening on port: ", PORT);
    });
}