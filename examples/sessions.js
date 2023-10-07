/*
 * =========================================================
 *   🇺🇦🇺🇦🇺🇦🇺🇦🇺🇦🇺🇦🇺🇦 Mongoose Transactions 🇺🇦🇺🇦🇺🇦🇺🇦🇺🇦🇺🇦🇺🇦
 * =========================================================
 * Copyright (c) 2019-2023
 * @Author: 🇺🇦Rosbitskyy Ruslan
 * @email: rosbitskyy@gmail.com
 */

const Person = require("./models/Person");
const {MongoMemoryReplSet} = require('mongodb-memory-server');
const mongoose = require("mongoose");
const {Transaction} = require("../src/index");
const personHelper = require('./personHelper');


(async () => {
    const mongod = await MongoMemoryReplSet.create({replSet: {count: 4}});
    // const mongod = await MongoMemoryServer.create(); // <-- wrong way for transactions with session
    const uri = mongod.getUri();
    console.log('mongo uri:', uri);
    await mongoose.connect(uri, {dbName: "verify"});

    const transaction = new Transaction().setSendbox(true);

    const persons = await personHelper.createNewPersons()

    let personSancho = await Person.findById(persons.Sancho._id); // test Sancho exists?
    let personJanna = await Person.findById(persons.Janna._id);
    let personHulio = await Person.findById(persons.Hulio._id);

    const showPersonsAge = async () => {
        // let's check that nothing has changed?
        console.log('Sancho age is 22 -', await Person.findById(persons.Sancho._id).select('age'))
        console.log('Janna age is 21 -', await Person.findById(persons.Janna._id).select('age'))
        console.log('Hulio age is 35 -', await Person.findById(persons.Hulio._id).select('age'), '\n\n')
    }


    // Error in code
    try {
        transaction.session(async (session) => {
            personSancho.age = 100; // <-- let's try to make it more mature
            await personSancho.save({session})

            personJanna.age = 100; // <-- let's try to make it more mature too
            await personJanna.save({session})

            personHulio.age = 100; // <-- let's try to make it more mature too
            await personHulio.save({session})

            throw new Error('Test an error - or remark me') // No changes will be saved

            // there must be a return result - and it must be a mongo document
            return personJanna
        });
        await transaction.commit();

    } catch (e) {
        console.log(e, '\nPassed!!')
    }
    await showPersonsAge();


    // Error in Person age - validate error
    try {
        transaction.session(async (session) => {

            let personSancho = await Person.findById(persons.Sancho._id).session(session); // test Sancho exists?
            let personJanna = await Person.findById(persons.Janna._id).session(session);
            let personHulio = await Person.findById(persons.Hulio._id).session(session);

            personSancho.age = 100; // <-- let's try to make it more mature
            await personSancho.save({session})

            personJanna.age = 100; // <-- let's try to make it more mature too
            await personJanna.save({session}) // try test without {session}

            personHulio.age = 300; // <-- Error validate
            personHulio.status = '???'; // <-- Error validate
            await personHulio.save({session})

            // there must be a return result - and it must be a mongo document
            return personJanna
        });
        await transaction.commit();

    } catch (e) {
        console.log(e, '\nPassed!!')
    }
    await showPersonsAge();


    await mongoose.disconnect();
    await mongod.stop();
})();