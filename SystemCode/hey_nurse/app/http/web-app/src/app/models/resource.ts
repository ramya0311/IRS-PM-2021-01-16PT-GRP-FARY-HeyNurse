import * as moment from 'moment';
import * as _ from 'underscore';
import 'reflect-metadata';
import { isNullOrUndefined } from 'util';
const serializableFieldsKey = Symbol('serializableFields');
// tslint:disable-next-line:typedef
export function Serializable(options?: SerializationOptions) {
    return (target: DataContract, propertyKey: string) => {
        Reflect.defineMetadata(
            serializableFieldsKey,
            (Reflect.getMetadata(serializableFieldsKey, target) || []).concat(
                _.extend({ property: propertyKey }, options)
            ),
            target
        );
    };
}

export const dateSerialization = {
    serialize: (val: Date) => val && val.toISOString(),
    deserialize: (val: string) => val && moment(val).toDate(),
};

export interface SerializationOptions {
    jsonFieldName?: string;
    serialize?: (val: any) => string | number | boolean | object;
    deserialize?: (val: any) => any;
    defaultValue?: any;
}
export class DataContract {
    id: string;

    get serializableFields(): Array<{ property: string } & SerializationOptions> {
        return Reflect.getMetadata(serializableFieldsKey, this);
    }

    constructor(data?: any) {
        if (data) {
            if (this.serializableFields) {
                this.serializableFields.forEach(field => {
                    const jsonValue = data[field.jsonFieldName || field.property];

                    if (
                        !isNullOrUndefined(field.defaultValue) &&
                        isNullOrUndefined(jsonValue)
                    ) {
                        this[field.property] = field.defaultValue;
                    } else {
                        if (field.deserialize) {
                            this[field.property] = field.deserialize(jsonValue);
                        } else {
                            this[field.property] = jsonValue;
                        }
                    }
                });
            } else {
                this.id = data.id;
            }
        } else if (this.serializableFields) {
            this.serializableFields
                .filter(s => !isNullOrUndefined(s.defaultValue))
                .forEach(field => {
                    this[field.property] = field.defaultValue;
                });
        }
    }

    toCreatePayload(): any {
        const payload: any = {};
        if (this.serializableFields) {
            this.serializableFields.forEach(field => {
                if (
                    _.isObject(this[field.property]) &&
                    this[field.property].toCreatePayload
                ) {
                    payload[field.jsonFieldName || field.property] = this[
                        field.property
                    ].toCreatePayload();
                } else if (field.serialize) {
                    payload[field.jsonFieldName || field.property] = field.serialize(
                        this[field.property]
                    );
                } else if (field.serialize !== null) {
                    payload[field.jsonFieldName || field.property] = this[field.property];
                }
            });
        } else {
            _.keys(this).forEach(k => {
                if (k.startsWith('_')) {
                    return;
                }

                if (!_.isFunction(this[k])) {
                    if (_.isObject(this[k]) && this[k].toCreatePayload) {
                        payload[k] = this[k].toCreatePayload();
                    } else {
                        payload[k] = this[k];
                    }
                }
            });

        }

        return payload;
    }

    toUpdatePayload(): any {
        const payload = this.toCreatePayload();
        payload.id = this.id;

        return payload;
    }
}
