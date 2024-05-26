const express = require('express');
const TripDB = require("./module/trip_db.js").TripDB;
const UserDB = require("./module/user_db.js").UserDB;
const Errors = require("./module/rest_ceptions.js");
const { ObjectId } = require('mongodb');

const app = express();
app.use(express.json());

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
//Update trip
app.put('/trip/:tripID', async (req, res) => {
    if (req.body == null) {
        res.status(400).send({ message: "provided update doesn't change anything" });
    }
    else {
        try {
            if (await tripDB.updateTrip(req.params.tripID, req.body)) {
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
//Add car
app.get('/car', async (req, res) => {
	req.body = {
		registration : "szy44416",
		vin : "knaba24429t732164",
		registration_date : "16.04.2009",
		user:{
			role: "driver",
		}
	};
    if (req.body == {}) {
        res.status(400).send({ message: "provided record is empty" });
    }
    else {
        try {
            let instertedID = await tripDB.addCar(req.body, req.body.user.role);
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
//Delete trip
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