from fastapi import FastAPI
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from shared import Boxes, Box
#from ocr import Detect
from ocr import OCR
from threading import Thread
import cv2

import json
import os
CONFIG_PATH = "./src/renderer/utils/connectInformation.json"

ocr = OCR()
ocr_boxes: Boxes | None = None

#sum = 200; laneSum = 100; throws = 45; fallenPins = 3; time = 18000; mistakes = 4
#pins = 0b100100001

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def loadConfig():
    if not os.path.exists(CONFIG_PATH):
        return{
            "ip" : "",
            "userName" : "",
            "password" : ""
        }
    
    with open(CONFIG_PATH, "r") as file:
        data = json.load(file)
        return data

def saveConfig(ip, userName, password):
    data = {
        "ip" : ip,
        "userName" : userName,
        "password" : password
    }

    with open(CONFIG_PATH, "w") as file:
        json.dump(data, file)

@app.get("/frame")
def getFrame():
    frame = ocr.getFrame()
    if(frame is None):
        return(-1)
    
    ret, buffer = cv2.imencode(".jpeg", frame) #".jpeg, frame"
    return(Response(content=buffer.tobytes(), media_type="image/jpeg"))

@app.get("/config")
def getConfig():   
    data = loadConfig()
        
    return{
        "ip" : data.get("ip", ""),
        "userName" : data.get("userName", "")
    }

@app.post("/connect")
def connectCam():
    return "ok"

@app.get("/values")
def readValues():
    return ocr.latestDetectedValues

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


config = loadConfig()
thread = Thread(target=ocr.Start, args=[config], daemon=True)
thread.start()
uvicorn.run(app)


