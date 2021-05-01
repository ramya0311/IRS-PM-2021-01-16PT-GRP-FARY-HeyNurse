from marshmallow import Schema, fields, ValidationError
from marshmallow.utils import missing
import bson

class ObjectId(fields.Field):
    def _deserialize(self, value, attr, data):
        try:
            return bson.ObjectId(value)
        except Exception:
            raise ValidationError("invalid ObjectId `%s`" % value)

    def _serialize(self, value, attr, obj):
        if value is None:
            return missing
        return str(value)

class BytesField(fields.Field):
    def _validate(self, value):
        if not isinstance(value, bytes):
            raise ValidationError('Invalid input type.')

        if value is None or value == b'':
            raise ValidationError('Invalid value')

class UserSchema(Schema):
    _id= ObjectId()
    email= fields.Email(required=True,unique=True)
    user_name = fields.Str()
    user_id = fields.Str(required=True,unique=True)
    password = BytesField()
    isAdmin = fields.Boolean(default=True,missing=True,required=True)
    isActivated = fields.Boolean(default=False,missing=False,required=True)
    verificationCode = fields.Str(allow_none=True)
    verifyBy = fields.DateTime(allow_none=True)

