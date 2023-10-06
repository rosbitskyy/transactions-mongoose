/*
 * =========================================================
 *   🇺🇦🇺🇦🇺🇦🇺🇦🇺🇦🇺🇦🇺🇦 Mongoose Transactions 🇺🇦🇺🇦🇺🇦🇺🇦🇺🇦🇺🇦🇺🇦
 * =========================================================
 * Copyright (c) 2019-2023
 * @Author: 🇺🇦Rosbitskyy Ruslan
 * @email: rosbitskyy@gmail.com
 */

/**
 * @type {{hasValidator: boolean, FieldValidator: {validator: function, message?: string},
 * type?: object, required?: boolean, unique?: boolean, index?: boolean, min: number, max: number,
 * validate?:{validator: function, message?: string}}
 */
const SchemaConstructor = {}

String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

const Namespace = require('mongoose');

class Document {
    _ABSTRACT = 'Abstract';
    _doc = {}
    isNew = false;
    #modified = {_id: false, __v: false};

    /**
     * @param {object: Namespace.Model} model
     * @param {object} object
     */
    constructor(model, object) {
        this._doc = object;
        this.model = model;
        this._modelName = this._ABSTRACT + this.model.prototype.collection.collectionName.capitalize();
        this.init()
    }

    get schema() {
        return this.model.schema.obj
    }

    init() {
        const t = this;
        if (!this._doc._id) throw new Error('Document _id is required for update Document')
        for (let path of Object.keys(this.schema).concat(['_id'])) {
            if (!this.hasOwnProperty(path))
                Object.defineProperties(this, {
                    [path]: {
                        get() {
                            return t._doc[path];
                        },
                        set(v) {
                            t._doc[path] = v;
                            t.markModified(path, true)
                        }
                    }
                })
            this.markModified(path, false)
        }
        for (let path of Object.keys(this._doc)) if (path !== '_id') this.markModified(path, true)
    }

    markModified(path, v = true) {
        this.#modified[path] = v;
    }

    /**
     * @param {string|null} path
     * @return {boolean}
     */
    isModified(path = null) {
        if (!path) return true; else return !!this.#modified[path];
    }

    /**
     * @param {object|Array<string>|null} v
     * @return {Error.ValidationError}
     */
    validateSync(v = null) {
        const doc = this.AbstractModel();
        for (let path of Object.keys(this.#modified)) {
            if (this.isModified(path)) {
                const error = doc.validateSync([path])
                if (error) {
                    this.clear()
                    return error;
                }
            }
        }
        return null;
    }

    /**
     * @param {string[]} paths
     * @return {Promise<undefined|*>}
     */
    async validate(paths) {
        const doc = this.AbstractModel();
        try {
            const er = await doc.validate(paths)
            if (er) throw er
        } catch (e) {
            this.clear()
            return e;
        }
        return undefined
    }

    AbstractModel() {
        if (Namespace.modelNames().includes(this._modelName)) return new (Namespace.model(this._modelName))(this._doc);
        return new (Namespace.model(this._modelName, new Namespace.Schema(this.schema, {
            _id: false,
            autoCreate: false
        })))(this._doc);
    }

    async save() {
        throw new Error('Invalid save method call for this type of document. Did you mean update?')
    }

    async clear() {
        if (Namespace.modelNames().includes(this._modelName)) Namespace.deleteModel(this._modelName)
    }
}

class TransactionData {

    MODEL = 'model'
    OBJECT = 'Object'
    FUNCTION = 'Function'
    DOCUMENT = 'Document'

    /**
     * @type {[string]}
     */
    #uniqueFields = [];
    /**
     * @type {Transaction}
     */
    #transaction = null;

    /**
     * @param {object: Namespace.Model} model
     * @param {Namespace.Model|object|function} data
     * @param {Transaction} transaction
     */
    constructor(model, data, transaction) {
        this.#transaction = transaction;
        this.id = TransactionData.rid;
        this.model = model;
        this.data = data;
        this.document = this.#getDocument();
        this.checkAsyncValidators = false;
        this.checkValidateSchema = false;
        this.checkValidateUniques = false;
        this.result = null
        this.function = null

        this.#defineFunction();
        this.#setDebugerInfo();
        this.#collectUniques();
    }

    static get rid() {
        return Math.random().toString(16).substring(2)
    }

    get isModel() {
        return !!this.document;
    }

    get isExecutor() {
        return !!this.function;
    }

