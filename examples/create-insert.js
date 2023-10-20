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
const {describe, it} = require("node:test");
const {strict: assert} = require("node:assert");

(async () => {
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    console.log('mongo uri:', uri);
    await mongoose.connect(uri, {dbName: "verify"});

    const transaction = new Transaction().setSendbox(true);

    const transactionData1 = transaction.add({
        Person,
        firstname: 'Sancho',
        lastname: 'Panse',
        age: 22,
        sex: 'male',
        status: 'free'
    });
    const transactionData2 = transaction.add({
        Model: 'Person',
        firstname: 'Janna',
        lastname: 'Dark',
        age: 21,
        sex: 'female',
        status: 'free'
    });
    transaction.add(Person, {
        firstname: 'Hulio',
        lastname: 'Iglessias',
        age: 35,
        sex: 'male',
        status: 'free'
    });
    await transaction.commit();

    console.log('transaction 1', transactionData1.result) // the result of the save() operation
    console.log('transaction 2 document', transactionData2.document)

    // test _id <--> idSynonym
    const doc = transactionData1.result._doc; // extract result
    doc.id = doc._id; // copy orig _id to id
    delete doc._id;
    const td = transaction.add(Person, doc);
    await transaction.commit();
    console.log('persons', await Person.find())

    // check
    const count = await Person.countDocuments({})
    const count2 = await Person.countDocuments({firstname: 'Sancho'})
    describe('Transactions - No Replica Set', () => {
        it('Persons count 4', () => {
            assert.strictEqual(count, 4);
        })
        it('Sancho count 2', () => {
            assert.strictEqual(count2, 2);
        })
    })

    await mongoose.disconnect();
    await mongod.stop();
})();