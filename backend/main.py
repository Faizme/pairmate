from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random
import string
import datetime
import firebase_admin
from firebase_admin import credentials, firestore, messaging
from typing import Optional
import requests

def send_push_notification(token: str, title: str, body: str):
    if token.startswith("ExponentPushToken"):
        try:
            res = requests.post(
                "https://exp.host/--/api/v2/push/send",
                json={
                    "to": token,
                    "title": title,
                    "body": body,
                    "sound": "default",
                    "priority": "high",
                    "channelId": "default",
                    "badge": 1
                }
            )
            print("Expo Push Response:", res.json())
        except Exception as e:
            print("Expo Send failed:", e)
    else:
        msg = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body
            ),
            android=messaging.AndroidConfig(
                priority='high',
                notification=messaging.AndroidNotification(
                    channel_id='default',
                    sound='default'
                )
            ),
            token=token,
        )
        try:
            messaging.send(msg)
            print("FCM Direct Send Success")
        except Exception as e:
            print("FCM Send failed:", e)

# Try to initialize Firebase
try:
    cred = credentials.Certificate("service_account.json")
    firebase_admin.initialize_app(cred)
    db = firestore.client()
except Exception as e:
    print(f"Warning: Firebase init failed. Check credentials. Using mock 'db=None' if testing locally without firestore emulator.")
    db = None

app = FastAPI(title="PairMate API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CreatePairRequest(BaseModel):
    user_name: str

class JoinPairRequest(BaseModel):
    user_name: str

class UpdateStatusRequest(BaseModel):
    user_id: int 
    status: str # "FREE" or "BUSY"

class UpdateNotifyRequest(BaseModel):
    user_id: int
    mode: str # "BROWSER", "SOUND", "SILENT"
    fcm_token: Optional[str] = None

def generate_pair_id():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

@app.post("/api/pairs")
def create_pair(req: CreatePairRequest):
    pair_id = generate_pair_id()
    data = {
        "user1_name": req.user_name,
        "user1_status": "FREE",
        "user1_notify_mode": "SILENT",
        "user1_fcm_token": None,
        "user2_name": None,
        "user2_status": None,
        "user2_notify_mode": None,
        "user2_fcm_token": None,
    }
    if db:
        # We append a timestamp using firestore constant
        data["created_at"] = firestore.SERVER_TIMESTAMP
        db.collection("pairs").document(pair_id).set(data)
    
    return {"pair_id": pair_id, "user_id": 1}

@app.post("/api/pairs/{pair_id}/join")
def join_pair(pair_id: str, req: JoinPairRequest):
    if not db:
        return {"pair_id": pair_id, "user_id": 2}
    
    doc_ref = db.collection("pairs").document(pair_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Pair not found")
        
    pair_data = doc.to_dict()
    if pair_data.get("user2_name") is not None:
        raise HTTPException(status_code=400, detail="Pair is full")
        
    doc_ref.update({
        "user2_name": req.user_name,
        "user2_status": "FREE",
        "user2_notify_mode": "SILENT",
        "user2_fcm_token": None
    })
    
    return {"pair_id": pair_id, "user_id": 2}

@app.put("/api/pairs/{pair_id}/status")
def update_status(pair_id: str, req: UpdateStatusRequest):
    if not db:
        return {"success": True}
        
    doc_ref = db.collection("pairs").document(pair_id)
    
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Pair not found")
        
    pair_data = doc.to_dict()
    
    if req.user_id == 1:
        prev_status = pair_data.get("user1_status")
        doc_ref.update({"user1_status": req.status})
        
        if req.status == "FREE" and prev_status != "FREE":
            partner_fcm = pair_data.get("user2_fcm_token")
            partner_mode = pair_data.get("user2_notify_mode")
            if partner_mode != "SILENT" and partner_fcm:
                send_push_notification(partner_fcm, "PairMate", "❤️ Your partner is now FREE!")

    elif req.user_id == 2:
        prev_status = pair_data.get("user2_status")
        doc_ref.update({"user2_status": req.status})
        
        if req.status == "FREE" and prev_status != "FREE":
            partner_fcm = pair_data.get("user1_fcm_token")
            partner_mode = pair_data.get("user1_notify_mode")
            if partner_mode != "SILENT" and partner_fcm:
                send_push_notification(partner_fcm, "PairMate", "❤️ Your partner is now FREE!")
    else:
        raise HTTPException(status_code=400, detail="Invalid user_id")
        
    return {"success": True}

@app.put("/api/pairs/{pair_id}/notify")
def update_notify(pair_id: str, req: UpdateNotifyRequest):
    if not db:
        return {"success": True}
        
    doc_ref = db.collection("pairs").document(pair_id)
    
    update_data = {}
    if req.user_id == 1:
        update_data["user1_notify_mode"] = req.mode
        if req.fcm_token is not None:
            update_data["user1_fcm_token"] = req.fcm_token
    elif req.user_id == 2:
        update_data["user2_notify_mode"] = req.mode
        if req.fcm_token is not None:
            update_data["user2_fcm_token"] = req.fcm_token
    else:
        raise HTTPException(status_code=400, detail="Invalid user_id")
        
    doc_ref.update(update_data)
        
    return {"success": True}

@app.get("/api/pairs/{pair_id}")
def get_pair(pair_id: str):
    if not db:
        return {"id": pair_id, "status": "mock"}
        
    doc = db.collection("pairs").document(pair_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Pair not found")
        
    return doc.to_dict()
