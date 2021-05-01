from .middlewares import login_required
from flask import Flask, json, g, request
from flask_cors import CORS
from datetime import datetime, timedelta
import json

from app.repository.mongoDB import MongoRepository as repo
# Try to stage
# This file contains all the API for the prioritization of jobs based on the classification.

# Always load the stack from the database or if the stack is cached in memory for faster processing.
# Call a function to compare each item in the stack and insert the new item above the item where the rank scoreis lower than itself.
# Rank scores are assigned to each request in the stack based on some calculations done based on applying the various ranking rules.

def loadRequestStack(**kwargs):
    # Load the stack from the database into three different stacks, each for a specific request type (Critical, Medium and Low).
    # For now we load from a JSON.
    # importing the module 

    # Opening JSON file 
    with open('./data.json') as json_file: 
        data = json.load(json_file) 

        # The fields are: reqDateTime (as the primary key to the JSON record); 

        #I may not need sort the record because we just insert the record into the database and when we query to display, 
        #we then order it accordingly.
        # There should be a function to call to just update the priority_flag change for example if a item kept getting bumpped down or 
        # left unattended for more than a certain amount of preset time (depending on the request type), we update the priority_flag (integer) so
        # that when the sorting is done that includes this flag, it will be moved up the rank.
  
        # Print the type of data variable 
        print("Type:", type(data)) 
  
        # Print the data of dictionary 
        print("\nPeople1:", data['people1']) 
        print("\nPeople2:", data['people2']) 


# Function that push the request into the database which will be read by the Nursing Station Dashboard and prioritize using the sort function in the query command.
def registerRequest(**kwargs):
    # Open database connection:
    db = getDBConnect()

    # Setup the JSON to insert
    jsonObj = '{'
    for key,value in kwargs.items():
        if jsonObj != '{':
            jsonObj = jsonObj + ','

        jsonObj = jsonObj + '"' + key + '"' + ' : ' + '"' + value + '"'
    
    jsonObj = jsonObj + '}'

    # Insert the record into the database


    

# Accepts request date time (yyyymmddhhmmss), request_id and request_text in textual form and call function to insert into stack in the right position (or priority).
# Expecting the request_speech portion of the argument to contain all the sentences spoken by the user if he/she provided more than one sentences.
def prioritize_request(**kwargs):
    
    # Check that the **kwargs has exactly 3 input.
    if len(kwargs) == 3:
    
        # Call function to register and sort the request against the existing request and push it into a JSON
        # reqStatus : 'New' = new request, 'Completed' = Attended and closed, 'In Progress' = Nurse is currently attending to the request, 'KIV' = Keep in view and leave open to attend to again.
        vStatus = registerRequest(reqDateTime = kwargs['reqDateTime']
                                , reqType = kwargs['reqType']
                                , reqText = kwargs['reqText']
                                , reqElevateFlag = 'N'
                                , reqStatus = 'New')

        




    else:
        return(error code)