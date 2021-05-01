from app.repository import Repository
from app.repository.mongo import MongoRepository
from .requests_schema import RequestSchema, PostInsertReturnSchema, AnalyticDataSchema
from flask import json

class RequestService(object):
  def __init__(self,repo_client=Repository(adapter=MongoRepository)):
    self.repo_client = repo_client

  def find_all_requests(self, query):
    requests  = self.repo_client.find_all(query)
    count = requests.count()
    return {"requests": requests, "total": count}

  def analyse_aggregate(self, query):
    analyseResult  = self.repo_client.aggregate(query)
    return analyseResult

  def find_one_request(self, query):
    return self.repo_client.find(query)

  def update_request(self, data):
    selector = {
      "collection": data["collection"],
      "selector": data["selector"]
    }
    recordsAffected = self.repo_client.update(selector, data['requestData'])
    return self.dump(recordsAffected)

  def create_request(self, data):
    requestData = {
      "collection": data.pop("collection"),
      "data": self.prepare_request(data)
    }
    insertResult = self.repo_client.create(requestData)
    request = self.dump(insertResult,True)
    return request

  def dump(self, data,isInsert=False, isAnalyse=False):
    if isInsert:
      return PostInsertReturnSchema().dump(data).data
    elif isAnalyse:
      return AnalyticDataSchema().dump(data).data
    else:
      return RequestSchema().dump(data).data

  def delete_request(self, query):
    records_affected = self.repo_client.delete(query)
    return records_affected > 0

  def prepare_request(self, requestData):
    data = RequestSchema().load(requestData).data
    return data
