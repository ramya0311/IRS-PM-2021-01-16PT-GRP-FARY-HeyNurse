from marshmallow import Schema, fields, ValidationError
from marshmallow.utils import missing
import bson
import datetime

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

class SessionSchema(Schema):
    _id= ObjectId()
    sessionID = fields.Str()
    access_token = fields.Str()
    expires_at = fields.Int()