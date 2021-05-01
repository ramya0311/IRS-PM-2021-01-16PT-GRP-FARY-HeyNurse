import os
import io
import xlsxwriter
import mimetypes
import string
import secrets
from datetime import datetime, timedelta
from .middlewares import login_required
from flask import Flask, json, g, request, send_file, Response
from flask_cors import CORS
from .sendgrid import email_send
from bson.json_util import dumps
from .login import query_member_record,create_new_member,create_password,login_call,get_users,update_user_details,saveSession, get_user_by_id, delete_user_details,get_current_user,delete_user_session
from .pre_processing import pre_processing
from werkzeug.utils import secure_filename
from .dbquery import getOneRequestByID, doUpdateRequest, doInsertRequest, doDeleteRequest, getAnalyticData, getAnalyticDataByWeek
from .prioritize import getOutstandingRequestsByPage
app = Flask(__name__)
CORS(app)

def json_response(payload, status=200):
  return (json.dumps(payload), status, {'content-type': 'application/json'})

def id_generator():
    generated_value = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(16))
    return generated_value

@app.route("/api/verification-email", methods=["POST"])
@login_required
def sendEmail():
  request_data = request.get_json()
  verification_data = {
    '_id': request_data.get('_id'),
    'isAdmin': request_data.get('isAdmin'),
    'verificationCode':id_generator(),
    'verifyBy': (datetime.utcnow() + timedelta(days=1)).isoformat()
  }
  updated_user = update_user_details(**verification_data)
  if updated_user:
    message_data = {
      'template_data': {'user_name': request_data['user_name'], 'verification_url': request_data.get('url') + '?_id=' + updated_user['verificationCode']},
      'to_email':  request_data['to_email'],
      'template_id': 'd-fd4424ab8c5b4cdd982e1b2ededa7e96'
    }
    received_response = email_send(**message_data)
    if(received_response == 202):
      return json_response({'message':'Sent verification email successfully.'}, 200)
    else:
      return json_response({'error': received_response}, 500)
  else:
      return json_response({'error': received_response}, 500)

@app.route("/api/verify-email", methods=["POST"])
def verifyEmail():
  request_data = request.get_json()
  query_data =  {
    'verificationCode': {'$eq':request_data.get('verification_code')},
    'verifyBy': {'$gte': datetime.utcnow()}
  }
  try:
    retrieved_user = query_member_record(**query_data)
    update_data = {
      '_id': str(retrieved_user.get('_id')),
      'isActivated': True,
      'isAdmin':retrieved_user.get('isAdmin'),
      'verificationCode': None,
      'verifyBy': None
    }
    updated_user = update_user_details(**update_data)
    return json_response(updated_user, 200)
  except Exception as e:
    print('e',e)
    return json_response({'error':'Unable to process this request'}, 500)

@app.route("/api/password", methods=["PATCH"])
def set_password():
  request_data = request.get_json()
  if not request_data.get('password'):
    return json_response({'error':'Unable to process this request'}, 500)
  authorization = request.headers.get("authorization", None)
  request_data['authorization'] = authorization
  try:
    create_password_status = create_password(**request_data)
    # Check and respond according to the status returned by the function.
    if (create_password_status == 404):
      return json_response({'error':'User not found'}, 404)
    elif (create_password_status == 401):
      return json.dumps({'error': 'No authorization token provided'}), 401, {'Content-type': 'application/json'}
    else:
      return json_response({'message':'Password created successfully'}, 200)
  except Exception as e:
    print('e',e)
    return json_response({'error':'Unable to process this request'}, 500)

  
@app.route("/api/nlp", methods=["POST"])
def receive_file():
  file_received = request.files['file_data']
  received_string = file_received.read().decode("latin-1")
  pre_processing(received_string)
  return json_response({'message':'Data inserted'}, 200)


@app.route("/api/user", methods=["GET"])
@login_required
def get_user():
  search_query = {
    'selector': json.loads(request.args.to_dict().pop('where'))
  }
  for k, v in request.args.items():
    search_query[k] = v
  result = get_users(**search_query)
  if (result):
    return json_response({'data': result.get('users'), 'total': result.get('total')}, 200)
  else:
    return json_response({'data': []}, 200)

@app.route("/api/user", methods=["POST"])
@login_required
def add_user():
  # Variable to receive the new user data passed by the sign up page.
  request_data = request.get_json()
  try:
    # Call the create_new_member() in login.py to create a new member
    create_member_status = create_new_member(**request_data)
    # Check and respond according to the status returned by the function.
    if (create_member_status.get('status') == 200):
      return json_response(create_member_status.get('user'), 200)
    else:
      return json_response({'error':'An account with the email already exists.'}, 400)
  except Exception as e:
    print('e',e)
    return json_response({'error':'Account cannot be created.'}, 500)
     
@app.route("/api/user", methods=["PATCH"])
@login_required
def update_user():
  request_data = request.get_json()
  try:
    updated_user = update_user_details(**request_data)
    return json_response(updated_user, 200)
  except Exception as e:
    print('e',e)
    return json_response({'error':'Unable to process this request'}, 500)  

@app.route("/api/<string:userID>/user", methods=["GET"])
@login_required
def get_single_user(userID):
   request_data = {'_id': userID}
   try:
    retrieved_user = get_user_by_id(**request_data)
    if (retrieved_user == 404):
      return json_response({'error':'User not found'}, 404)
    else:
      return json_response(retrieved_user, 200)
   except Exception as e:
    print('e',e)
    return json_response({'error':'Unable to process this request'}, 500)  

