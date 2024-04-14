const express = require('express');

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