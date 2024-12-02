import avro from 'avsc';

export default class DateType extends avro.types.LogicalType {
    constructor(schema:avro.Schema, opts?: any) {
        super(schema, opts);
        if (!avro.Type.isType(this.underlyingType, 'long', 'string')) {
            throw new Error('invalid underlying date type');
        }
    }

    _fromValue(val: any) { return new Date(val); }

    _toValue(date: any) {
        if (!(date instanceof Date)) {
            return undefined;
        }
        if (this.underlyingType.typeName === 'long') {
            return +date;
        } else {
            // String.
            return '' + date;
        }
    }

    _resolve(type: avro.Type) {
        if (avro.Type.isType(type, 'long', 'string', 'logical:timestamp-millis')) {
            return this._fromValue;
        }
    }
}