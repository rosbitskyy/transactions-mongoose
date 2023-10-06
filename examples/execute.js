/*
 * =========================================================
 *   🇺🇦🇺🇦🇺🇦🇺🇦🇺🇦🇺🇦🇺🇦 Mongoose Transactions 🇺🇦🇺🇦🇺🇦🇺🇦🇺🇦🇺🇦🇺🇦
 * =========================================================
 * Copyright (c) 2019-2023
 * @Author: 🇺🇦Rosbitskyy Ruslan
 * @email: rosbitskyy@gmail.com
 */

const Person = require("./models/Person");
const {MongoMemoryServer} = require('mongodb-memory-server');
const mongoose = require("mongoose");
const {Transaction} = require("../src/index");
const personHelper = require('./personHelper');


(async () => {
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    console.log('mongo uri:', uri);
    await mongoose.connect(uri, {dbName: "verify"});

    const transaction = new Transaction().setSendbox(true);

    const persons = await personHelper.createNewPersons()

    let personSancho = await Person.findById(persons.Sancho._id); // test Sancho exists?
    let personJanna = await Person.findById(persons.Janna._id);
    let personHulio = await Person.findById(persons.Hulio._id);


    const transactionData = transaction.execute(async () => {
        transaction.add(Person, personSancho).update({
            updatedAt: Date.now(),
            __v: ++personSancho.__v
        });
        // there may be a timeout error or a reader processing error
        personSancho.avatar = await personHelper.getAvatar(personSancho._id)

        transaction.execute(async () => {
            personHulio.avatar = await personHelper.getAvatar(personHulio._id);
            transaction.add(Person, personHulio)
        });

        personJanna.avatar = await personHelper.getAvatar(personJanna._id);
        const td = transaction.add(Person, personJanna)

        // The result can be whatever you want
        // we will return the Janna document update result
        // https://mongoosejs.com/docs/api/query.html#Query.prototype.updateOne()
        return td
    });

    // and also execute it :)
    personJanna.updatedAt = Date.now()
    transaction.add(Person, personJanna)

    await transaction.commit();
    console.log('transaction result', transactionData.result.result);


    await mongoose.disconnect();
    await mongod.stop();
})();