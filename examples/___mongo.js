/*
 *  =========================================================
 *             UCP Dashboard Server Application
 *  =========================================================
 *  Copyright (c) 2023.
 *  @Author: 🇺🇦Rosbitskyy Ruslan
 *  @email: rosbitskyy@gmail.com
 */


const {MongoMemoryReplSet, MongoMemoryServer} = require('mongodb-memory-server');
const mongoose = require("mongoose");
const {Transaction} = require("../src/Transaction");

const transaction = new Transaction()
let mongod;
let isStarted = false;

const startServer = async (replicaSet = false) => {
    if (isStarted) return
    mongod = replicaSet ? await MongoMemoryReplSet.create({replSet: {count: 4}}) : await MongoMemoryServer.create();
    const uri = mongod.getUri();
    console.log('mongo uri:', uri);
    await mongoose.connect(uri, {dbName: "verify"});
    isStarted = true
};

const stopServer = async () => {
    if (!isStarted) return
    try {
        await mongoose.connection.close();
    } catch (e) {
        try {
            await mongoose.dissconnect();
        } catch (e) {

        }
    }
    await mongod.stop();
    isStarted = false
}

module.exports = {
    transaction,
    startServer,
    stopServer,
}