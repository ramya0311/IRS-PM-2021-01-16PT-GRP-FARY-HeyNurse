from functools import wraps
from flask import request, g, abort
from jwt import decode, exceptions
import json
from datetime import datetime, timezone
def login_required(f):
  @wraps(f)
  def wrap(*args, **kwargs):
    authorization = request.headers.get("authorization", None)
    if not authorization:
      return json.dumps({'error': 'no authorization token provided'}), 401, {'Content-type': 'application/json'}

    try:
      token = authorization.split(' ')[1]
      resp = decode(token, None, verify=False, algorithms=['HS256'])
      exp_at = datetime.fromtimestamp(resp.get('exp'), timezone.utc).strftime("%A, %B %d, %Y %H:%M:%S")
      current_time = datetime.utcnow().strftime("%A, %B %d, %Y %H:%M:%S")
      if (current_time > exp_at):
        return json.dumps({'error': 'Unauthorized'}), 401, {'Content-type': 'application/json'}
    except exceptions.DecodeError as identifier:
      print('identifier', identifier)
      return json.dumps({'error': 'invalid authorization token'}), 401, {'Content-type': 'application/json'}

    return f(*args, **kwargs)
  return wrap
