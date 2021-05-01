import os
import pymongo
from pymongo import MongoClient,ReturnDocument
from datetime import datetime
import dns
class MongoRepository(object):
    def __init__(self):
        self.db = ''
        try:
            # Francis use this to connect to the cloud based Mongo
            mongo_url = 'mongodb://localhost:27017'
            client = MongoClient(mongo_url,connectTimeoutMS=30000, socketTimeoutMS=None, socketKeepAlive=True, connect=False, maxPoolsize=1)
            client.server_info() # force connection on a request as the
            self.db = client.PatientRequest
            db=client.PatientRequest
        except pymongo.errors.ServerSelectionTimeoutError as err:
            # do whatever you need
            print('Mongo error', err)
        
        
    def find_all(self, selector):
        return self.db[selector['collection']].find(selector['selector']).skip(selector['skip']).limit(selector['limit'])

    def find(self, selector):
        return self.db[selector['collection']].find_one(selector['selector'])

    def create(self, selector):
        return self.db[selector['collection']].insert_one(selector['data'])

    def update(self, selector, data):
        upsertData = selector.get('upsert') if selector.get('upsert') else False
        return self.db[selector['collection']].find_one_and_update(selector['selector'], {"$set": data}, return_document= ReturnDocument.AFTER, upsert= upsertData)

    def delete(self, selector):
        return self.db[selector['collection']].delete_one(selector["selector"]).deleted_count

    def aggregate(self, selector):
        return self.db[selector["collection"]].aggregate([selector["selector"], selector["groupBy"], selector["sortBy"]])