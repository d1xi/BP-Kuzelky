from fastapi import FastAPI
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
#from ocr import Detect
from ocr import OCR
from threading import Thread
import cv2

import json
import os
CONFIG_PATH = "./src/renderer/utils/connectInformation.json"

class Box(BaseModel):
    lane: int
    x: int
    y: int
    w: int
    h: int

class Boxes(BaseModel):
    sum: Box
    laneSum: Box
    throws: Box
    fallenPins: Box
    time: Box
    pins: list[Box]

ocr = OCR()


sum = 200; laneSum = 100; throws = 45; fallenPins = 3; time = 18000; mistakes = 4
pins = 0b100100001

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
    
    # testImg = cv2.imread("./src/backend/img.jpg")
    ret, buffer = cv2.imencode(".jpg", frame) #".jpeg, frame"
    return(Response(content=buffer.tobytes(), media_type="image/jpg"))

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
    return ocr.getValues()

    return [
        {
            "sum": sum,
            "laneSum": laneSum,
            "throws": throws,
            "fallesPins": fallenPins,
            "time": time,
            "mistakes": mistakes,
            "pins": pins   
        }
    ]

@app.get("/boxes")
def getOCRBoxes():
    return[
        {
            "sum": {"x":10, "y":20, "w":50, "h":20},
            "laneSum": {"x":10, "y":20, "w":50, "h":20},
            "throws": {"x":10, "y":20, "w":50, "h":20},
            "fallenPins": {"x":10, "y":20, "w":50, "h":20},
            "time": {"x":10, "y":20, "w":50, "h":20},
            "pins": [
                {"x":10, "y":20, "w":50, "h":20}
            ] 
        }
    ]

@app.post("/boxes")
def setOCRBoxes(boxes: Boxes):
    print(boxes)

config = loadConfig()
thread = Thread(target=ocr.Start, args=[config])
thread.start()
uvicorn.run(app)


