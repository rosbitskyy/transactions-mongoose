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
        console.log('Sancho age is 22 -', await Person.findById(persons.Sancho._id).select('-_id age'))
        console.log('Janna age is 21 -', await Person.findById(persons.Janna._id).select('-_id age'))
        console.log('Hulio age is 35 -', await Person.findById(persons.Hulio._id).select('-_id age'), '\n\n')
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
        console.log(e, '\nPassed!!')
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
        console.log(e, '\nPassed!!')
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

    // list all persons
    for await (let v of (await Person.find({}, {firstname: 1, age: 1}).cursor())) {
        console.log(v.name, 'age is', v.age)
    }

    await mongoose.disconnect();
    await mongod.stop();
})();
