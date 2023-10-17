/*
 * =========================================================
 *   🇺🇦🇺🇦🇺🇦🇺🇦🇺🇦🇺🇦🇺🇦 Mongoose Transactions 🇺🇦🇺🇦🇺🇦🇺🇦🇺🇦🇺🇦🇺🇦
 * =========================================================
 * Copyright (c) 2019-2023
 * @Author: 🇺🇦Rosbitskyy Ruslan
 * @email: rosbitskyy@gmail.com
 */

const {Transaction} = require("../src");
const Person = require("./models/Person");

const createNewPersons = async () => {
    const transaction = new Transaction().setSendbox(true);

    // variant #1
    const Sancho = transaction.add({
        Person, // Be careful - key Person may have been used by you before
        firstname: 'Sancho',
        lastname: 'Panse',
        age: 22,
        sex: 'male',
        status: 'free'
    });
    // variant #2
    const Janna = transaction.add({
        Model: 'Person', // or Model: Person - Be careful - key Model may have been used by you before
        firstname: 'Janna',
        lastname: 'Dark',
        age: 21,
        sex: 'female',
        status: 'free'
    });
    // variant #3
    const Hulio = transaction.add(Person, {
        firstname: 'Hulio',
        lastname: 'Iglessias',
        age: 35,
        sex: 'male',
        status: 'free'
    });
    await transaction.commit();

    return {
        Sancho: Sancho.result,
        Janna: Janna.result,
        Hulio: Hulio.result,
    }
};


const getAvatar = async (id) => {
    const response = await fetch('https://i.pravatar.cc/50?u=' + id);
    const blob = await response.blob()
    return "data:" + blob.type + ';base64,' + Buffer.from(await blob.arrayBuffer()).toString('base64');
};

module.exports = {
    createNewPersons,
    getAvatar,
}