const express = require('express');
const TripDB = require("./module/trip_db.js").TripDB;

const app = express();
app.use(express.json());

//TODO - move to configuration
const PORT = process.env.PORT || 9000;

app.listen(PORT, () => {
    console.log("Cars listening on port: ", PORT);
});    

// TODO - integrate with Mongodb
app.post('/user', (req, res) => {
    res.status(200).send('OK - Tworzenie usera');
});

app.get('/user/:userId', (req, res) => {
    res.status(200).send({login: 'JanKowal', mail:'jakowal@example.com'});
});

app.put('/user/:userId', (req, res) => {
    res.status(200).send(`OK - Modyfikacja usera ${req.params.userId}`)
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
	if(req.body == {}){
		res.status(400).send(JSON.stringify({message : "provided record is empty"}));
	}
	else{
		try{
			let instertedID = await tripDB.addTrip(req.body, res.body.user.role);
			res.status(200).send(JSON.stringify({_id : instertedID}));
		}catch(e){
			res.status(500).send(JSON.stringify({message : e.message}));
		}
	}
});
//Find trip
app.get('/trip/:tripID', async(req, res) => {
	let foundRecord = await tripDB.findTrip(req.params.tripID);
	if(foundRecord == null){
		res.status(404).send();
	}
	else{
		res.status(200).send(JSON.stringify({body : foundRecord}));
	}
});
//Find all trips
app.get('/trip', async(req, res) => {
	let foundRecords = await tripDB.fetchTrips();
	if(foundRecords.length == 0){
		res.status(404).send();
	}
	else{
		res.status(200).send(JSON.stringify({body : foundRecords}));
	}
});
//Update trip
app.put('/trip/:tripID', async (req, res) => {
	if(req.body==null){
		res.status(400).send(JSON.stringify({message : "provided update doesn't change anything"}));
	}
	else{
		try{
			if(await tripDB.updateTrip(res.params.tripID, req.body)){
				res.status(200).send();
			}
			res.status(404).send();
		}catch(e){
			res.status(500).send(JSON.stringify({message : e.message}));
		}
	}
});
//Delete trip
app.delete('/trip/:tripID', async(req, res) => {
	try{
		await tripDB.deleteTrip(res.params.tripID, res.body.user.role);
		res.status(200).send();
	}catch(e){
		res.status(500).send(JSON.stringify({message : e.message}));
	}
});