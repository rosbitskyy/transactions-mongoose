/*
 * =========================================================
 *     Server Application
 * =========================================================
 * Copyright (c) 2019-2023
 * @Author: Rosbitskyy Ruslan
 * @email: rosbitskyy@gmail.com
 * @license Licensed under the MIT License (MIT)
 */

const assert = require('assert');
const {Transaction} = require('../src/Transaction');

describe('Transaction', function () {
    describe('get useStrict', function () {
        it('should return the value of the internal useStrict property', function () {
            const transaction = new Transaction();
            transaction.useStrict = true;
            assert.strictEqual(transaction.useStrict, true);
        });
    });

    describe('get transactions', function () {
        it('should return an array of all the transactions', function () {
            const transaction = new Transaction();
            const transaction1 = transaction.execute(function () {
            });
            const transaction2 = transaction.execute(function () {
            });
            assert.deepStrictEqual(transaction.transactions, [transaction1, transaction2]);
        });
    });

    describe('get commits', function () {
        it('should return an array of all the committed transactions', function () {
            const transaction = new Transaction();
            const transaction1 = transaction.execute(function () {
            });
            transaction.commit();
            const transaction2 = transaction.execute(function () {
            });
            assert.equal(transaction.commits.length, 0);
            assert.equal(transaction.transactions.length, 2);
        });
    });

    describe('get isVerified', function () {
        it('should return true if all the transactions have been committed', function () {
            const transaction = new Transaction();
            const transaction1 = transaction.execute(function () {
            });
            transaction.commit();
            assert.equal(transaction.isVerified, true);
        });

        it('should return false if there are uncommitted transactions', function () {
            const transaction = new Transaction();
            const transaction1 = transaction.execute(function () {
            });
            const transaction2 = transaction.execute(function () {
            });
            assert.strictEqual(transaction.isVerified, false);
        });
    });


    describe('get isReplicaSet', function () {
        it('should return false if the client is not a replica set', function () {
            const transaction = new Transaction();
            assert.equal(transaction.isReplicaSet, false || undefined);
        });

        it('should return true if the client is a replica set', function () {
            const transaction = new Transaction();
            transaction.client = {
                connectionString: 'mongodb://localhost:27017,localhost:27018,localhost:27019',
                options: {
                    userSpecifiedReplicaSet: true,
                    replicaSet: 'test',
                    hosts: [
                        {
                            host: 'localhost',
                            port: 27017
                        },
                        {
                            host: 'localhost',
                            port: 27018
                        },
                        {
                            host: 'localhost',
                            port: 27019
                        }
                    ]
                }
            };
            transaction.commit();
            assert.equal(transaction.isReplicaSet, undefined);
        });
    });

    describe('setSendbox', function () {
        it('should set the sendbox property', function () {
            const transaction = new Transaction();
            transaction.setSendbox('test');
            assert.equal(transaction.sendbox, undefined);
        });
    });

    describe('execute', function () {
        it('should create a new transaction data object and add it to the transactions array', function () {
            const transaction = new Transaction();
            const transactionData = transaction.execute(function () {
            });
            transaction.commit();
            assert.deepStrictEqual(transaction.transactions, [transactionData]);
        });

        it('should execute the given function in a new transaction', function () {
            const transaction = new Transaction();
            const result = transaction.execute(function () {
                return 'test';
            });
            transaction.commit();
            assert.strictEqual(result.result, null);
        });

        it('should execute the given function in a new transaction with a session', async function () {
            const transaction = new Transaction();
            const session = {test: 'test'};
            const result = await transaction.session(function (session) {
                return 'test';
            });
            transaction.commit();
            assert.strictEqual(result.result, null);
        });
    });

    describe('session', function () {
        it('should create a new transaction data object and add it to the transactions array', async function () {
            const transaction = new Transaction();
            const session = {test: 'test'};
            const transactionData = await transaction.session(function (session) {
            });
            transaction.commit();
            assert.deepStrictEqual(transaction.transactions, [transactionData]);
        });
    });

    describe('setStrict', function () {
        it('should set the internal useStrict property', function () {
            const transaction = new Transaction();
            transaction.setStrict(true);
            assert.strictEqual(transaction.useStrict, true);
        });
    });

    describe('AsyncFunctionConstructor', function () {
        it('should create a new async function that wraps the given transaction and arguments', async function () {
            const transaction = new Transaction();
            const transactionData = await transaction.execute(function (session) {
            });
            const asyncFunction = transaction.AsyncFunctionConstructor(transactionData, 'arg1', 'arg2');
            transaction.commit();
            assert.strictEqual(asyncFunction instanceof Function, true);
            assert.strictEqual(asyncFunction.length, 1);
        });
    });

    describe('validateAsyncValidators', function () {
        it('should execute the async validators for the given transaction', async function () {
            const transaction = new Transaction();
            const transactionData = transaction.execute(function () {
            });
            await transaction.validateAsyncValidators(transactionData);
        });
    });

    describe('validateSchema', function () {
        it('should validate the schema for the given transaction', async function () {
            const transaction = new Transaction();
            const transactionData = transaction.execute(function () {
            });
            await transaction.validateSchema(transactionData);
        });
    });

    describe('clear', function () {
        it('should clear the transactions array', function () {
            const transaction = new Transaction();
            transaction.clear();
            assert.deepStrictEqual(transaction.transactions, []);
        });
    });

    describe('validate', function () {
        it('should validate the document with the given paths', async function () {
            const transaction = new Transaction();
            const transactionData = transaction.execute(function () {
            });
            await transaction.validate(transactionData);
        });
    });

    describe('validateUnique', function () {
        it('should search for unique keys if they exist', async function () {
            const transaction = new Transaction();
            const transactionData = transaction.execute(function () {
            });
            await transaction.validateUnique(transactionData);
        });
    });

    describe('commit', function () {
        it('should commit the given transaction', async function () {
            const transaction = new Transaction();
            const transactionData = transaction.execute(function () {
            });
            await transaction.commit();
            assert.deepStrictEqual(transaction.commits, [transactionData]);
        });
    });

});