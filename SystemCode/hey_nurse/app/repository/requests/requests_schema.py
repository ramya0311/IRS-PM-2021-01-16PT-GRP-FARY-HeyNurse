from marshmallow import Schema, fields, ValidationError
from marshmallow.utils import missing
import bson
from datetime import datetime

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

class RequestSchema(Schema):
    _id = ObjectId()
    req_class = fields.Integer()
    req_datetime = fields.DateTime()
    req_src_ward = fields.Str()
    req_src_room = fields.Str()
    req_src_bed = fields.Str()
    req_message = fields.Str()
    req_nurse_id  = fields.Str(default=None,missing=None)
    req_start_datetime = fields.DateTime(default=None,missing=None)
    req_end_datetime = fields.DateTime(default=None,missing=None)
    req_status = fields.Integer()
    
class PostInsertReturnSchema(Schema):
    acknowledged = fields.Boolean()
    insertedId = fields.Str()


class AnalyticDataSchema(Schema):
    _id = fields.DateTime()
    counts = fields.Integer()