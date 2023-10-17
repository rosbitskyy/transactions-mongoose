'use strict'

const Person = require("./models/Person");
const {Transaction} = require("../src");
const personHelper = require("./personHelper");
const {MongoMemoryServer} = require('mongodb-memory-server');
const mongoose = require("mongoose");
const {describe, it} = require('node:test');
const assert = require("node:assert").strict;


(async () => {
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    console.log('mongo uri:', uri);
    await mongoose.connect(uri, {dbName: "verify"});
    const transaction = new Transaction().setSendbox(false);
    const persons = await personHelper.createNewPersons(false);
    let personJanna = await Person.findById(persons.Janna._id);

    describe('Transaction Namespace Parser', () => {
        it('persons create', () => {
            assert.strictEqual(!!persons.Janna, true);
        })
        it('isDocument work', () => {
            assert.strictEqual(transaction.isDocument(personJanna), true);
        })
        it('is Model work', () => {
            assert.strictEqual(transaction.isModel(Person), true);
        })
        it('is Model fail', () => {
            assert.strictEqual(transaction.isModel({Person}), false);
        })
        it('get Model work', () => {
            assert.strictEqual(transaction.isModel(transaction.documentModel(personJanna)), true);
        })
        it('get getCleanDocModel work', () => {
            assert.strictEqual(!!transaction.getCleanDocModel({Model: Person, firstname: 'Sancho',}), true);
        })
        it('get getCleanDocModel fail', () => {
            assert.strictEqual(!!transaction.getCleanDocModel({
                Model: 'AwesomePerson',
                firstname: 'Sancho',
            }), false);
        })
        it('get getCleanDocModel fail', () => {
            assert.strictEqual(!!transaction.getCleanDocModel({}), false);
        })
    });

    // close mongo
    await mongoose.disconnect();
    await mongod.stop();

})();


