from app.repository import Repository
from ..mongo import MongoRepository
from .session_schema import SessionSchema
from flask import json
class SessionService(object):
  def __init__(self,repo_client=Repository(adapter=MongoRepository)):
    self.repo_client = repo_client

  def find_session(self, **query):
    print('finding', query)
    session_query = {
      'selector': query, 
      'collection': 'Sessions'
    }
    session = self.repo_client.find(session_query)
    return session

  def update_session(self, data):
    selector = {
      'collection': 'Sessions',
      'selector': data['selector'],
      'upsert': True
    }
    records_affected = self.repo_client.update(selector, data['sessionData'])
    return self.dump(records_affected)

  def delete_session(self, **query):
    sessionData = {
      'collection': 'Sessions',
      'selector': query,
    }
    records_affected = self.repo_client.delete(sessionData)
    return records_affected > 0

  def dump(self, data):
    return SessionSchema(exclude="_id").dump(data).data

  def prepare_session(self, sessionData):
    data = SessionSchema().load(sessionData).data
    return data
