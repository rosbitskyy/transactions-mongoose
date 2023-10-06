/*
 * =========================================================
 *   🇺🇦🇺🇦🇺🇦🇺🇦🇺🇦🇺🇦🇺🇦 Mongoose Transactions 🇺🇦🇺🇦🇺🇦🇺🇦🇺🇦🇺🇦🇺🇦
 * =========================================================
 * Copyright (c) 2019-2023
 * @Author: 🇺🇦Rosbitskyy Ruslan
 * @email: rosbitskyy@gmail.com
 */

const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    firstname: {type: String, require: true, trim: true, minLength: 2},
    lastname: {type: String, require: true, trim: true, minLength: 2},
    age: {type: Number, require: true, default: 100, min: 0, max: 200},
    sex: {type: String, enum: ['male', 'female']},
    status: {type: String, enum: ['free', 'married']},
    friend_id: {type: mongoose.Schema.ObjectId, require: false},
    bodyFriend_id: {type: mongoose.Schema.ObjectId, require: false},
    avatar: {type: String}
}, {
    timestamps: true
})

const Person = mongoose.model('Person', schema);
module.exports = Person;