@app.route("/api/<string:userID>/user", methods=["DELETE"])
@login_required
def delete_user(userID):
  request_data = {'_id': userID}
  try:
    deleted_user = delete_user_details(**request_data)
    if (deleted_user > 0):
      return json_response({'_id': userID}, 200)
    else:
      return json_response({'error':'Unable to process this request'}, 500)
  except Exception as e:
    print('e',e)
    return json_response({'error':'Unable to process this request'}, 500)  

@app.route("/api/login", methods=["POST"])
def login():
  # Variable to receive the login information from login page.
  request_data = request.get_json()
  # Call the login() funcition in the login.py to perform login check.
  login_status = login_call(**request_data)
  if (login_status == 401):
    return json_response({'error':'Invalid Username or Password. Please try again'}, 401)
  elif (login_status == 404):
    return json_response({'error':'User not found'}, 404)
  else:
    try:
      savedSession = saveSession(login_status)
      return json_response({'access_token': savedSession.get('access_token'), 'expires_at': savedSession.get('expires_at')}, 200)
    except Exception as e:
      print('e',e)
      return json_response({'error':'Unable to process this request'}, 500)  

@app.route("/api/session", methods=["GET"])
@login_required
def get_loggedin_user():
  authorization = request.headers.get("authorization", None)
  if not authorization:
      return json.dumps({'error': 'No authorization token provided'}), 401, {'Content-type': 'application/json'}

  try:
    token = authorization.split(' ')[1]
    request_data = {
      'access_token': token
    }
    current_user = get_current_user(**request_data)
    if (current_user == 404):
      return json_response({'error':'User not found'}, 404)
    else:
      return json_response(current_user, 200)
  except Exception as e:
    print('e',e)
    return json_response({'error':'Unable to process this request'}, 500)  

@app.route("/api/session", methods=["DELETE"])
# @login_required
def delete_session():
  authorization = request.headers.get("authorization", None)
  if not authorization:
      return json.dumps({'error': 'no authorization token provided'}), 401, {'Content-type': 'application/json'}

  try:
    token = authorization.split(' ')[1]
    request_data = {
      'access_token': token
    }
    deleted_session = delete_user_session(**request_data)
    if (deleted_session == 200):
      return json_response({'message':'User logged out successfully'}, 200)
    else:
      return json_response({'error':'Unable to process this request'}, 500)
  except Exception as e:
    print('e',e)
    return json_response({'error':'Unable to process this request'}, 500) 

#############################################################
#
# Database Calls To Query, Create, Insert, Update and Delete
#
#############################################################

# Endpoint to query for all requests based on req_status.
@app.route("/api/requests", methods=["GET"])
@login_required
def queryRequests():
  queryString = {}
  for k, v in request.args.items():
    queryString[k] = v
    
  queryString["status"] = 1

  if "_id" in queryString:
    return getOneRequestByID(**queryString)
  else:
    try:
      if queryString["function"] == "CompletedRequestsByPage":
        queryString["status"] = 3
      elif queryString["function"] == "InProgressByPage":
        queryString["status"] = 2
      requests_retrieved = getOutstandingRequestsByPage(**queryString)
      return requests_retrieved
    except Exception as e:
      print('e',e)
      return json_response({'error':'Unable to process this request'}, 500)  



# Endpoint to peform update of requests collection.
@app.route("/api/requests", methods=["PATCH"])
@login_required
def updateRequests():

  queryString = request.get_json()

  return doUpdateRequest(**queryString)

@app.route("/api/requests", methods=["POST"])
@login_required
def insertRequests():

  queryString = request.get_json()

  return doInsertRequest(**queryString)

# Call this endpoint to delete request from the queue.
@app.route("/api/requests", methods=["DELETE"])
@login_required
def deleteRequests():

  queryString = {}
  for k, v in request.args.items():
    queryString[k] = v

  return doDeleteRequest(**queryString)


# Endpoint to get requests based on nurse_id and date parameters for anlytic purposes.
@app.route("/api/analyseData", methods=["GET"])
@login_required
def analyseData():

  queryString = {}
  for k, v in request.args.items():
    queryString[k] = v

  try:
    analytic_data = getAnalyticData(**queryString)
    return json_response({"data": analytic_data}, 200)
  except Exception as e:
      print('e',e)
      return json_response({'error':'Unable to process this request'}, 500)  
  

@app.route("/api/analyseData/excel", methods=["GET"])
@login_required
def exportData():

  queryString = {}
  for k, v in request.args.items():
    queryString[k] = v

  analytic_data = getAnalyticData(**queryString)
  response = Response()
  output = io.BytesIO()
  workbook = xlsxwriter.Workbook(output, {'in_memory': True})
  worksheet = workbook.add_worksheet('Sheet_1')
  for i, d in enumerate(analytic_data):
      for j, res in enumerate(d):
        if (i == 0):
          worksheet.write(i, j, 'Date' if res == 'name' else 'No. of requests')
        if (res == 'name'):
          worksheet.write(i+1, j, datetime.strptime(d[res], '%Y-%m-%d %H:%M:%S').strftime("%m/%d/%Y %I:%M %p"))
        else:
          worksheet.write(i+1, j, d[res])
         
  workbook.close()
  output.seek(0)
  response.data = output.read()
  file_name = 'my_file_{}.xlsx'.format(
            datetime.now().strftime('%d/%m/%Y'))
  mimetype_tuple = mimetypes.guess_type(file_name)
  response_headers = {
      'Pragma': "public",  # required,
      'Expires': '0',
      'Cache-Control': 'must-revalidate, post-check=0, pre-check=0',
      'Cache-Control': 'private',  # required for certain browsers,
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=\"%s\";' % file_name,
      'Content-Transfer-Encoding': 'binary',
      'Content-Length': len(response.data)
  }
  response.headers = response_headers
  if not mimetype_tuple[1] is None:
      response.headers['Content-Encoding'] = mimetype_tuple[1]
  
  return response


