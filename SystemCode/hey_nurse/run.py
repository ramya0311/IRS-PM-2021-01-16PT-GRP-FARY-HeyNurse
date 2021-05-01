from app.http.api.endpoints import app
 
if __name__ == "__main__":
  app.run(threaded=True, port=4433)