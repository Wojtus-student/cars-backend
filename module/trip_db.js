const { WriteError } = require("mongodb");

const MongoClient = require("mongodb").MongoClient;
const consumers = require("stream/consumers");
const puppeteer = require("puppeteer");

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
			if(role != 'admin' || 'driver')
				throw Error("Unauthorized user");
			if(await collection.findOne(record) == null){
				let res = await collection.insertOne(record);
				if(res.insertedId == 0){
					throw WriteError("Unable to add " + JSON.stringify(record));
				}
			}
			else{
				throw WriteError("Record already exists in a database");
			}
			return res.insertedId;
		}
		async Read(collection, username){
			if(username == null){
				return await collection.find().toArray();
			}
			return await collection.find({username : username}).toArray();
		}
		async Update(collection, filter, recordNew, role){
			if(role != 'admin' || 'driver')
				throw Error("Unauthorized user");
			let found = await collection.find(filter).toArray();
			if(found){
				let res = await collection.replaceOne(found, recordNew);
				if(res.modifiedCount != 1){
					throw WriteError("Unable to update " + JSON.stringify(found));
				}
				return true;
			}
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
			if(role != "driver"){
				throw WriteError("User not authorized to add cars");
			}
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
			return vehicleData;
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
//----------------------------------------TRIPS---------------------------------------//
//----------------------------------------TRIPS---------------------------------------//
//----------------------------------------TRIPS---------------------------------------//
		async fetchTrips(username = null){
			return this.Read(this.tripCollection, username);
		}
		async addTrip(record, role){
			return this.Create(this.tripCollection,record,role);
		}
		async findTrip(record){
			return await this.tripCollection.findOne(record);
		}
		async updateTrip(id, recordNew, role){
			return this.Update(this.tripCollection,{_id : id}, recordNew, role);
		}
		async deleteTrip(id, role){
			return this.Delete(this.tripCollection,	id, role);
		}
	}
}