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
const {describe, it} = require("node:test");
const {strict: assert} = require("node:assert");
const {startServer, stopServer} = require("./___mongo");


(async () => {
    await startServer()

    const transaction = new Transaction().setSendbox(true);

    const persons = await personHelper.createNewPersons(true)

    let personSancho = await Person.findById(persons.Sancho._id); // test Sancho exists?
    let personJanna = await Person.findById(persons.Janna._id);
    let personHulio = await Person.findById(persons.Hulio._id);

    const transactionData = transaction.execute(async () => {
        transaction.add(personSancho).update({
            updatedAt: Date.now(),
            __v: ++personSancho.__v
        });
        // there may be a timeout error or a reader processing error
        personSancho.avatar = await personHelper.getAvatar(personSancho._id)

        transaction.execute(async () => {
            personHulio.avatar = await personHelper.getAvatar(personHulio._id);
            transaction.add(personHulio)
        });

        personJanna.avatar = await personHelper.getAvatar(personJanna._id);
        const td = transaction.add(personJanna)

        // The result can be whatever you want
        // we will return the Janna document update result
        // https://mongoosejs.com/docs/api/query.html#Query.prototype.updateOne()
        return td
    });

    // and also execute it :)
    personJanna.updatedAt = Date.now()
    transaction.add(personJanna)

    await transaction.commit();

    let Janna = await Person.findById(persons.Janna._id);
    describe('Transaction Execute', () => {
        it('Execute return: TransactionData', () => {
            assert.strictEqual(transactionData.constructor.name, 'TransactionData');
        })
        it('TransactionData result is TransactionData', () => {
            assert.strictEqual(transactionData.result.constructor.name, 'TransactionData');
        })
        it('Person Janna has avatar', () => {
            assert.strictEqual(Janna.avatar && Janna.avatar.includes('base64') > -1, true);
        })
        it('commits', () => {
            assert.strictEqual(transaction.commits.length, 3);
        })
    })

    await stopServer()
})();