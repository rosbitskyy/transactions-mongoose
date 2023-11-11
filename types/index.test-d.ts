import {Transaction} from "./";
import {expectType} from 'tsd';
import {Document, TransactionData, TransactionError} from "./Transaction";
import Person = require('../tests/models/Person');

const personObject = {
    Person,
    firstname: 'Sancho',
    lastname: 'Panse',
    age: 22,
    sex: 'male',
    status: 'free'
};
const transaction = new Transaction()
expectType<Transaction>(transaction)
const transactionData = transaction.add(personObject)
expectType<TransactionData>(transactionData)
const transactionData2 = transaction.add(personObject).update({k: '48'})
expectType<TransactionData>(transactionData2)
expectType<Document>(transactionData.document)
expectType<object>(transactionData.schema)
expectType<object>(transactionData.document._doc)
expectType<string>(transactionData.type)
expectType<string[]>(transactionData.uniqueFields)
expectType<string[]>(transactionData.schemaFields)
expectType<object>(transactionData.modifiedData)
expectType<boolean>(transactionData.isModel)
expectType<boolean>(transactionData.document.isModified('k'))
expectType<Transaction>(transactionData.transaction)
const error = new TransactionError(transactionData, '');
expectType<TransactionError>(error)
expectType<string | undefined>(error.stack)
expectType<string>(error.message)
expectType<string>(error.info)
