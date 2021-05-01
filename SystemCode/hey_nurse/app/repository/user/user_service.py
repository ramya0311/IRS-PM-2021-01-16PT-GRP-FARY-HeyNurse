from app.repository import Repository
from ..mongo import MongoRepository
from .user_schema import UserSchema
from flask import json
class UserService(object):
  def __init__(self,repo_client=Repository(adapter=MongoRepository)):
    self.repo_client = repo_client

  def find_all_users(self, query):
    users  = self.repo_client.find_all(query)
    count = users.count()
    return {'users': [self.dump(user) for user in users], 'total': count}

  def find_user(self, **query):
    user_query = {
      'selector': query, 
      'collection': 'Users'
    }
    user = self.repo_client.find(user_query)
    return user

  def create_user(self, data):
    userData = {
      'collection': 'Users',
      'data': self.prepare_user(data)
    }
    user = self.repo_client.create(userData)
    userQuery = {
      '_id':user.inserted_id
    }
    createdUser = self.find_user(**userQuery)
    return self.dump(createdUser)

  def update_user(self, data):
    selector = {
      'collection': 'Users',
      'selector': data['selector']
    }
    records_affected = self.repo_client.update(selector, data['userData'])
    return self.dump(records_affected)

  def delete_user(self, **query):
    userData = {
      'collection': 'Users',
      'selector': query
    }
    records_affected = self.repo_client.delete(userData)
    return records_affected

  def dump(self, data):
    return UserSchema(exclude=['password']).dump(data).data

  def prepare_user(self, userData):
    data = UserSchema().load(userData).data
    return data
