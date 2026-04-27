from fastapi import FastAPI
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
#from ocr import Detect
from ocr import OCR
from threading import Thread
import cv2


ocr = OCR()
ocr.Start()

sum = 200; laneSum = 100; throws = 45; fallenPins = 3; time = 18000; mistakes = 4
pins = 0b100100001

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/frame")
def getFrame():
    frame = ocr.getFrame()
    if(frame is None):
        return(-1)
    
    ret, buffer = cv2.imencode(".jpeg", frame)
    return(Response(content=buffer.tobytes(), media_type="image/jpeg"))

@app.get("/values")
def readValues():
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
def writeValues():
    return()

uvicorn.run(app)