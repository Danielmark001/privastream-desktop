var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __propKey = (this && this.__propKey) || function (x) {
    return typeof x === "symbol" ? x : "".concat(x);
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
import { Service } from 'services';
import Realm from 'realm';
import path from 'path';
import * as remote from '@electron/remote';
import { ExecuteInCurrentWindow } from './core';
export class RealmObject {
    get db() {
        return RealmService.instance.getDb(this);
    }
    get idString() {
        return this.realmModel['_id'].toHexString();
    }
    get realmModel() {
        if (!RealmService.hasInstance) {
            throw new Error('Realm service does not exist!');
        }
        if (!this.db) {
            throw new Error('Realm is not connected!');
        }
        if (!this._realmModel) {
            let result = this.db.objects(this.schema.name);
            if (this._initWithId) {
                result = result.filtered('_id == $0', this._initWithId);
            }
            if (result.length) {
                this._realmModel = result[0];
            }
            else {
                if (this._initWithId) {
                    throw new Error(`Object with id does not exist: ${this._initWithId}`);
                }
                try {
                    this.db.write(() => {
                        this._realmModel = this.db.create(this.schema.name, {});
                    });
                }
                catch (e) {
                    this._realmModel = this.db.create(this.schema.name, {});
                }
                this.onCreated();
            }
        }
        return this._realmModel;
    }
    onCreated() { }
    bindProps(target, bindings) {
        const setProps = () => {
            Object.keys(bindings).forEach(key => {
                if (typeof this[bindings[key]] === 'object') {
                    target[key] = this[bindings[key]].toJSON();
                }
                else {
                    target[key] = this[bindings[key]];
                }
            });
        };
        setProps();
        this.realmModel.addListener(setProps);
        return () => {
            this.realmModel.removeListener(setProps);
        };
    }
    deepPatch(patch) {
        Object.keys(patch).forEach(key => {
            if (!patch.hasOwnProperty(key))
                return;
            if (key === '__proto__' || key === 'constructor')
                return;
            const val = this[key];
            if (val instanceof RealmObject) {
                val.deepPatch(patch[key]);
            }
            else {
                this[key] = patch[key];
            }
        });
    }
    toObject() {
        const obj = {};
        Object.keys(this.schema.properties).forEach(key => {
            const val = this[key];
            if (val instanceof RealmObject) {
                obj[key] = val.toObject();
            }
            else {
                obj[key] = val;
            }
        });
        return obj;
    }
    reset() {
        this.db.write(() => {
            this.db.delete(this.realmModel);
        });
        this._realmModel = null;
    }
    constructor(schema, id, realmModel) {
        this.schema = schema;
        this._initWithId = id;
        this._realmModel = realmModel;
        Object.keys(this.schema.properties).forEach(key => {
            Object.defineProperty(this, key, {
                get() {
                    const val = this.realmModel[key];
                    if (val instanceof Realm.Object) {
                        const dataType = this.schema.properties[key];
                        let type = typeof dataType === 'string' ? dataType : dataType.type;
                        if (dataType.objectType && type !== 'dictionary')
                            type = dataType.objectType;
                        const klass = RealmService.registeredClasses[type];
                        return klass.fromRealmModel(val);
                    }
                    return this.realmModel[key];
                },
                set(val) {
                    if (val instanceof RealmObject) {
                        this.realmModel[key] = val.realmModel;
                    }
                    else {
                        this.realmModel[key] = val;
                    }
                },
            });
        });
    }
    static inject() {
        if (!RealmService.databaseMappings[this.schema.name]) {
            throw new Error(`Tried to inject \`${this.schema.name}\` before it was registered! Did you call \`${this.schema.name}.register()\` immediately after defining the class?`);
        }
        return new this(this.schema);
    }
    static register(opts = {}) {
        var _a, _b;
        if (RealmService.databaseMappings[this.schema.name]) {
            throw new Error(`\`${this.schema.name}\` was registered twice!`);
        }
        this.schema.properties['_id'] = { type: 'uuid', default: new Realm.BSON.UUID() };
        const schema = this.schema;
        const klass = {
            [_a = __propKey(this.schema.name)]: (_b = class extends Realm.Object {
                },
                __setFunctionName(_b, _a),
                _b.schema = schema,
                _b),
        };
        RealmService.registerObject(klass[this.schema.name], this, opts.persist);
    }
    static fromId(id) {
        const uuid = Realm.BSON.UUID.createFromHexString(id);
        return new this(this.schema, uuid);
    }
    static fromRealmModel(model) {
        return new this(this.schema, undefined, model);
    }
    static onMigration(oldRealm, newRealm) {
    }
    static build(name, initObject) {
        const propMap = {};
        const klass = class extends RealmObject {
        };
        Object.keys(initObject).forEach(k => {
            const descriptor = Object.getOwnPropertyDescriptor(initObject, k);
            if (typeof initObject[k] === 'function' || descriptor.get) {
                Object.defineProperty(klass.prototype, k, descriptor);
            }
            else {
                const t = typeof initObject[k];
                if (t === 'number') {
                    propMap[k] = { type: 'double', default: initObject[k] };
                }
                else if (t === 'boolean') {
                    propMap[k] = { type: 'bool', default: initObject[k] };
                }
                else if (t === 'string') {
                    propMap[k] = { type: 'string', default: initObject[k] };
                }
            }
        });
        klass.schema = {
            name,
            properties: propMap,
        };
        klass.register();
        return () => klass.inject();
    }
}
const REALM_SCHEMA_VERSION = 3;
export class RealmService extends Service {
    get ephemeralConfig() {
        const realmPath = path.join(remote.app.getPath('userData'), 'ephemeral.realm');
        return {
            schema: RealmService.ephemeralSchemas,
            path: realmPath,
            inMemory: true,
        };
    }
    get persistentConfig() {
        const realmPath = path.join(remote.app.getPath('userData'), 'persistent.realm');
        return {
            schema: RealmService.persistentSchemas,
            path: realmPath,
            schemaVersion: REALM_SCHEMA_VERSION,
            onMigration: this.executeMigrations,
        };
    }
    dumpEphemeralToDisk() {
        this.ephemeralDb.writeCopyTo({
            schema: RealmService.ephemeralSchemas,
            path: path.join(remote.app.getPath('userData'), 'ephemeral-copy.realm'),
        });
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            this.persistentDb = yield Realm.open(this.persistentConfig);
            this.ephemeralDb = yield Realm.open(this.ephemeralConfig);
        });
    }
    executeMigrations(oldRealm, newRealm) {
        Object.values(RealmService.registeredClasses).forEach(klass => {
            klass.onMigration(oldRealm, newRealm);
        });
    }
    static registerObject(obj, klass, persist = false) {
        persist ? this.persistentSchemas.push(obj) : this.ephemeralSchemas.push(obj);
        this.databaseMappings[obj['schema']['name']] = persist ? 'persistent' : 'ephemeral';
        this.registeredClasses[obj['schema']['name']] = klass;
    }
    getDb(obj) {
        if (RealmService.databaseMappings[obj.schema.name] === 'persistent') {
            return this.persistentDb;
        }
        else {
            return this.ephemeralDb;
        }
    }
}
RealmService.persistentSchemas = [];
RealmService.ephemeralSchemas = [];
RealmService.databaseMappings = {};
RealmService.registeredClasses = {};
__decorate([
    ExecuteInCurrentWindow()
], RealmService.prototype, "connect", null);
__decorate([
    ExecuteInCurrentWindow()
], RealmService.prototype, "getDb", null);
//# sourceMappingURL=realm.js.map