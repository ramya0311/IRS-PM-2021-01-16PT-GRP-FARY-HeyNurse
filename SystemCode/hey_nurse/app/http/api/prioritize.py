import os
import pandas as pd
import numpy as np
from flask import Flask, json, g, request
from datetime import datetime
from bson.json_util import dumps
from .dbquery import getOutstandingRequests
from app.repository.requests.requests_service import RequestService
#from app.repository.mongoDB import dbConnect, find_all, update

# Load outstanding requests stack to loop through and check that no request is hanging for more than
# the requesting maximum waiting time as stipulated in the app_rules collection.
def getOutstandingRequestsByPage(**paramQueryString):

    pageOffset = int(paramQueryString["offset"])
    pageLimit = int(paramQueryString["limit"])
    completed = paramQueryString["status"]

    # Call the query to load outstanding request stack with the sorting and load them into the pandas dataframe
    queryResult = getOutstandingRequests(**paramQueryString)   
    if(queryResult['total'] == 0):
        return dumps({"data": [],"total": queryResult["total"]})
    # Create a pandas dataframe to store and process the data.  The mongoDB cursor is pushed into the dfQueryResult to form a dataframe
    # with all the fields.
    dfQueryResult = pd.DataFrame(queryResult["requests"])
    # If "completed" = True, then the records are sorted differently from if the "completed" = False
    if completed == 3:
        # Sort the results by req_datetime (descending), req_class (descending)
        dfQueryResultSorted = dfQueryResult.sort_values(["req_datetime", "req_class"], ascending=(False,False))
        dfQueryResultPaged = dfQueryResultSorted.iloc[pageOffset : (pageOffset + pageLimit),:]
    else:
        # This list will store the flag that indicates which requests have been stuck in the queue for more than 20 minutes since it was made.
        # If it was more than 20 minutes, the flag will be set to 1 otherwise 0.  
        # This flag is used for both sorting the records before returning to caller and also to allow caller, if they decide to, to highlight the records.
        lstQueryResult = []
        # Looping through the mongoDB cursor and for each record, the difference between current datetime and req_datetime
        # will be calculated and if it is greater than 20 minutes, the list will be populated with 1 otherwise with 0.
        for index, value in dfQueryResult.iterrows():
            y = lambda x: 1 if x and ((datetime.utcnow() - x).total_seconds() / 60) >= 20 else 0
            if completed == 2:
                lstQueryResult.append(y(value.req_start_datetime))
            else:
                if(isinstance(value.req_datetime,str)):
                    lstQueryResult.append(y(datetime.strptime(value.req_datetime,'%Y-%m-%dT%H:%M:%S.%f%z').replace(tzinfo=None)))
                else:
                    lstQueryResult.append(y(value.req_datetime))

        # The list is added to the dataframe as a "highlight_flag".
        dfQueryResult["highlight_flag"] = lstQueryResult
        # Sort the dataframe and generate a list object to return to the front end according to the offset and limit values given.
        # Dataframe is sorted into another dataframe by highlight_flag (descending i.e. that got stuck are moved up to the front.), req_status (ascending 
        # i.e. New reqests at the top), req_class (descending i.e. most urgent cases at the top), req_datetime(ascending i.e. oldest to the latest)
        dfQueryResultSorted = dfQueryResult.sort_values(["highlight_flag", "req_status", "req_class", "req_datetime"], ascending=(False,True,False,True))
        
        # The sorted dataframe is query with the offset and limit values to return the page and number of records according to what
        # the caller asked for.
        dfQueryResultPaged = dfQueryResultSorted.iloc[pageOffset : (pageOffset + pageLimit),:]
        df = dfQueryResultPaged.copy()
    # Datetime columns have to be re-cast to string or else it will appear as a string of numbers that represents the datetime objects.
    # Create temporary columns to housed the re-cast data. 
    dfQueryResultPaged[["req_datetime_temp","req_start_datetime_temp","req_end_datetime_temp"]] = dfQueryResultPaged.loc[:,["req_datetime","req_start_datetime","req_end_datetime"]].astype(str)

#    print(str(dfQueryResultPaged.iloc[2,:]))
    # The original datetime columns has to be dropped.
    #dfQueryResultPaged01 = dfQueryResultPaged01.drop(["req_datetime","req_start_datetime","req_end_datetime"], axis=1)
    dfQueryResultPaged = dfQueryResultPaged.drop(["req_datetime","req_start_datetime","req_end_datetime"], axis=1)

    # The temporary datetime columns are renamed to its original names.
    dfQueryResultPaged = dfQueryResultPaged.rename(columns={"req_datetime_temp":"req_datetime", "req_start_datetime_temp":"req_start_datetime", "req_end_datetime_temp":"req_end_datetime"})

    # Convert the dataframe to list object
    lstQueryResultPaged = []
    for idx, value in dfQueryResultPaged.iterrows():
        value._id = str(value._id)
        lstQueryResultPaged.append(value)
    return dumps({"data": lstQueryResultPaged,"total": queryResult["total"]})