    get type() {
        return this.data.constructor.name.replace('Async', '')
    }

    get transaction() {
        return this.#transaction
    }

    get uniqueFields() {
        return this.#uniqueFields
    }

    /**
     * @return {boolean}
     */
    get isVerified() {
        return this.checkAsyncValidators && this.checkValidateUniques && this.checkValidateSchema
    }

    /**
     * @return {{[]: SchemaConstructor}}
     */
    get schema() {
        return this.model.schema.obj
    }

    get schemaFields() {
        return Object.keys(this.schema)
    }

    /**
     * @return {{any}}
     */
    get modifiedData() {
        const doc = this.document, obj = {};
        if (this.isModel) for (let key of this.schemaFields.concat('_id')) if (doc.isModified(key)) obj[key] = doc[key];
        return obj;
    }

    #setDebugerInfo() {
        this.debuger = TransactionError.debuger();
    }

    #defineFunction() {
        this.function = (this.type === this.FUNCTION) ? this.data : null;
        if (this.function && !this.function.name)
            Object.defineProperty(this.function, "name", {value: (this.function.withSession ? 'session' : 'execute')});
    }

    /**
     * @return {Document|null}
     */
    #getDocument() {
        if (this.type === this.OBJECT) {
            if (this.data._id && Namespace.Types.ObjectId.isValid(this.data._id))
                return new Document(this.model, this.data); else return new this.model(this.data);
        } else if (this.type === this.MODEL) return this.data;
        return null;
    }

    /**
     * @param {object} data
     */
    update(data) {
        if (data.constructor.name === this.OBJECT) {
            for (let k of Object.keys(data)) this.document[k] = data[k];
            this.#collectUniques()
        }
        return this;
    }

    #collectUniques() {
        if (!this.document) return;
        const t = this;
        for (let field of this.schemaFields) {
            const schema = this.schemaConstructor(field);
            if (schema.unique === true && !this.#uniqueFields.includes(field) && this.document.isModified(field)) this.#uniqueFields.push(field)
            if (!schema.hasOwnProperty('hasValidator')) Object.defineProperties(schema, {
                hasValidator: {
                    get() {
                        return schema && schema.validate && schema.validate.validator && schema.validate.validator.constructor.name === t.FUNCTION
                    }
                },
                FieldValidator: {
                    get() {
                        return schema && schema.validate
                    }
                }
            })
        }
    }

    /**
     * @param {string} field
     * @return {SchemaConstructor}
     */
    schemaConstructor(field) {
        return this.schema[field]
    }


}

class TransactionError extends Error {
    /**
     * @param {TransactionData} _T
     * @param {string} message
     * @param {stack?: string|null} stack
     */
    constructor(_T, message, stack = null) {
        super(message)
        this.#stack(_T, stack)
        const {id, model, checkAsyncValidators, checkValidateSchema, checkValidateUniques} = _T;
        this.time = Date.now();
        const name = (_T.document || {})._modelName;
        const funcType = (_T.isExecutor && _T.function.constructor.name) || _T.type;
        const hasObject = Object.keys(_T.modifiedData || {})
            .some(it => !!_T.modifiedData[it] && typeof _T.modifiedData[it] === 'object' && !_T.modifiedData[it].getTime)
        const modifiedData = _T.isModel ? (hasObject ? JSON.stringify(_T.modifiedData) : _T.modifiedData) :
            funcType + (_T.function.withSession ? ' with Session' : '');
        this.transaction = {
            id, ...(name && {document: name}),
            model: (model || {}).modelName || funcType,
            checkAsyncValidators,
            checkValidateSchema,
            checkValidateUniques,
            modifiedData,
        }
    }

    static debuger() {
        const lookup = ['process', 'Transaction'];
        let e = new Error();
        const stack = e.stack.split("\n").slice(1).reverse();
        let frame = stack.filter(it => lookup.every(s => !it.includes('/' + s))).slice(0).join('\n');
        let line = stack[1].substring(frame.indexOf('/'));
        return {frame, line}
    }

    /**
     * @param {TransactionData} transaction
     * @param {stack?: string|null} stack
     */
    #stack(transaction, stack = null) {
        try {
            const name = (stack ? stack.split("\n")[1] : '');
            this.stack = null; //🇺🇦нам ніфіга це не цікаво
            this.info = (name + '\n' + transaction.debuger.frame).trim()
        } catch (e) {
        }
    }
}

