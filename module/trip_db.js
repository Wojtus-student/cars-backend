const { WriteError } = require("mongodb");
const { ObjectId } = require('mongodb');
const MongoClient = require("mongodb").MongoClient;
const consumers = require("stream/consumers");
const puppeteer = require("puppeteer");
const { query } = require("express");

module.exports = {
	TripDB : class{
		constructor(){
			try{
				this.client = new MongoClient("mongodb://20.215.33.17:27017/trip_db");
				this.client.connect();
				this.carsCollection = this.client.db().collection("cars");
				this.tripCollection = this.client.db().collection("trip");
				console.log("DEBUG: Connected to database");
			}catch(e){
				console.log("unable to connect to database " + e);
			}
		}
//--------------------------------------CRUD ABSTRACT--------------------------------------//
//--------------------------------------CRUD ABSTRACT--------------------------------------//
//--------------------------------------CRUD ABSTRACT--------------------------------------//
		async Create(collection, record, role){
			console.log("role: " + role);
			// if(role != 'admin' || 'driver')
			// 	throw Error("Unauthorized user"); // z jakiegos powodu nie dziala mimo ze wpisane na twardo driver
			let res;
			if(await collection.findOne(record) == null){
				console.log("Adding record to collection");
				res = await collection.insertOne(record);
				console.log(res);
				if(res.insertedId == 0){
					throw WriteError("Unable to add " + JSON.stringify(record));
				}
			}
			else{
				throw WriteError("Record already exists in a database");
			}
			return res.insertedId; 
		}		
		async CreateAll(collection, record, role){
			let res = await collection.insertOne(record)
			if(res.insertedId == 0)
				throw WriteError("Unable to add " + JSON.stringify(record));
			return res.insertedId;
		}
		async Read(collection, username){
			if(username == null){
				console.log("Fetching all records from collection");
				return await collection.find().toArray();
			}
			return await collection.find({username : username}).toArray();
		}
		async ReadAll(collection, params) {
			let query = {};
		
			if (params.start) {
				query.start = { $regex: new RegExp(params.start, 'i') };
			}
		
			if (params.finish) {
				query.finish = { $regex: new RegExp(params.finish, 'i') };
			}
		
			if (params.date && params.time) {
				// Jeśli podano datę i czas, użyj ich do stworzenia warunku
				query.$or = [
					{ 
						// Wszystkie rekordy z datą większą niż params.date lub z datą równą params.date i czasem większym niż params.time
						$and: [
							{ date: params.date },
							{ 
								$or: [
									{ time: { $gt: params.time } },
									{ date: { $gt: params.date } }
								]
							}
						]
					}
				];
			} else if (params.date) {
				// Jeśli podano tylko datę, użyj jej do warunku
				query.date = { $gt: params.date };
			} else if (params.time) {
				// Jeśli podano tylko czas, użyj go do warunku
				query.time = { $gt: params.time };
			}
		
			console.log("Executing MongoDB query with params:", query);
		
			const result = await collection.find(query).toArray();
			
			const filteredResult = result.filter(item => !item.reserved);
			console.log("MongoDB query result:", filteredResult);
			
			return filteredResult;
		}
		
		
		
		async Update(collection, filter, recordNew, role){
			// if(role != 'admin' || 'driver')
			// 	throw Error("Unauthorized user"); // wywaliem na chwile 
			console.log("Updating record in collection");
			// let found = await collection.find(filter).toArray();
			delete recordNew._id;
			let res = await collection.updateOne(filter, { $set: recordNew });

			console.log(res);
			if(res)
				return res.acknowledged;
			return false;
		}
		async Delete(collection, id, role){
			if(role != 'admin' || 'driver')
				throw Error("Unauthorized user");
			let res = await collection.deleteOne({_id : id});
			if(res.deletedCount == 0){
				throw WriteError("Unable to delete record with id :" + id);
			}
		}
//----------------------------------------CARS---------------------------------------//
//----------------------------------------CARS---------------------------------------//
//----------------------------------------CARS---------------------------------------//
		async fetchCars(username = null){
			return this.Read(this.carsCollection, username);
		}
		async addCar(record, role){
			// if(role != "driver"){
			// 	throw WriteError("User not authorized to add cars");
			// } // na chiwle zakomentowane
			const browser = await puppeteer.launch();
			const page = await browser.newPage();
			await page.goto("https://historiapojazdu.gov.pl");
			await page.evaluate((record) =>{
				document.getElementById("_historiapojazduportlet_WAR_historiapojazduportlet_:rej").value = record.registration;
				document.getElementById("_historiapojazduportlet_WAR_historiapojazduportlet_:vin").value = record.vin;
				document.getElementById("_historiapojazduportlet_WAR_historiapojazduportlet_:data").value = record.registration_date;
			}, record);
			try{
				await page.evaluate(()=>{
					document.getElementById("_historiapojazduportlet_WAR_historiapojazduportlet_:btnSprawdz").click();
				});
			}catch(e){}
			await page.waitForNavigation({waitUntil: 'load'});
			let vehicleData = await page.evaluate((record)=>{
				let data = {data_rejestracji : record.registration_date, numer_rejestracyjny : record.registration};
				let defaultKeys = ["marka","model","rodzaj","podrodzaj","pojemnosc","paliwo"];
				for(let i = 0; i < defaultKeys.length; i++){
					data[defaultKeys[i]] = document.getElementById("_historiapojazduportlet_WAR_historiapojazduportlet_:j_idt10:" + defaultKeys[i]).innerHTML;
				}
				let details = document.getElementsByClassName("group-text data")[0].querySelectorAll("p");
				for(let i = 0; i < details.length; i++){
					data[details[i].className] = details[i].childNodes[1].innerText;
				}
				return data;
			}, record);
			await browser.close();
			let found = await this.findCar(vehicleData);

            if (found != null) {
                throw new Errors.ClientError(400, "Car already exists");
            }
			vehicleData.user = record.user;
            let res = await this.carsCollection.insertOne(vehicleData);

            if (res.insertedId == 0) {
                throw new Errors.InternalError(500, "User could not be created");
            }

            return res.insertedId;
		}
		async findCar(record){
			return await this.carsCollection.findOne(record);
		}
		async updateCar(id, recordNew, role){
			return this.Update(this.carsCollection,{_id : id}, recordNew, role);
		}
		async deleteCar(id, role){
			return this.Delete(this.carsCollection,	id, role);
		}
		async getCarsByUserId(userId) {
			console.log("DEBUG: Fetching cars by user id: " + userId);
			return await this.carsCollection.find({ "user._id": userId }).toArray();
		}
//----------------------------------------TRIPS---------------------------------------//
//----------------------------------------TRIPS---------------------------------------//
//----------------------------------------TRIPS---------------------------------------//
		async fetchTrips(username = null){
			return this.Read(this.tripCollection, username);
		}
		async fetchTripsAll(query){
			return this.ReadAll(this.tripCollection, query);
		}
		async addTrip(record, role){
			return this.Create(this.tripCollection,record,role);
		}
		async addTripAll(record, role){
			return this.CreateAll(this.tripCollection,record,role);
		}
		async findTrip(record){
			return await this.tripCollection.findOne(record);
		}
		async findTripByID(tripID){
			const objectId = new ObjectId(tripID);
			console.log(8*8*"a")
			const ania = await this.tripCollection.findOne({_id : objectId});
			console.log(8*8*"a");
			console.log(await ania);
			return ania;
		}
		async updateTrip(id, recordNew, role){
			const objectId = new ObjectId(id);
			console.log(8*8*"a")
			let ania = await this.Update(this.tripCollection,{_id : objectId}, recordNew, role);
			
			console.log(await ania);
			return ania;
		}
		async deleteTrip(id, role){
			return this.Delete(this.tripCollection,	id, role);
		}
	}
}