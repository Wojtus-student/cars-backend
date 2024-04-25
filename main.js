const express = require('express');
const TripDB = require("./module/trip_db.js").TripDB;
const UserDB = require("./module/user_db.js").UserDB;
const Errors = require("./module/rest_ceptions.js");
const { ObjectId } = require('mongodb');

const app = express();
app.use(express.json());

//TODO - move to configuration
const PORT = process.env.PORT || 9000;

app.listen(PORT, () => {
    console.log("Cars listening on port: ", PORT);
});

udb = new UserDB();

// TODO - integrate with Mongodb
app.post('/user', async (req, res) => {
    try {
        let formattedUser = udb.process(req.body);
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
        if (foundUser != {}) foundUser.password = ':^)';
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
    res.status(200).send(`OK - Usuwanie usera ${req.params.userId}`)
});

//------------------------Endpoints for CROP operations on trips------------------------//

//TODO: change properties after getting template of body requests.
//TODO: add more sophisticated ways of searching for trip
//TODO: add endpoints for searching for cars
const tripDB = new TripDB();
//Add trip
app.post('/trip', async (req, res) => {
    if (req.body == {}) {
        res.status(400).send(JSON.stringify({ message: "provided record is empty" }));
    }
    else {
        try {
            let instertedID = await tripDB.addTrip(req.body, res.body.user.role);
            res.status(200).send(JSON.stringify({ _id: instertedID }));
        } catch (e) {
            res.status(500).send(JSON.stringify({ message: e.message }));
        }
    }
});
//Find trip
app.get('/trip/:tripID', async (req, res) => {
    let foundRecord = await tripDB.findTrip(req.params.tripID);
    if (foundRecord == null) {
        res.status(404).send();
    }
    else {
        res.status(200).send(JSON.stringify({ body: foundRecord }));
    }
});
//Find all trips
app.get('/trip', async (req, res) => {
    let foundRecords = await tripDB.fetchTrips();
    if (foundRecords.length == 0) {
        res.status(404).send();
    }
    else {
        res.status(200).send(JSON.stringify({ body: foundRecords }));
    }
});
//Update trip
app.put('/trip/:tripID', async (req, res) => {
    if (req.body == null) {
        res.status(400).send(JSON.stringify({ message: "provided update doesn't change anything" }));
    }
    else {
        try {
            if (await tripDB.updateTrip(res.params.tripID, req.body)) {
                res.status(200).send();
            }
            res.status(404).send();
        } catch (e) {
            res.status(500).send(JSON.stringify({ message: e.message }));
        }
    }
});
//Delete trip
app.delete('/trip/:tripID', async (req, res) => {
    try {
        await tripDB.deleteTrip(res.params.tripID, res.body.user.role);
        res.status(200).send();
    } catch (e) {
        res.status(500).send(JSON.stringify({ message: e.message }));
    }
});