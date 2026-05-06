import cv2
import time
import threading
import json
import os
import numpy as np
from collections import defaultdict, deque
from shared import Boxes

SAVED_BOXES = "boxes.json"


class Detect:
    def __init__(self, binary):
        self.capture = None
        self.source = None

        self.latestFrame = None
        self.latestFrameTime = None

        self.boxes = self.loadBoxes()
        self.lock = threading.Lock()

        self.binary = binary

        self.frameWidth = None
        self.frameHeight = None

        self.captureThread = None
        self.processingThread = None

        self.latestValues = {}
        self.running = False

        # REAL-TIME BUFFER 
        self.frameBuffer = deque(maxlen=15)  # sliding window only
        self.bufferLock = threading.Lock()
        self.bufferSize = 15

    # CONFIG 

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
            return self.latestValues.copy()

    # START / STOP
    def start(self, url):
        self.stop()

        url = "C:/Users/Lucie/Desktop/BP/fixed2.mp4"
        self.capture = cv2.VideoCapture(url, cv2.CAP_FFMPEG)

        self.capture.set(cv2.CAP_PROP_BUFFERSIZE, 1)

        if not self.capture.isOpened():
            print("Error: Could not open stream")
            return

        self.frameWidth = int(self.capture.get(cv2.CAP_PROP_FRAME_WIDTH))
        self.frameHeight = int(self.capture.get(cv2.CAP_PROP_FRAME_HEIGHT))

        print("Started capture")

        self.running = True

        self.captureThread = threading.Thread(target=self.captureLoop, daemon=True)
        self.processingThread = threading.Thread(target=self.processingLoop, daemon=True)

        self.captureThread.start()
        self.processingThread.start()

    def stop(self):
        self.running = False

        if self.capture:
            self.capture.release()
        self.capture = None

    # CAPTURE LOOP
    def captureLoop(self):
        while self.running:
            if self.capture is None:
                time.sleep(0.01)
                continue

            ret, frame = self.capture.read()

            if not ret:
                self.capture.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue

            with self.lock:
                self.latestFrame = frame
                self.latestFrameTime = time.time()

            # sliding buffer (no lag accumulation)
            with self.bufferLock:
                self.frameBuffer.append(frame.copy())

    # PROCESS LOOP (REAL-TIME)

    def processingLoop(self):
        while self.running:
            time.sleep(0.03)  # ~30 FPS processing

            with self.bufferLock:
                if len(self.frameBuffer) < 5:
                    continue
                frames = list(self.frameBuffer)

            result = self.processBatch(frames)

            with self.lock:
                self.latestValues = result

            # overlay always uses newest frame
            frame = frames[-1]
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            inputs = self.cropPinBoxes(frame, gray)

            self.debugOverlay(result, frame, inputs)

    # BATCH PROCESSING (SLIDING WINDOW)

    def processBatch(self, frames):
        pinSignals = defaultdict(list)

        for frame in frames:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            pinInputs = self.cropPinBoxes(frame, gray)

            for item in pinInputs:
                key = f"{item['lane']}_{item['pinIndex']}"
                signal = self.binary.centerNormalized(item["crop"])
                pinSignals[key].append(signal)

        finalPins = {}
        debug = {}

        for key, values in pinSignals.items():

            # MORE STABLE THAN MEAN (fixes flicker + false ON)
            avg = float(np.median(values))

            if avg > self.binary.onThreshold:
                state = 1
            elif avg < self.binary.offThreshold:
                state = 0
            else:
                lane, pin = key.split("_")
                state = self.binary.prevPins.get((int(lane), int(pin)), 0)

            finalPins[key] = state

            debug[key] = {
                "avg": avg,
                "state": state,
                "samples": values[-5:]
            }

        return {
            "state": {
                "pins": finalPins
            },
            "debug": debug
        }

    # CROPPING
    def cropPinBoxes(self, frame, gray):
        crops = []

        for box in self.boxes.model_dump().get("pins", []):
            if box.get("pinIndex") is None:
                continue

            x = int(box["x"] * self.frameWidth)
            y = int(box["y"] * self.frameHeight)
            w = int(box["w"] * self.frameWidth)
            h = int(box["h"] * self.frameHeight)

            x = max(0, x)
            y = max(0, y)

            crop = gray[y:y+h, x:x+w]
            if crop.size == 0:
                continue

            crops.append({
                "lane": box["lane"],
                "pinIndex": box["pinIndex"],
                "box": (x, y, w, h),
                "crop": crop
            })

        return crops

    # OVERLAY
    def debugOverlay(self, result, frame, pinInputs=None):
        overlay = frame.copy()

        pins = result.get("state", {}).get("pins", {})
        debug = result.get("debug", {})

        # TEXT
        y = 30
        for key, state in pins.items():
            info = debug.get(key, {})
            avg = info.get("avg", 0)

            color = (0, 255, 0) if state == 1 else (0, 0, 255)

            text = f"{key} | {state} | {avg:.2f}"

            cv2.putText(
                overlay,
                text,
                (10, y),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                color,
                1
            )
            y += 20

        # BOXES 
        if pinInputs:
            for item in pinInputs:
                lane = item["lane"]
                pin = item["pinIndex"]
                x, y0, w, h = item["box"]

                key = f"{lane}_{pin}"
                state = pins.get(key, 0)

                color = (0, 255, 0) if state == 1 else (0, 0, 255)

                cv2.rectangle(overlay, (x, y0), (x+w, y0+h), color, 2)

        cv2.imshow("PIN DEBUG OVERLAY", overlay)
        cv2.waitKey(1)