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

    // variant #1 - use standard setters
    personSancho.age += 1;
    personSancho.status = 'married';
    personSancho.friend_id = personHulio._id; // '...Hulio Iglessias id';
    transaction.add(Person, personSancho);

    // variant #2 - by document and update object
    transaction.add(Person, personJanna).update({
        age: ++personJanna.age,
        status: 'married',
        friend_id: personSancho._id,
        bodyFriend_id: personHulio._id,
    });

    // variant #3 - by ObjectId
    transaction.add(Person, {_id: personSancho._id}).update({
        friend_id: personJanna._id
    });

    await transaction.commit();


    await mongoose.disconnect();
    await mongod.stop();
})();