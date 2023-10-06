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


    transaction.session(async (session) => {
        personJanna.age++;
        personJanna.updatedAt = Date.now()
        await personJanna.save()

        personHulio.age++;
        personHulio.updatedAt = Date.now()
        await personHulio.save()

        transaction.add(Person, personSancho).update({
            updatedAt: Date.now(),
            __v: ++personSancho.__v
        });

        throw new Error('Test an error - or remark me') // No changes will be saved

        // there must be a return result - and it must be a mongo document
        return personJanna
    });
    await transaction.commit();


    await mongoose.disconnect();
    await mongod.stop();
})();