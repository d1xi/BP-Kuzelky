import numpy as np
import pytesseract
import cv2
import time
import os
import json
from shared import Boxes, Box

import threading

SAVED_BOXES = "boxes.json"

class Detect ():
    def __init__(self, ocr, binary, state):
        self.capture = None
        self.latestFrame = None

        self.boxes = self.loadBoxes()
        self.lock = threading.Lock()

        self.ocr = ocr
        self.binary = binary

        self.frameWidth = None
        self.frameHeight = None

        self.state = state
        self.latestDetectedValues = {}

        self.captureThread = None
        self.processingThread = None

    def setBoxes(self, boxes: Boxes):
        with self.lock:
            self.boxes = boxes

    def saveBoxes(self, boxes: Boxes):
        with self.lock:
            with open(SAVED_BOXES, "w") as f:
                json.dump(boxes.model_dump(), f, indent=2)

    def loadBoxes(self):
        if not os.path.exists(SAVED_BOXES):
            return Boxes()
        with open(SAVED_BOXES, "r") as f:
            return Boxes(**json.load(f))

    def toVideoResolution(self, box: dict):
        return {
            "lane": box["lane"],
            "x": int(box["x"] * self.frameWidth),
            "y": int(box["y"] * self.frameHeight),
            "w": int(box["w"] * self.frameWidth),
            "h": int(box["h"] * self.frameHeight),
        }
    
    def toNormalized(self, box: dict):
        return {
            "lane": box["lane"],
            "x": box["x"] / self.frameWidth,
            "y": box["y"] / self.frameHeight,
            "w": box["w"] / self.frameWidth,
            "h": box["h"] / self.frameHeight,
        }

    def captureLoop(self):
        while True:
            if self.capture is None:                
                time.sleep(0.1)
                continue

            ret, frame = self.capture.read()

            if not ret:
                time.sleep(0.1)
                continue
           
            with self.lock:
                self.latestFrame = frame
        
    def processFrame(self):
        with self.lock:
            if self.latestFrame is None:
                return None

            frame = self.latestFrame.copy()
            boxes = self.boxes.model_dump()

        gray = cv2.cvtColor(frame, cv2.COLOR_RGB2GRAY)

        ocrInputs = {}
        binaryInputs = {}

        for box_type, box_list in boxes.items():
            if box_type in ["sum", "laneSum", "time", "throws", "fallenPins"]:
                ocrInputs[box_type] = self.cropBoxes(gray, box_list)
            elif box_type in ["startLight", "pins"]:
                binaryInputs[box_type] = self.cropBoxes(gray, box_list)

        return {
            "ocr": self.ocr.process(ocrInputs),
            "binary": self.binary.process(binaryInputs)
        }

    def cropBoxes(self, frame, box_list):
        crops = []

        for box in box_list:
            box = self.toVideoResolution(box)

            x, y, w, h = self.clampBox(frame, box)
            crop = frame[y:y+h, x:x+w]

            if crop.size == 0:
                continue
            
            if box.get("pinIndex") == None:
                continue

            crops.append({
                "lane": box["lane"],
                "pinIndex": box.get("pinIndex"),
                "boxType" : box.get("type"),
                "crop": crop
            })
        return crops
    
    def clampBox(self, frame, box):
        h, w = frame.shape[:2]

        x = max(0, min(box["x"], w - 1))
        y = max(0, min(box["y"], h - 1))
        bw = max(1, min(box["w"], w - x))
        bh = max(1, min(box["h"], h - y))

        return x, y, bw, bh

    def start(self, url):
        self.stop()
        #rtsp://admin:123456@192.168.1.13:554/media/video1 
        #link = f"rtsp://{config['userName']}:{config['password']}@{config['ip']}/media/video1"
        #print(url)
        #link = url
        link = "C:/Users/Lucie/Desktop/BP/fixed2.mp4"
        #print(cv2.getBuildInformation())
        #cv2.setNumThreads(0)
        #cv2.ocl.setUseOpenCL(False)
        #self.capture = cv2.VideoCapture(link, cv2.CAP_FFMPEG)
        self.capture = cv2.VideoCapture(link)
        #self.capture.set(cv2.CAP_PROP_HW_ACCELERATION, 0)

        if not self.capture.isOpened():
            print("Error: Could not open RTSP strem.\n")
            return (-1)

        self.frameWidth = int(self.capture.get(cv2.CAP_PROP_FRAME_WIDTH))
        self.frameHeight = int(self.capture.get(cv2.CAP_PROP_FRAME_HEIGHT))

        print("Starting RTSP capturing:\n")

        if self.captureThread == None:
            self.captureThread = threading.Thread(target=self.captureLoop, daemon=True)
            self.captureThread.start()
            print("New")
        if self.processingThread == None:
            self.processingThread = threading.Thread(target=self.processingLoop, daemon=True)
            self.processingThread.start()
            print("new2")

        return True

    def processingLoop(self):
        while True:
            result = self.processFrame()
            if result is None:
                continue

            ocr = result["ocr"]
            binary = result["binary"]

            stateResults = self.state.update(ocr, binary)

            with self.lock:
                self.latestDetectedValues = {
                    "ocr": ocr,
                    "binary": binary,
                    "state": stateResults
                }
            time.sleep(0.5)

    def getFrame(self):
        with self.lock:
            if self.latestFrame is None:
                return None
            return self.latestFrame.copy()
        
    def stop(self):
        with self.lock:
            if self.capture is not None:
                self.capture.release()
                self.capture = None

            self.latestFrame = None
        