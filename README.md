# Transactions for mongoose

**Transactions allow you to perform multiple group operations in isolation and undo all operations if one of them fails.**

This module allows you to combine different transactions and operations into a group and execute them together.
Pre-checks the schema for errors, duplication of unique indexes/fields

### Install module

```shell
npm i transactions-mongoose
```

### Usage

```javascript
const Transaction = require("transactions-mongoose");
const transaction = new Transaction();
// or with debug log
const transaction = new Transaction().setSendbox(true);
```

## An exemplary use case

### Create / Insert new document
```javascript
const Transaction = require("transactions-mongoose");
const transaction = new Transaction();

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
    sex: 'famale',
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
```

### Update an existing one
```javascript
const Transaction = require("transactions-mongoose");
const transaction = new Transaction();

// variant #1
let personSancho = await Person.findById('...Sancho id');
personSancho.age += 1;
personSancho.status = 'married';
personSancho.friend_id = '...Hulio Iglessias id';
transaction.add(Person, personSancho);
// variant #2
let personJanna = await Person.findById('...Janna id');
transaction.add(Person, personJanna).update({
    age: ++personJanna.age,
    status: 'married',
    friend_id: personSancho._id,
    bodyFriend_id: '...Hulio Iglessias id',
});
// variant #3
transaction.add(Person, {_id: '...Sancho id'}).update({
    friend_id: personJanna._id
});

await transaction.commit();
```

### Executing an isolated block that may fail is not related to Mongo but affects whether the data is saved or not.
```javascript
const fetch = require("node-fetch");
const Transaction = require("transactions-mongoose");
const transaction = new Transaction();

const getAvatar = async (id) => {
    const response = await fetch('https://i.pravatar.cc/300?u=' + id);
    const blob = await response.blob();
    return new Promise((onSuccess, onError) => {
        const reader = new FileReader() ;
        reader.onload = function(){ onSuccess(this.result) } ;
        reader.readAsDataURL(blob) ;
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
    return td.result 
});

// and also execute it :)
personJanna.updatedAt = Date.now()
transaction.add(Person, personJanna)

await transaction.commit();
console.log('transaction result', transactionData.result);

```
