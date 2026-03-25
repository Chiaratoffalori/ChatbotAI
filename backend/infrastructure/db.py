import os
from dotenv import load_dotenv
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi

load_dotenv()

uri = os.getenv("MONGODB_URI")

# Create a new client and connect to the server
client = MongoClient(uri, server_api=ServerApi('1'))

db = client["chatbot_db"]   
documents_collection = db["documents"]  
chats_collection = db["chats"]    

def get_documents_collection():
    return documents_collection

def get_chats_collection():
    return chats_collection