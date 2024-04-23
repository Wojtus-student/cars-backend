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

const tripDB = new TripDB();
//Add trip
app.post('/trip', async (req, res) => {
	if(req.body == null){
		res.status(400).send(JSON.stringify({message : "provided record is empty"}));
	}
	try{
		let instertedID = await tripDB.addTrip(req.body);
		res.status(200).send(JSON.stringify({_id : instertedID}));
	}catch(e){
		res.status(500).send();
	}
});
//Find trip
app.get('/trip/:tripID', async(req, res) => {
	let foundRecord = tripDB.findTrip(req.params.tripID, res.body.user.role);
	if(foundRecord == null){
		res.status(404).send();
	}
	res.status(200).send(JSON.stringify({body : foundRecord}));
});
//Update trip
app.put('/trip/:tripID', async (req, res) => {
	if(req.body==null){
		res.status(400).send(JSON.stringify({message : "provided update doesn't change anything"}));
	}
	try{
		if(await tripDB.updateTrip(res.params.tripID, req.body)){
			res.status(200).send();
		}
		res.status(404).send();
	}catch(e){
		res.status(500).send();
	}
});
//Delete trip
app.delete('/trip/:tripID', async(req, res) => {
	try{
		tripDB.deleteTrip(res.params.tripID, res.body.user.role);
		res.status(200).send();
	}catch(e){
		res.send(500).send();
	}
});