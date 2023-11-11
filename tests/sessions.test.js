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
const {describe, it} = require("node:test");
const {strict: assert} = require("node:assert");
const {startServer, stopServer} = require("./___mongo");


(async () => {
    await startServer(true)

    const transaction = new Transaction().setSendbox(false);

    const persons = await personHelper.createNewPersons(false)
    describe('Transaction Session work', () => {
        it('Replica Set', () => {
            assert.strictEqual(transaction.isReplicaSet, true);
        })
        it(persons.Sancho.firstname + ' created', () => {
            assert.strictEqual(transaction.isDocument(persons.Sancho), true);
        })
        it(persons.Janna.firstname + ' created', () => {
            assert.strictEqual(transaction.isDocument(persons.Sancho), true);
        })
        it(persons.Hulio.firstname + ' created', () => {
            assert.strictEqual(transaction.isDocument(persons.Sancho), true);
        })
    })

    let personSancho = await Person.findById(persons.Sancho._id); // test Sancho exists?
    let personJanna = await Person.findById(persons.Janna._id);
    let personHulio = await Person.findById(persons.Hulio._id);

    const showPersonsAge = async () => {
        // let's check that nothing has changed?
        const Sancho = await Person.findById(persons.Sancho._id).select('-_id age')
        const Janna = await Person.findById(persons.Janna._id).select('-_id age')
        const Hulio = await Person.findById(persons.Hulio._id).select('-_id age')

        describe('Transaction Session fail', () => {
            it('Sancho age is 22', () => {
                assert.strictEqual(Sancho.age, 22);
            });
            it('Janna age is 21', () => {
                assert.strictEqual(Janna.age, 21);
            });
            it('Hulio age is 35', () => {
                assert.strictEqual(Hulio.age, 35);
            })
        })
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

            return personJanna
        });
        await transaction.commit();

    } catch (e) {
        // console.log(e, '\nPassed!!')
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

            const person = new Person({
                firstname: 'Pedro',
                lastname: 'Failed',
                age: 33,
                sex: 'male',
                status: 'free'
            })
            await person.save({session}) // will not be created

            return personJanna
        });
        await transaction.commit();

    } catch (e) {
        // console.log(e, '\nPassed!!')
    }
    await showPersonsAge();

    // with error
    // Reload document with/without session, save with/without
    try {
        transaction.session(async (session) => {

            let personSancho = await Person.findById(persons.Sancho._id).session(session); // test Sancho exists?
            let personJanna = await Person.findById(persons.Janna._id).session(session);
            let personHulio = await Person.findById(persons.Hulio._id); // no session

            personSancho.age = 100; // <-- let's try to make it more mature
            await personSancho.save()

            personJanna.age = 100; // <-- let's try to make it more mature too
            await personJanna.save() // save without {session}, reload with session

            personHulio.age = 100; // <-- let's try to make it more mature too
            await personHulio.save({session}) // <-- session

            const person = new Person({
                firstname: 'Pedro',
                lastname: 'Failed',
                age: 33,
                sex: 'male',
                status: 'free'
            })
            await person.save({session}) // will not be created

            throw new Error('Test an error - or remark me') // No changes will be saved

        });
        await transaction.commit();

    } catch (e) {
        // console.log(e, '\nPassed!!')
    }
    await showPersonsAge()

    // no error
    // Reload document with/without session, save with/without
    transaction.session(async (session) => {

        let personSancho = await Person.findById(persons.Sancho._id); // reload without session
        let personJanna = await Person.findById(persons.Janna._id).session(session); // reload with session
        let personHulio = await Person.findById(persons.Hulio._id); // reload without session

        personSancho.age = 100; // <-- let's try to make it more mature
        await personSancho.save({session}) // <-- session

        personJanna.age = 99; // <-- let's try to make it more mature too
        await personJanna.save() // save without {session}, reload with session

        personJanna.age = 100; // <-- let's try to make it more mature too
        await personJanna.save({session}) // save without {session}, reload with session

        personHulio.age = 100; // <-- let's try to make it more mature too
        await personHulio.save({session}) // <-- session

        const person = new Person({
            firstname: 'Pedro',
            lastname: 'Okay',
            age: 33,
            sex: 'male',
            status: 'free'
        })
        await person.save({session}) // will be created

    });
    await transaction.commit();

    const list100 = await Person.find({age: 100}, {firstname: 1, age: 1})
    const pedro = await Person.findOne({firstname: 'Pedro'})
    describe('Transaction Session - Replica Set', () => {
        it('Reload document with/without session, save with/without', () => {
            assert.strictEqual(list100.filter(it => it.age === 100).length, 3);
        })
        it('new Pedro document stored', () => {
            assert.strictEqual(pedro.age, 33);
        })
    })

    await stopServer()
})();
