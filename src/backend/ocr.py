import numpy as np
import pytesseract
import cv2
import time
import math
import os
import json
from shared import Boxes, Box

import threading

SAVED_BOXES = "boxes.json"

class OCR ():
    def __init__(self):
        self.capture = None
        self.boxes = self.loadBoxes()
        self.lock = threading.Lock()
        self.latestDetectedValues = {}

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
    
    def getLatestValues(self):
        with self.lock:
            return self.latestDetectedValues.copy()

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

    def Start(self, config):
        #rtsp://admin:123456@192.168.1.13:554/media/video1 
        #link = f"rtsp://{config['userName']}:{config['password']}@{config['ip']}/media/video1"
        
        #link = "rtsp://localhost:8555/stream"
        link = "C:/Users/Lucie/Desktop/BP/Data.mp4"
        self.capture = cv2.VideoCapture(link, cv2.CAP_FFMPEG)
        self.capture.set(cv2.CAP_PROP_BUFFERSIZE, 1)

        if not self.capture.isOpened():
            print("Error: Could not open RTSP strem.\n")
            return (-1)

        self.frameWidth = int(self.capture.get(cv2.CAP_PROP_FRAME_WIDTH))
        self.frameHeight = int(self.capture.get(cv2.CAP_PROP_FRAME_HEIGHT))

        print("Starting RTSP capturing:\n")

        while True:
            start = time.time()
            values = self.getValues()

            with self.lock:
                self.latestDetectedValues = values
            
            lastTimeOfDetection = time.time() - start
            sleepTime = max(0.0, 5.0 - lastTimeOfDetection)
            time.sleep(sleepTime)

    
    def getFrame(self):
        ret, frame = self.capture.read()
        if not ret or frame is None:
            return None
        #size = frame.shape
        #print(size)
        return(frame)
    
    def getValues(self):
        frame = self.getFrame()
        
        if frame is None:
            return{}
        
        frame = cv2.cvtColor(frame, cv2.COLOR_RGB2GRAY)

        with self.lock:
            boxes = self.boxes

        if not boxes:
            print("No boxes")
            return{}
        
        language = "digitSevenSegmentNew" #digitSevenSegment #digitSevenSegment-psm13
        configuration = "--psm 13 -c tessedit_char_whitelist=0123456789 -c classify_bln_numeric_mode=1 -c load_system_dawg=0 -c load_freq_dawg=0"
        minConfidence=40

        detectedNumbers = {}
        boxes = self.boxes.model_dump()

        for box_type, box_list in boxes.items():
            if box_type == "pins":
                continue

            detectedNumbers[box_type] = []

            for box in box_list:
                box = self.toVideoResolution(box)
                x, y, w, h = box["x"], box["y"], box["w"], box["h"]
                frameHeight, frameWidth = frame.shape[:2]

                x = max(0, min(x, frameWidth -1))
                y = max(0, min(y, frameHeight -1))
                w = max(1, min(w, frameWidth - x))
                h = max(1, min(h, frameHeight - y))

                crop = frame[y:y+h, x:x+w]

                if crop.size == 0:
                    continue
                
                oldHeight, oldWidth = crop.shape
                newHeight = 50
                if(oldHeight == 0 or oldWidth == 0): continue
                aspectRatio = oldWidth / oldHeight
                newWidth = max(1, int(aspectRatio * newHeight))                

                crop = cv2.resize(crop, (newWidth, newHeight))
                
                cv2.imshow("crop", crop)
                cv2.waitKey(1)

                data = pytesseract.image_to_data(
                    crop,
                    lang=language,
                    config=configuration,
                    output_type=pytesseract.Output.DICT
                )

                numberChars = []
                confidences = []

                for i in range(len(data['text'])):
                    text = data['text'][i].strip()
                    try:
                        confidence = int(data['conf'][i])
                    except:
                        confidence = 0

                    if text.isnumeric() and confidence >= minConfidence:
                        numberChars.append(text)
                        confidences.append(confidence)
                
                number = ''.join(numberChars)

                averageConfidence = (
                    sum(confidences) / len(confidences) if confidences else 0
                )

                normalized = self.toNormalized(box)

                detectedNumbers[box_type].append({
                    "lane": box["lane"],
                    "value": number,
                    "confidence": averageConfidence
                })
        return detectedNumbers