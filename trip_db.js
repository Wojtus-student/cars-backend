const MongoClient = require("mongodb").MongoClient;
const { WriteError } = require("mongodb");
const fetch = require('node-fetch');

module.exports = {
	TripDB : class{
		constructor(){
			try{
				this.client = new MongoClient("mongodb://127.0.0.1:27017/trip_db");
				this.client.connect();
				this.carsCollection = this.client.db().collection("cars");
				this.tripCollection = this.client.db().collection("trip");
			}catch(e){
				throw Error("unable to connect to database " + e);
			}
		}
		async fetchCars(){
			return await this.carsCollection.find().toArray();
		}
		async fetchTrips(){
			return await this.tripCollection.find().toArray();
		}
		async addTrip(record){
			try{
				let res = await this.tripCollection.insertOne(record);
				if(res.acknowledged == false){
					throw WriteError("unable to add trip");
				}
			}catch(e){
				print(e);
			}
		}
	}

}