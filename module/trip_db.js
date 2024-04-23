const { WriteError } = require("mongodb");

const MongoClient = require("mongodb").MongoClient;

module.exports = {
	TripDB : class{
		constructor(){
			try{
				this.client = new MongoClient("mongodb://20.215.33.17:27017/trip_db");
				this.client.connect();
				this.carsCollection = this.client.db().collection("cars");
				this.tripCollection = this.client.db().collection("trip");
			}catch(e){
				console.log("unable to connect to database " + e);
			}
		}
		async fetchCars(username = null){
			if(username == null){
				return await this.carsCollection.find().toArray();
			}
			return await this.carsCollection.find({username : username}).toArray();
		}
		async fetchTrips(username = null){
			if(username == null){
				return await this.tripCollection.find().toArray();
			}
			return await this.tripCollection.find({username : username}).toArray();
		}
		async addTrip(record, role){
			if(role != 'admin' || 'driver')
				throw Error("Unauthorized user");
			let res = await this.tripCollection.insertOne(record);
			if(res.insertedId == 0){
				throw WriteError("unable to add trip");
			}
			return res.insertedId;
		}
		async findTrip(id){
			return await this.tripCollection.findOne({_id : id});
		}
		async updateTrip(id, recordNew){
			let found = await this.findTrip(id);
			if(found){
				let res = await this.tripCollection.replaceOne(found, recordNew);
				if(res.modifiedCount != 1){
					throw WriteError("unable to update trip");
				}
				return true;
			}
			return false;
		}
		async deleteTrip(id, role){
			if(role != 'admin' || 'driver')
				throw Error("Unauthorized user");
			let res = await this.tripCollection.deleteOne({_id : id});
			if(res.deletedCount == 0){
				throw WriteError("unable to delete record with id :" + id);
			}
		}
	}

}