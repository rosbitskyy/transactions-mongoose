# 🇺🇦 Transactions for mongoose

[![npm version](https://img.shields.io/npm/v/transactions-mongoose.svg)](https://www.npmjs.com/package/transactions-mongoose)
[![Downloads/month](https://img.shields.io/npm/dm/transactions-mongoose.svg)](http://www.npmtrends.com/transactions-mongoose)

**Transactions allow you to perform multiple group operations in isolation and undo all operations if one of them fails.**

This module allows you to combine different transactions and operations into a group and execute them together.
Pre-checks the schema for errors, duplication of unique indexes/fields

Very simple and extremely easy ☕️ :

- A couple of methods for everything
- Mix executors as you like
- Use the session for your usual, standard saving

And yes, let's start!

### Installation

First install [Node.js](https://nodejs.org/uk) and [MongoDB](https://www.mongodb.com/try). Then:

```shell
npm i transactions-mongoose
```

Mongoose [7.5.4](https://www.npmjs.com/package/transactions-mongoose?activeTab=dependencies) also included

### Usage

```javascript
const {Transaction} = require("transactions-mongoose");
const transaction = new Transaction();
// or with debug log
const transaction = new Transaction().setSendbox(true);
```

## An exemplary use case

### [Create / Insert new document](https://github.com/rosbitskyy/transactions-mongoose/blob/main/examples/create-insert.js)
```javascript
const {Transaction} = require("transactions-mongoose");
const transaction = new Transaction().setSendbox(true);

const transactionData1 = transaction.add(Person, {
    firstname: 'Sancho',
    lastname: 'Panse',
    age: 22,
    sex: 'male',
    status: 'free'
});
const transactionData2 = transaction.add(Person, {
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

console.log('transaction 1 result', transactionData1.result) // the result of the save() operation
console.log('transaction 2 document', transactionData2.document)
```

### [Update an existing one](https://github.com/rosbitskyy/transactions-mongoose/blob/main/examples/update-existing.js)
```javascript
const {Transaction} = require("transactions-mongoose");
const transaction = new Transaction().setSendbox(true);

// variant #1 - use standard setters
let personSancho = await Person.findById('...Sancho id');
personSancho.age += 1;
personSancho.status = 'married';
personSancho.friend_id = '...Hulio Iglessias id';
transaction.add(Person, personSancho);

// variant #2 - by document and update object
let personJanna = await Person.findById('...Janna id');
transaction.add(Person, personJanna).update({
    age: ++personJanna.age,
    status: 'married',
    friend_id: personSancho._id,
    bodyFriend_id: '...Hulio Iglessias id',
});

// variant #3 - by ObjectId
transaction.add(Person, {_id: '...Sancho id'}).update({
    friend_id: personJanna._id
});

await transaction.commit();
```

### [Executing an isolated block that may fail is not related to Mongo but affects whether the data is saved or not.](https://github.com/rosbitskyy/transactions-mongoose/blob/main/examples/execute.js)
```javascript
const fetch = require("node-fetch");
const {Transaction} = require("transactions-mongoose");
const transaction = new Transaction().setSendbox(true);

const getAvatar = async (id) => {
    const response = await fetch('https://i.pravatar.cc/300?u=' + id);
    const blob = await response.blob();
    return new Promise((onSuccess, onError) => {
        const reader = new FileReader() ;
        reader.onload = function () {
            onSuccess(this.result)
        };
        reader.readAsDataURL(blob);
    });
};

const transactionData = transaction.execute(async () => {
    let personSancho = await Person.findById('...Sancho id');
    transaction.add(Person, personSancho).update({
        updatedAt: Date.now(),
        __v: ++personSancho.__v
    });
    // there may be a timeout error or a reader processing error
    personSancho.avatar = await getAvatar(personSancho._id)

    transaction.execute(async () => {
        let personHulio = await Person.findById('...Hulio id');
        personHulio.avatar = await getAvatar(personHulio._id);
        transaction.add(Person, personHulio)
    });

    let personJanna = await Person.findById('...Janna id');
    personJanna.avatar = await getAvatar(personJanna._id);
    const td = transaction.add(Person, personJanna)
    
    // The result can be whatever you want
    // we will return the Janna document update result
    // https://mongoosejs.com/docs/api/query.html#Query.prototype.updateOne()
    return td
});

// and also execute it :)
personJanna.updatedAt = Date.now()
transaction.add(Person, personJanna)

await transaction.commit();
console.log('transaction result', transactionData.result.result);
```

### [With session executor](https://github.com/rosbitskyy/transactions-mongoose/blob/main/examples/sessions.js)

```javascript
const {Transaction} = require("transactions-mongoose");
const transaction = new Transaction().setSendbox(true);

transaction.session(async (session) => {
    let personJanna = await Person.findById('...Janna id');
    personJanna.age++;
    personJanna.updatedAt = Date.now()
    await personJanna.save()

    let personHulio = await Person.findById('...Hulio id');
    personHulio.age++;
    personHulio.updatedAt = Date.now()
    await personHulio.save()

    let personSancho = await Person.findById('...Sancho id');
    transaction.add(Person, personSancho).update({
        updatedAt: Date.now(),
        __v: ++personSancho.__v
    });

    throw new Error('Test an error - or remark me') // No changes will be saved

    // there must be a return result - and it must be a mongo document
    return personJanna
});

await transaction.commit();
```

If the scheme uses {timestamps: true} in the options, or the fields createdAt (if the document is new), updatedAt (for
new and updates) - they will be automatically created or updated updatedAt.


[![](https://img.shields.io/badge/mongoose-v5.x.x_and_up-blue?logo=mongoosedotws)](https://www.npmjs.com/package/mongoose)
[![](https://img.shields.io/badge/Node.js-v16.x.x_and_up-blue?logo=nodedotjs)](https://nodejs.org)