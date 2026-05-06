from fastapi import FastAPI, Request, Response, WebSocket
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
from shared import Boxes
from ocr import OCR
import cv2
import asyncio
from hash import decrypth, encrypt
from detect import Detect
from binary import Binary
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

#ocr = OCR()
binary = Binary()
detect = Detect(binary)

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
    frame = None

    with detect.lock:
        if detect.latestFrame is not None:
            frame = detect.latestFrame.copy()

    if frame is None:
        return Response(status_code=204)
    
    ret, buffer = cv2.imencode(".jpeg", frame)
    if not ret:
        return Response(status_code=500)

    return Response(content=buffer.tobytes(), media_type="image/jpeg")

@app.get("/config")
def getConfig():   
    data = loadConfig()
        
    return{
        "ip" : data.get("ip", ""),
        "port": data.get("port", ""),
        "userName" : data.get("userName", "")
    }

def clean(value, fallback):
    return value if value not in [None, ""] else fallback

@app.post("/connect")
async def connectCam(request: Request):
    data = await request.json()
    stored = loadConfig()

    ip = clean(data.get("ip"), stored.get("ip"))
    port = clean(data.get("port"), stored.get("port"))
    userName = clean(data.get("userName"), stored.get("userName"))

    passwordInput = data.get("password")

    storedPassword = ""
    if stored.get("passwordEnc"):
        storedPassword = decrypth(stored["passwordEnc"])

    password = passwordInput if passwordInput not in [None, ""] else storedPassword

    rtspURL = data.get("rtspURL", "")

    if not rtspURL:
        if not all([ip, port, userName, password]):
            return {"status": "error", "message": "Missing RTSP fields"}

        rtspURL = f"rtsp://{userName}:{password}@{ip}:{port}/media/video1"

    if passwordInput not in [None, ""]:
        saveConfig(ip, port, userName, passwordInput)

    print("FINAL RTSP:", rtspURL)

    detect.start(rtspURL)

    return {"status": "ok"}


@app.get("/values")
def readValues():
    with detect.lock:
        return detect.latestValues.copy()

@app.get("/boxes")
def getOCRBoxes():
    return detect.boxes.model_dump() if detect.boxes else {}

@app.post("/boxes")
def setOCRBoxes(boxes: Boxes):
    detect.setBoxes(boxes)
    detect.saveBoxes(boxes)
    return{"status": "ok"}

@app.get("/resolution")
def getResolution():
    return{
        "w": detect.frameWidth,
        "h": detect.frameHeight
    }

@app.websocket("/ws")
async def websocketEndpoint(ws: WebSocket):
    await ws.accept()

    lastData = None
    
    while True:
        await asyncio.sleep(0.5)

        with detect.lock:
            data = detect.latestValues.copy()
        
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
            detect.start(rtspURL)

    except Exception as e:
        print("OCR startup failed:", e)
        
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)


