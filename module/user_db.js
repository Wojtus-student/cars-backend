const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectId;

const { createHmac } = require('node:crypto');

const Errors = require('./rest_ceptions.js');
KNOWN_ROLES = ['admin', 'driver', 'regular'];

function validateFormat(variable, message) {
    if (variable === undefined || variable === null || typeof variable != 'string') {
        throw new Errors.ClientError(400, message);
    }
}

module.exports = {
    KNOWN_ROLES,
    UserDB: class {
        constructor() {
            try {
                this.client = new MongoClient("mongodb://20.215.33.17:27017/userDB");
                this.client.connect();
                this.usersCollection = this.client.db().collection("users");

            } catch (e) {
                console.log("Connection error " + e)
            }
        }

        process(userInfo, gatherID = false) {

            let userTmp = {};

            try {
                validateFormat(userInfo.username, 'Invalid username format');
                validateFormat(userInfo.password, 'Invalid password format');
                validateFormat(userInfo.email, 'Invalid email format');
                validateFormat(userInfo.role, 'Invalid role format');
            } catch (e) {
                throw e;
            }

            if (userInfo.username.length < 3 || userInfo.username.length > 16) {
                throw new Errors.ClientError(400, "Username must be between 3 and 16 characters long.");
            }

            userTmp.username = userInfo.username;

            if (userInfo.password < 8 || userInfo.password > 32) {
                throw new Errors.ClientError(400, "Password must be between 8 and 32 characters long.");
            }

            const hash = createHmac('sha256', 'thisshouldnotbehere').update(userInfo.password).digest('hex');

            userTmp.password = hash;

            userTmp.role = userInfo.role;
            if (!(KNOWN_ROLES.includes(userTmp.role))) {
                throw new Errors.ClientError(400, "Invalid role");
            }


            userTmp.email = userInfo.email;

            if (gatherID) {
                try {
                    userTmp.id = new ObjectId(userInfo.id);
                } catch (e) {
                    throw new Errors.ClientError(400, "Invalid id format");
                }
            }

            return userTmp;
        }

        /**
         * 
         * @param {*} id 
         * @returns user object
         */
        async fetchById(id) {
            return await this.usersCollection.findOne({ _id: id });
        }

        /**
         * 
         * @param {*} name
         * @returns user object
         */
        async fetchByName(uname) {
            return await this.usersCollection.findOne({ username: uname });
        }

        async fetchAll() {
            return await this.usersCollection.find().toArray();
        }

        /**
         * 
         * @param {*} userInfo
         * @returns inserted user ID
         */
        async add(userInfo) {
            let found = await this.fetchByName(userInfo.username);

            if (found != null) {
                throw new Errors.ClientError(400, "User already exists");
            }

            let res = await this.usersCollection.insertOne(userInfo);

            if (res.insertedId == 0) {
                throw new Errors.InternalError(500, "User could not be created");
            }

            return res.insertedId;
        }

        /**
         * 
         * @param {*} userInfo
         */
        async update(id, userInfo) {
            let found = await this.fetchById(id);

            if (found == null) {
                throw new Errors.ClientError(400, "User does not exist");
            }

            if (found.username !== userInfo.username) {
                throw new Errors.ClientError(400, "Updated username and old username must be the same");
            }

            let res = await this.usersCollection.replaceOne(found, userInfo);

            if (res.modifiedCount != 1) {
                throw new Errors.InternalError(500, "Unable to update user");
            }
        }

        /**
         * 
         * @param {*} id 
         */
        async delete(id) {
            let res = await this.usersCollection.deleteOne({ _id: id });

            if (res.deletedCount == 0) {
                throw new Errors.InternalError(500, "Unable to delete record");
            }
        }

    }
}