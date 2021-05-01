from bson.objectid import ObjectId
import jwt
import bcrypt
from app.repository.session.session_service import SessionService as sessionService
from app.repository.user.user_service import UserService as userService
from .middlewares import login_required
from flask import Flask, json, g, request
from flask_cors import CORS
from datetime import datetime, timedelta
import time
import sys
sys.path.append(".")


# Function to hash any password.
def create_hashed_pwd(**kwargs):
    # Generate salt and used it to hash the password
    salt = bcrypt.gensalt()
    return (bcrypt.hashpw(kwargs['password'].encode('utf8'), salt))


# Function to check password against hashed password.
def check_pwd(**kwargs):
    # Return 1 when there is a match and 0 when there is no match.
    if bcrypt.checkpw(kwargs['user_password'].encode('utf8'), kwargs['query_password']):
        return 1
    else:
        return 0


# Function to query DB for member data.
def query_member_record(**kwargs):
    # Instantiate a db object.
    user = userService().find_user(**kwargs)
    return user


# Function called to initiate the sign up process.
def create_new_member(**kwargs):
    request_data = kwargs

    # Check in the DB to see if email already used by other member account.
    # At the moment, this is not available and thus a code is commented out and
    # instead a dummy value is used.

    user_data = {'email': request_data['email'].lower()}
    query_result = query_member_record(**user_data)
    # If the query is successful, it means a similar email is found and 0 is returned.
    if (query_result) is not None:
        return 400
    # If the query returns no record or unsuccessful, it means this email does not exist in the DB.
    # Proceed to create a new member account.
    else:
        try:
            return {'user' : userService().create_user(request_data), 'status': 200}
        except Exception as e:
            print('e', e)
            return 500


def create_password(**kwargs):
    request_data = kwargs
    if (request_data['authorization']):
        query_info = {
        '_id': ObjectId(request_data.get('_id'))
        }
    else:
        query_info = {'email': request_data['email'].lower()}
    query_result = query_member_record(**query_info)
    if query_result and query_result.get('isActivated') and request_data['email']:
        return 401
    elif query_result is None:
        return 404
    else:    
        # Hash the password
        if request_data.get('email') is not None:
            update_query = {
                'selector': {'email': request_data['email'].lower()},
                'collection': 'Users',
                'userData': {'password': create_hashed_pwd(**request_data)}
            }
            return userService().update_user(update_query)
        elif request_data['_id']: 
            update_query = {
                'selector': {'_id': ObjectId(request_data['_id'])},
                'collection': 'Users',
                'userData': {'password': create_hashed_pwd(**request_data)}
            }
            return userService().update_user(update_query)
        else:
            return 0


# Function called to perform login with user credential.
def login_call(**kwargs):
    request_data = kwargs
    # Call the db function to retrieve stored member record information.
    user_data = {'email': request_data['email'].lower()}
    query_result = query_member_record(**user_data)
    if not query_result:
        return 404
    else:
        request_input = {
            'user_password': request_data['password'],
            'query_password': query_result['password']
        }
        check_passwd_status = check_pwd(**request_input)

    # Encode token and write the encoded token to json_response as 'token'.
    if check_passwd_status:
        JWT_SECRET = 'secret'
        JWT_ALGORITHM = 'HS256'
        JWT_EXP_DELTA_HOURS = 8
        payload = {
            'user_id': str(query_result['_id']),
            'exp': datetime.utcnow() + timedelta(hours=JWT_EXP_DELTA_HOURS),
        }
        jwt_token = jwt.encode(payload, JWT_SECRET, JWT_ALGORITHM)
        return {'sessionID': str(query_result['_id']), 'access_token': jwt_token.decode('utf-8'), 'expires_at': payload.get('exp')}
    else:
        return 401


def saveSession(sessionData):
    update_query = {
        'selector': {'sessionID': sessionData.get('sessionID')},
        'collection': 'Sessions',
        'sessionData': sessionData
    }
    return sessionService().update_session(update_query)


def get_users(**kwargs):
    request_data = kwargs
    search_query = {
        'selector': request_data.get('selector'),
        'skip': int(request_data.get('skip')) if request_data.get('skip') else 0,
        'limit': int(request_data.get('limit')) if request_data.get('limit') else 10,
        'collection': 'Users'
    }
    result = userService().find_all_users(search_query)
    return result


def update_user_details(**kwargs):
    request_data = kwargs
    update_query = {
        'selector': {'_id':  ObjectId(request_data.pop('_id'))},
        'collection': 'Users',
        'userData': request_data
    }
    print('update_query', update_query)
    return userService().update_user(update_query)

def delete_user_details(**kwargs):
    request_data = kwargs
    delete_query = {'_id':  ObjectId(request_data.get('_id'))}
    return userService().delete_user(**delete_query)

def get_current_user(**kwargs):
    print('here', kwargs)
    session_info = sessionService().find_session(**kwargs)
    if (session_info):
        query_info = {
            '_id': ObjectId(session_info.get('sessionID'))
        }
        user = query_member_record(**query_info)
        return userService().dump(user)
    else:
        return 404

def delete_user_session(**kwargs):
     session_info = sessionService().delete_session(**kwargs)
     if (session_info):
        return 200
     else:
        return 500

def get_user_by_id(**kwargs):
    query_info = {
        '_id': ObjectId(kwargs.get('_id'))
    }
    user = query_member_record(**query_info)
    if (user):
        return userService().dump(user)
    else:
        return 404
