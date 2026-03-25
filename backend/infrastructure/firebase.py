import firebase_admin
from firebase_admin import credentials 

#initialize firebase app with service account credentials   
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)

