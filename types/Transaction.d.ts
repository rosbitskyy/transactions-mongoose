/// <reference types="mongoose/types/aggregate" />
/// <reference types="mongoose/types/callback" />
/// <reference types="mongoose/types/collection" />
/// <reference types="mongoose/types/connection" />
/// <reference types="mongoose/types/cursor" />
/// <reference types="mongoose/types/document" />
/// <reference types="mongoose/types/error" />
/// <reference types="mongoose/types/expressions" />
/// <reference types="mongoose/types/helpers" />
/// <reference types="mongoose/types/middlewares" />
/// <reference types="mongoose/types/indexes" />
/// <reference types="mongoose/types/models" />
/// <reference types="mongoose/types/mongooseoptions" />
/// <reference types="mongoose/types/pipelinestage" />
/// <reference types="mongoose/types/populate" />
/// <reference types="mongoose/types/query" />
/// <reference types="mongoose/types/schemaoptions" />
/// <reference types="mongoose/types/schematypes" />
/// <reference types="mongoose/types/session" />
/// <reference types="mongoose/types/types" />
/// <reference types="mongoose/types/utility" />
/// <reference types="mongoose/types/validation" />
/// <reference types="mongoose/types/virtuals" />
/// <reference types="mongoose/types/inferschematype" />
import {Error, HydratedDocument, Model} from "mongoose";

export class Transaction extends NamespaceParser {
    get useStrict(): boolean;

    get transactions(): TransactionData[];

    get commits(): TransactionData[];

    get isVerified(): boolean;

    /**
     * options: MongoOptions: node_modules/mongodb/src/connection_string.ts:259
     * @return {{connectionString:string,options:{userSpecifiedReplicaSet:boolean,replicaSet:string,hosts:[]}}}
     */
    get client(): {
        connectionString: string;
        options: {
            userSpecifiedReplicaSet: boolean;
            replicaSet: string;
            hosts: [];
        };
    };

    /**
     * @return {boolean}
     */
    get isReplicaSet(): boolean;

    /**
     * @param {string} name
     * @return {Model<InferSchemaType<any>, ObtainSchemaGeneric<any, "TQueryHelpers">, ObtainSchemaGeneric<any, "TInstanceMethods">, ObtainSchemaGeneric<any, "TVirtuals">, HydratedDocument<InferSchemaType<any>, ObtainSchemaGeneric<any, "TVirtuals"> & ObtainSchemaGeneric<any, "TInstanceMethods">, ObtainSchemaGeneric<any, "TQueryHelpers">>, any> & ObtainSchemaGeneric<any, "TStaticMethods">}
     * @constructor
     */
    static Model(name: string): Model<any>;

    setSendbox(v: any): this;

    /**
     * @param {function} fn
     * @return {TransactionData}
     */
    execute(fn: Function): TransactionData;

    /**
     * @param {function(session: Namespace.ClientSession)} fn
     * @return {TransactionData}
     */
    session(fn: any): TransactionData;

    setStrict(v: any): this;

    /**
     * @param {TransactionData} transaction
     * @param {...string} args
     * @return {function}
     * @constructor
     */
    AsyncFunctionConstructor(transaction: TransactionData, ...args: string[]): Function;

    /**
     * @param {object: Namespace.Model|Namespace.Document|null} model
     * @param {object|Namespace.Document|function|null} object
     * @return {TransactionData}
     */
    add(model: any, object?: object | Namespace.Document | Function | null): TransactionData;

    /**
     * Executes registered validation rules with asynchronous validators for this document.
     * @param {TransactionData} transaction
     * @return {Promise<void>}
     */
    validateAsyncValidators(transaction: TransactionData): Promise<void>;

    /**
     * @param {TransactionData} transaction
     * @param {object:{message: string}|Error} error
     */
    validationError(transaction: TransactionData, error: any): void;

    /**
     * Executes registered validation rules (skipping asynchronous validators) for this document.
     * @param {TransactionData} transaction
     * @return {Promise<void>}
     */
    validateSchema(transaction: TransactionData): Promise<void>;

    clear(): this;

    validate(): Promise<void>;

    /**
     * Search unique keys if exists
     * @param {TransactionData} transaction
     * @return {Promise<void>}
     */
    validateUnique(transaction: TransactionData): Promise<void>;

    commit(): Promise<void>;

    documentNotExists(transaction: any): void;
}

export class TransactionData {
    MODEL: string;
    OBJECT: string;
    FUNCTION: string;
    DOCUMENT: string;
    id: string;
    model: any;
    data: any;
    document: Document;
    checkAsyncValidators: boolean;
    checkValidateSchema: boolean;
    checkValidateUniques: boolean;
    result: any;
    function: any;
    debugger: {
        frame: string;
        line: string;
    };

    /**
     * @param {object: Namespace.Model} model
     * @param {Namespace.Model|object|function} data
     * @param {Transaction} transaction
     */
    constructor(model: any, data: Namespace.Model<any, any, any, any, any, any> | object | Function, transaction: Transaction);

    static get rid(): string;

    get isModel(): boolean;

    get isExecutor(): boolean;

    get type(): any;

    get transaction(): Transaction;

    get uniqueFields(): [string];

    /**
     * @return {boolean}
     */
    get isVerified(): boolean;