class Transaction {

    /**
     * @type {{updated:Document[], created:TransactionData[]}}
     */
    #documents = {
        updated: [], created: []
    };

    #sendbox = false;
    /**
     * @type {Array<TransactionData>}
     */
    #data = [];
    /**
     * @type {Array<TransactionData>}
     */
    #commits = []
    #strict = true;

    constructor() {
    }

    get useStrict() {
        return this.#strict;
    }

    get transactions() {
        return this.#data;
    }

    get commits() {
        return this.#commits
    }

    get isVerified() {
        return this.transactions.every(it => it.isVerified)
    }

    /**
     * @param {string} name
     * @return {Model<InferSchemaType<any>, ObtainSchemaGeneric<any, "TQueryHelpers">, ObtainSchemaGeneric<any, "TInstanceMethods">, ObtainSchemaGeneric<any, "TVirtuals">, HydratedDocument<InferSchemaType<any>, ObtainSchemaGeneric<any, "TVirtuals"> & ObtainSchemaGeneric<any, "TInstanceMethods">, ObtainSchemaGeneric<any, "TQueryHelpers">>, any> & ObtainSchemaGeneric<any, "TStaticMethods">}
     * @constructor
     */
    static Model(name) {
        return Namespace.model(name)
    }

    setSendbox(v) {
        this.#sendbox = !!v;
        return this
    }

    /**
     * @param {function} fn
     * @return {TransactionData}
     */
    execute(fn) {
        return this.add(null, fn);
    }

    /**
     * @param {function(session: Namespace.ClientSession)} fn
     * @return {TransactionData}
     */
    session(fn) {
        Object.defineProperty(fn, "withSession", {value: true});
        const transactionData = this.execute(fn);
        this.#verifySessionCallback(transactionData)
        return transactionData
    }

    setStrict(v) {
        this.#strict = !!v;
        return this;
    }

    /**
     * @param {TransactionData} transaction
     */
    #verifySessionCallback(transaction) {
        if (transaction && transaction.isExecutor && this.useStrict ||
            this.transactions.filter(it => it.isModel).length > 0) {
            const pattern = /[^\s\S]*?new \w.*\([\s\S|.]*?{[\s\S|.]*?}[\s\S|.]*?\)/gm;
            let fnStr = transaction.function.toString();
            let results = Array.from(fnStr.matchAll(pattern));
            if (results && results.length) {
                let list = [];
                for (let result of results) {
                    const line = result[0];
                    const rs = Array.from(line.matchAll(/(new \w*)/gm));
                    const newObj = rs[0][0];
                    const model = newObj.replace('new ', '').trim()
                    if (Namespace.modelNames().includes(model)) {
                        let lines = (fnStr.substring(0, fnStr.indexOf(line)).split('\n'))
                        const definition = lines[lines.length - 1].trim();
                        if (!definition.startsWith('//')) {
                            const position = lines.length - 1;
                            const replacers = ['const', 'let', 'var', '='];
                            let variable = definition;
                            for (let v of replacers) variable = variable.replace(v, '').trim();
                            let saving = (fnStr.split('\n').find(it => it.includes(`${variable}.save`)) || '').trim();
                            saving = saving.startsWith('//') ? null : saving;
                            let debugLine = transaction.debuger.line.split(':');
                            debugLine[1] = Number(debugLine[1]) + position;
                            debugLine[2] = Number(lines[lines.length - 1].length + 1);
                            debugLine = String(debugLine.join(':') + ' ');
                            // console.log(debugLine.join(':'))
                            list.push({
                                model, line, position, definition, variable, saving, debugLine,
                                usage: line.replace(newObj + "(", "transaction.add(" + model + ", ")
                            })
                        }
                    }
                }
                if (list.length) {
                    let message = 'Attempting to use Session with previously used add transaction elements without using Mongo sessions.' +
                        '\n\tUse strick: ' + this.#strict + '\n';
                    for (let it of list) {
                        message += '\tPosition: ' + it.debugLine +
                            '\n\tLine: ' + it.line +
                            '\n\tReplace with: ' + it.usage +
                            (it.saving ? '\n\tRemove: ' + it.saving + ' or comment it // ' + it.saving : '') +
                            '\n';
                        if (!!it.variable) {
                            fnStr = fnStr.replaceAll(it.line, it.usage);
                            const definition = it.definition.replace('=', '').trim();
                            fnStr = fnStr.replaceAll(it.definition, definition + '_td =');
                            if (it.saving) {
                                fnStr = fnStr.replaceAll(it.saving, it.definition + " " + it.variable + '_td.result;');
                            }
                        }
                    }
                    if (list.every(it => !!it.variable)) {
                        const rows = fnStr.split('\n');
                        fnStr = rows.slice(1, rows.length - 1).join('\n');
                        transaction.function = this.AsyncFunctionConstructor(transaction, 'session', fnStr);
                        this.#sendbox && console.log(this.constructor.name, transaction.function.toString());
                    }
                    throw new TransactionError(transaction, message);
                }
            }
        }
    }

    /**
     * @param {TransactionData} transaction
     * @param {...string} args
     * @return {function}
     * @constructor
     */
    AsyncFunctionConstructor(transaction, ...args) {
        const AsyncFunction = transaction.function.constructor;
        const fn = new AsyncFunction(...args);
        if (transaction.function.withSession) Object.defineProperty(fn, "withSession", {value: true});
        return fn;
    }

    /**
     * Requires MongoDB >= 3.6.0
     * @param {TransactionData} transaction
     * @return {Promise<*>}
     */
    async #execute(transaction) {
        if (this.#sendbox && transaction.isExecutor) {
            const fnstr = transaction.function.toString();
            const rows = fnstr.split('\n')
            console.log(this.constructor.name, 'execute',
                (transaction.function.withSession ? 'withSession ' : '') +
                (rows.slice(0, Math.min(4, rows.length)).join('\n')))
        }
        let rv, session;
        if (transaction.isExecutor && transaction.type === transaction.FUNCTION) {
            if (transaction.function.withSession) {
                await Namespace.default.startSession().then(async (_session) => {
                    (session = _session).startTransaction();
                    rv = await transaction.function(session)
                    if (!rv || rv.constructor.name !== transaction.MODEL)
                        throw new Error('Execute function with Session must return Model/Document')
                    return rv;
                }).then((doc) => session.commitTransaction()).then((doc) => session.endSession())
                    .catch(e => {
                        session.abortTransaction()
                        session.endSession()
                        throw e
                    })
            } else {
                rv = await transaction.function()
            }
        }
        return rv;
    }

    /**
     * @param {object: Namespace.Model|null} model
     * @param {object|function} object
     * @return {TransactionData}
     */
    add(model, object) {
        const td = new TransactionData(model, object, this)
        this.#setTimestamps(td).#clearPerviousCommits();
        this.transactions.push(td)
        return td;
    }

    /**
     * @param {TransactionData} transaction
     */
    #setTimestamps(transaction) {
        try {
            if (transaction.isModel) {
                const paths = [
                    {path: 'updatedAt', condition: transaction.document.isModified()},
                    {path: 'createdAt', condition: transaction.document.isNew}
                ]
                for (let v of paths) if (v.condition && transaction.schema[v.path] !== undefined)
                    transaction.document[v.path] = Date.now();
            }
        } catch (e) {
            console.error(e)
        }
        return this;
    }

    #clearPerviousCommits() {
        this.#commits = [];
        return this;
    }

    /**
     * Executes registered validation rules with asynchronous validators for this document.
     * @param {TransactionData} transaction
     * @return {Promise<void>}
     */
    async validateAsyncValidators(transaction) {
        if (transaction.document) {
            for (let field of transaction.schemaFields) {
                const schemaConstructor = transaction.schemaConstructor(field)
                if (schemaConstructor.hasValidator && transaction.document.isModified(field)) {
                    try {
                        let error = await transaction.document.validate([field]);
                        if (error) this.validationError(transaction, error)
                    } catch (e) {
                        this.validationError(transaction, e)
                    }
                }
            }
        }
        transaction.checkAsyncValidators = true
    }

    /**
     * @param {TransactionData} transaction
     * @param {object:{message: string}|Error} error
     */
    validationError(transaction, error) {
        this.clear();
        throw new TransactionError(transaction, error.message)
    }

    /**
     * Executes registered validation rules (skipping asynchronous validators) for this document.
     * @param {TransactionData} transaction
     * @return {Promise<void>}
     */
    async validateSchema(transaction) {
        if (transaction.isModel) {
            /**
             * @type {Error.ValidationError}
             */
            let error = transaction.document.validateSync();
            if (error) this.validationError(transaction, error)

            error = await transaction.document.validate(Object.keys(transaction.modifiedData));
            if (error) this.validationError(transaction, error)

            if (!transaction.document.isNew && transaction.document.isModified('_id')) {
                this.validationError(transaction, {message: 'An attempt to change the Document identifier was detected. Field: _id'})
            }
        }
        transaction.checkValidateSchema = true;
    }

    clear() {
        this.#clearAbstractDocuments();
        this.#data = [];
        return this
    }

    async validate() {
        for (let transaction of this.transactions) {
            if (transaction.isModel) {
                await this.validateAsyncValidators(transaction);
                await this.validateSchema(transaction);
                await this.validateUnique(transaction);
            } else if (transaction.type === transaction.FUNCTION) {
                transaction.checkAsyncValidators = transaction.checkValidateSchema = transaction.checkValidateUniques = true
            }
        }
    }

    #clearAbstractDocuments() {
        // for (let transaction of this.transactions) {
        //     if (transaction.isModel && transaction.document.constructor.name === transaction.DOCUMENT)
        //         transaction.document.clear && transaction.document.clear();
        // }
    }

    /**
     * Search unique keys if exists
     * @param {TransactionData} transaction
     * @return {Promise<void>}
     */
    async validateUnique(transaction) {
        if (transaction.isModel) {
            const isNew = transaction.document.isNew;
            const isModified = transaction.document.isModified();
            if (!isNew) {
                const prevTransaction = this.transactions.find(it => it.document && it.id !== transaction.id &&
                    it.document._id === transaction.document._id && it.document.isNew)
                if (!prevTransaction) {
                    const v = await transaction.model.exists({_id: transaction.document._id});
                    if (!v) {
                        this.clear()
                        this.documentNotExists(transaction)
                    }
                }
            }
            if (transaction.uniqueFields.length) {
                let query = {$or: []};
                for (let key of transaction.uniqueFields) query.$or.push({[key]: transaction.document[key]})
                if (!isNew) query = {_id: {$ne: transaction.document._id}, $or: query.$or}
                if (isNew || isModified) {
                    const count = await transaction.model.countDocuments(query);
                    if (count) this.validationError(transaction, {message: 'Duplicate key found. Check one of: ' + JSON.stringify(query.$or)})
                }
            }
        }
        transaction.checkValidateUniques = true
    }

    async #rollback() {
        console.info(this.constructor.name, `: Rollback ${this.commits.length} of ${this.transactions.length} transactions`)
        for (let doc of this.#documents.updated) {
            doc.markModified('__v');
            await doc.save();
        }
        for (let td of this.#documents.created) {
            await td.model.deleteOne({_id: td.document._id})
        }
        this.clear();
        this.#commits = [];
        this.#documents.updated = [];
        this.#documents.created = [];
    }

    async commit() {
        await this.validate();
        if (this.isVerified) for (let transaction of this.transactions) {
            if (!this.isVerified) await this.validate() // if new transaction added in executor
            try {
                if (transaction.isModel) {
                    if (transaction.document.isNew) {
                        this.#documents.created.push(transaction);
                        transaction.result = await transaction.document.save();
                        this.#sendbox && console.log(this.constructor.name, 'save', transaction.model, transaction.document)
                    } else if (transaction.document.isModified()) {
                        const _id = transaction.document._id;
                        const doc = await transaction.model.findById(_id);
                        if (doc) {
                            this.#documents.updated.push(doc)
                            transaction.result = await transaction.model.updateOne({_id}, transaction.modifiedData)
                            this.#sendbox && console.log(this.constructor.name, 'update', transaction.model, transaction.modifiedData)
                        } else {
                            this.documentNotExists(transaction)
                        }
                    }
                } else if (transaction.isExecutor) transaction.result = await this.#execute(transaction)
            } catch (e) {
                await this.#rollback()
                throw new TransactionError(transaction, this.constructor.name + ': ' + e.message, e.stack)
            }
            this.commits.push(transaction)
        }
        this.#sendbox && console.log(this.constructor.name, 'committed', this.commits.length,
            this.commits.map(it => it.isModel ? it.model : it.function))
        this.clear();
    }

    documentNotExists(transaction) {
        throw new TransactionError(transaction, 'Document ObjectId(`' + transaction.document._id + '`) not exists in collection ' +
            transaction.model.prototype.collection.collectionName.capitalize())
    }

}

module.exports = {Transaction, TransactionData, TransactionError};