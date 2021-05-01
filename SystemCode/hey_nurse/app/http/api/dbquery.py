import os
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
import bson
from bson.json_util import dumps
from bson.objectid import ObjectId
from app.repository.requests.requests_service import RequestService as requestService
from app.repository.requests.requests_schema import RequestSchema as requestSchema


# Get all outstanding requests by page offset and limit => Using the requests_service files.
def getOutstandingRequests(**paramQueryString):

    # "status": 1 = "New", 2 = "In Progress", 3 = "Completed" 
    requestData = paramQueryString

    queryString = {}
    queryString["skip"] = 0
    queryString["limit"] = 0
    queryString["collection"] = "requests"

    if "_id" in requestData:
        queryString["selector"] = {"_id":  ObjectId(requestData['_id'])}
        # Pass the query result which is a single request record retrived from the collection.
        queryResult = requestService().find_one_request(queryString)
        return queryResult
    else:
        queryString["selector"] = {"req_status": {"$eq": requestData["status"]}}
        # Pass the queryResult to a prioritization function to get it prioritized and have an "hightlight_flag" set accordingly for
        # those records that are stuck in the queue for more than 20 minutes.
        queryResult = requestService().find_all_requests(queryString)
        return queryResult


# Get analytic data by req_nurse_id and either by day, or by month, or by week.
def getAnalyticData(**paramQueryString):
    requestData = paramQueryString

    #inputDateTime = ("{}-{}-{} 00:00:00".format(requestData["year"],requestData["month"],(requestData["day"] if requestData["day"] else "01")))
    #inputDateTime = ("{}-{}-{} 00:00:00".format(requestData["year"],requestData["month"],requestData["day"]))    
    groupByDateFormat = "%Y-%m-%d 00:00:00"

    if "days_before" in requestData and "day" in requestData:
        inputStartDate = datetime.strptime(("{}-{}-{} 00:00:00".format(requestData["year"],requestData["month"],requestData["day"])), "%Y-%m-%d %H:%M:%S")
        # Minus 7 days from the input start date to get the new start date
        startDate = inputStartDate - timedelta(days=int(requestData["days_before"]))
        endDate = inputStartDate + timedelta(days=1)

    elif "days_before" not in requestData and "day" in requestData:
        startDate = datetime.strptime(("{}-{}-{} 00:00:00".format(requestData["year"],requestData["month"],requestData["day"])), "%Y-%m-%d %H:%M:%S")
        endDate = startDate + timedelta(days=1)
        groupByDateFormat = "%Y-%m-%d %H:00:00"

    else:
        startDate = datetime.strptime(("{}-{}-{} 00:00:00".format(requestData["year"],requestData["month"],"01")), "%Y-%m-%d %H:%M:%S")
        endDate = startDate + relativedelta(months=1)

    queryString = {}
    queryString["collection"] = "requests"

    queryString["selector"] = {"$match": {"$and": [{"req_status": {"$in": [2,3]}},
                                                   {"req_nurse_id": {"$eq": requestData["req_nurse_id"]}},
                                                   {"req_start_datetime": {"$gte": startDate}},
                                                   {"req_start_datetime": {"$lt": endDate}}
                                                   ]}}

    queryString["groupBy"] = {"$group": {
            "_id": {"req_start_datetime": { "$dateToString": { "format": groupByDateFormat, "date": "$req_start_datetime" } }},
            "count": {"$sum": 1}
        }}

    queryString["sortBy"] = {"$sort": {"_id.req_start_datetime": 1}}

    queryResult = requestService().analyse_aggregate(queryString)

    lstQueryResult = []

    for value in queryResult:
        dictTemp = {"name": value["_id"]["req_start_datetime"], "value": value["count"]}
        lstQueryResult.append(dictTemp)
    
    return lstQueryResult



# Get analytic data by req_nurse_id for specific week window (starting day is day of the month value passed minus 7 days). 
def getAnalyticDataByWeek(**paramQueryString):
    return None




# Get one request record based on "_id" value.
def getOneRequestByID(**paramQueryString):

    queryResult = getOutstandingRequests(**paramQueryString)

    return dumps(requestService().dump(queryResult))



# New set of Update code using the requests_service approach.
def doUpdateRequest(**paramUpdateString):
    
    requestData = paramUpdateString

    collectionName = "requests"

    if requestData["req_status"] == 2:
        requestData["req_start_datetime"] = datetime.utcnow()
    elif requestData["req_status"] == 3:
        requestData["req_end_datetime"] = datetime.utcnow()
    else:
        # This is meant to reset the req_nurse_id (which is the attending nurse id), 
        # the start and end datetime to null value since the request has been reset to 
        # status of new by the nurse if they decide not to attend to it just yet.
        requestData["req_nurse_id"] = None
        requestData["req_start_datetime"] = None
        requestData["req_end_datetime"]= None

    updateString = {}

    updateString = {
        'selector': {'_id':  ObjectId(requestData.pop('_id'))},
        'collection': collectionName,
        'requestData': requestData
    }

    return dumps(dict(requestService().update_request(updateString)))



# Insert fuction for NLP model to call
def doInsertRequest(**paramInsertString):
    collectionName = "requests"
    patientWard = "7A"
    patientBed = "1"
    req_nurse_id = None

    insertString = {
        "collection": collectionName
        ,"req_class": int(paramInsertString["req_class"])
        ,"req_datetime": datetime.utcnow().isoformat()
        ,"req_src_ward": str(patientWard)
        ,"req_src_room": str(paramInsertString["req_src_room"])
        ,"req_src_bed": str(patientBed)
        ,"req_message": str(paramInsertString["req_message"])
        ,"req_nurse_id": req_nurse_id
        ,"req_start_datetime": None
        ,"req_end_datetime": None
        ,"req_status": 1
    }

    #insertString = RequestSchema(exclude=['_id']).dump(insertString)

    return dumps(dict(requestService().create_request(insertString)))



# Delete function for nurse to delete a request if they found out that this is no more requrired.
# For example, the family may have come out of the room to tell the nurse.
# Or in future, we may allow the patients or family members to instruct MyCroft to ignore or delete last request given.
def doDeleteRequest(**paramDeleteString):

    deleteString = {
        "collection": "requests",
        "selector": {"_id": ObjectId(paramDeleteString["_id"])}
    }

    # Returns a "True" if a record is found and deleted.  Otherwise , returns a "False"
    result = requestService().delete_request(deleteString)
    return dumps(str(result))