    /**
     * @return {{[]: SchemaConstructor}}
     */
    get schema(): {};

    get schemaFields(): string[];

    /**
     * @return {{any}}
     */
    get modifiedData(): {
        any: any;
    };

    /**
     * @param {object} data
     */
    update(data: object): this;

    /**
     * @param {string} field
     * @return {object}
     */
    schemaConstructor(field: string): any;
}

export class TransactionError extends Error {
    time: number;
    transaction: {
        model: any;
        checkAsyncValidators: boolean;
        checkValidateSchema: boolean;
        checkValidateUniques: boolean;
        modifiedData: string | {
            any: any;
        };
        document: string;
        id: string;
    };
    info: string;

    /**
     * @param {TransactionData} _T
     * @param {string} message
     * @param {stack?: string|null} stack
     */
    constructor(_T: TransactionData, message: string, stack?: any);

    static debugger(): {
        frame: string;
        line: string;
    };
}

declare class NamespaceParser {
    /**
     * @param {object|HydratedDocument} v
     * @return {boolean}
     */
    isModel: (v: object | HydratedDocument<Model<any>>) => boolean;
    /**
     * @param {object|HydratedDocument} v
     * @return {boolean}
     */
    isDocument: (v: object | HydratedDocument<Model<any>>) => boolean;
    /**
     * @param {object|HydratedDocument} v
     * @return {HydratedDocument|null}
     */
    documentModel: (v: object | HydratedDocument<Model<any>>) => HydratedDocument<Model<any>> | null;
    /**
     * @param {object} v
     * @return {boolean}
     */
    isCleanDocument: (v: object) => boolean;
    /**
     * @param {object: {Model,any}|HydratedDocument} v
     * @return {*|(function(string): Model<InferSchemaType<any>, ObtainSchemaGeneric<any, "TQueryHelpers">, ObtainSchemaGeneric<any, "TInstanceMethods">, ObtainSchemaGeneric<any, "TVirtuals">, HydratedDocument<InferSchemaType<any>, ObtainSchemaGeneric<any, "TVirtuals"> & ObtainSchemaGeneric<any, "TInstanceMethods">, ObtainSchemaGeneric<any, "TQueryHelpers">>, any>)|string|Model<any>|null|(Model<InferSchemaType<any>, ObtainSchemaGeneric<any, "TQueryHelpers">, ObtainSchemaGeneric<any, "TInstanceMethods">, ObtainSchemaGeneric<any, "TVirtuals">, HydratedDocument<InferSchemaType<any>, ObtainSchemaGeneric<any, "TVirtuals"> & ObtainSchemaGeneric<any, "TInstanceMethods">, ObtainSchemaGeneric<any, "TQueryHelpers">>, any> & ObtainSchemaGeneric<any, "TStaticMethods">)}
     */
    getCleanDocModel: (v: any) => any | ((arg0: string) => Model<any>);
    /**
     * @param {object} v
     * @return {boolean}
     */
    isExecutor: (v: object) => boolean;

    /**
     * @param {object: {Model,any}|HydratedDocument} v
     * @return {(function(string): Model<InferSchemaType<any>, ObtainSchemaGeneric<any, "TQueryHelpers">, ObtainSchemaGeneric<any, "TInstanceMethods">, ObtainSchemaGeneric<any, "TVirtuals">, HydratedDocument<InferSchemaType<any>, ObtainSchemaGeneric<any, "TVirtuals"> & ObtainSchemaGeneric<any, "TInstanceMethods">, ObtainSchemaGeneric<any, "TQueryHelpers">>, any>)|string|Model<any>|*|Model<InferSchemaType<any>, ObtainSchemaGeneric<any, "TQueryHelpers">, ObtainSchemaGeneric<any, "TInstanceMethods">, ObtainSchemaGeneric<any, "TVirtuals">, HydratedDocument<InferSchemaType<any>, ObtainSchemaGeneric<any, "TVirtuals"> & ObtainSchemaGeneric<any, "TInstanceMethods">, ObtainSchemaGeneric<any, "TQueryHelpers">>, any>|null}
     */
    parseModel(v: any): ((arg0: string) => Model<any> | null);

    /**
     * @param {object: Namespace.Model|Namespace.Document|null} model
     * @param {object|function|null} object
     * @return {boolean}
     */
    isValidArguments(model: any, object: object | Function | null): boolean;
}

import Namespace = require("mongoose");

declare class Document {
    _ABSTRACT: string;
    _doc: {};
    isNew: boolean;
    model: any;
    _modelName: string;

    /**
     * @param {object: Namespace.Model} model
     * @param {object} object
     */
    constructor(model: any, object: object);

    get schema(): any;

    init(): void;

    markModified(path: any, v?: boolean): void;

    /**
     * @param {string|null} path
     * @return {boolean}
     */
    isModified(path?: string | null): boolean;

    /**
     * @param {object|Array<string>|null} v
     * @return {Error.ValidationError}
     */
    validateSync(v?: object | Array<string> | null): Error.ValidationError;

    /**
     * @param {string[]} paths
     * @return {Promise<undefined|*>}
     */
    validate(paths: string[]): Promise<undefined | any>;

    AbstractModel(): any;

    save(): Promise<void>;

    clear(): Promise<void>;
}

//# sourceMappingURL=Transaction.d.ts.map