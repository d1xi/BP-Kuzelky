from fastapi import FastAPI, Request, Response, WebSocket
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
from shared import Boxes
from ocr import OCR
import cv2
import asyncio
from hash import decrypth, encrypt

import json
import os
CONFIG_PATH = "./src/renderer/utils/connectInformation.json"

#sum = 200; laneSum = 100; throws = 45; fallenPins = 3; time = 18000; mistakes = 4
#pins = 0b100100001

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ocr = OCR()

def loadConfig():
    if not os.path.exists(CONFIG_PATH):
        return{
            "ip" : "",
            "port": "",
            "userName" : "",
            "passwordEnc" : "",
        }

    try:
        with open(CONFIG_PATH, "r") as file:
            return json.load(file)
    except:
        return {
            "ip": "",
            "port": "",
            "userName": "",
            "passwordEnc": ""
        }

def saveConfig(ip, port, userName, password):
    data = {
        "ip" : ip,
        "port": port,
        "userName" : userName,
        "passwordEnc" : encrypt(password) if password else "",
    }

    with open(CONFIG_PATH, "w") as file:
        json.dump(data, file)

def getPassword():
    data = loadConfig()
    encrypted = data.get("passwordEnc", "")
    if not encrypted:
        return ""
    try:
        return decrypth(encrypted)
    except:
        return ""

@app.get("/frame")
def getFrame():
    frame = ocr.getFrame()
    if(frame is None):
        return Response(status_code=204)
    
    ret, buffer = cv2.imencode(".jpeg", frame) #".jpeg, frame"
    if not ret:
        return Response(status_code=500)
    return(Response(content=buffer.tobytes(), media_type="image/jpeg"))

@app.get("/config")
def getConfig():   
    data = loadConfig()
        
    return{
        "ip" : data.get("ip", ""),
        "port": data.get("port", ""),
        "userName" : data.get("userName", "")
    }

@app.post("/connect")
async def connectCam(request: Request):
    data = await request.json()

    ip = data.get("ip", "")
    port = data.get("port", "")
    userName = data.get("userName", "")
    passwordInput = data.get("password", "")
    rtspURL = data.get("rtspURL", "")

    stored = loadConfig()
    password = passwordInput or getPassword()
  
    if not rtspURL:
        if not password:
            return {"status": "error", "message": "Missing password"}

        rtspURL = f"rtsp://{userName}:{password}@{ip}:{port}/media/video1"

    # store encrypted ALWAYS (even if from old config)
    if passwordInput:
        saveConfig(ip, port, userName, passwordInput)

    ocr.Start(rtspURL)

    return {"status": "ok"}

@app.get("/values")
def readValues():
    with ocr.lock:
        return ocr.latestDetectedValues.copy()

@app.get("/boxes")
def getOCRBoxes():
    return ocr.boxes.model_dump() if ocr.boxes else {}

@app.post("/boxes")
def setOCRBoxes(boxes: Boxes):
    ocr.setBoxes(boxes)
    ocr.saveBoxes(boxes)
    return{"status": "ok"}

@app.get("/resolution")
def getResolution():
    return{
        "w": ocr.frameWidth,
        "h": ocr.frameHeight
    }

@app.websocket("/ws")
async def websocketEndpoint(ws: WebSocket):
    await ws.accept()

    lastData = None
    
    while True:
        await asyncio.sleep(0.5)

        with ocr.lock:
            data = ocr.latestDetectedValues.copy()
        
        if data != lastData:
            await ws.send_json(data)
            lastData = data

@app.on_event("startup")
def startup():
    config = loadConfig()

    try:
        password = ""
        if config.get("passwordEnc"):
            password = decrypth(config["passwordEnc"])

        if password:
            rtspURL = (
                f"rtsp://{config['userName']}:"
                f"{password}@{config['ip']}:"
                f"{config['port']}/media/video1"
            )
            ocr.Start(rtspURL)

    except Exception as e:
        print("OCR startup failed:", e)
        
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)


