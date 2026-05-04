import time

class State:
    def __init__(self):
        self.lanes = {}

    def update(self, ocr, binary):
        results = []

        for lane in self.getAllLanes(ocr, binary):
            laneState = self.lanes.setdefault(lane, self.createLaneState())

            self.handleStartLight(lane, binary, laneState)
            self.handlePins(lane, binary, laneState)
            result = self.handleEvaluation(lane, ocr, binary, laneState)

            if result:
                results.append(result)
            
        return results
    
    def createLaneState(self):
        return{
            "phase": "WAITING",
            "throwActive": False,
            "pinsStart": None,
            "pinsEnd": None,
            "lastChangeTime": None,
            "ocrSnapshot": None
        }
    
    def handleStartLight(self, lane, binary, state):
        start = binary["state"]["startLight"].get(lane, 0)

        if state["phase"] == "WAITING" and start == 1:
            state["phase"] = "READY"
        
        elif state["phase"] == "READY" and start == 0:
            state["phase"] = "ARMED"

    def handlePins(self, lane, binary, state):
        pins = self.getPinsForLane(binary, lane)

        if state["phase"] == "ARMED":
            if state["pinsStart"] is None:
                state["pinsStart"] = pins
                return

            if pins != state["pinsStart"]:
                state["phase"] = "THROW"
                state["throwActive"] = True
                state["lastChangeTime"] = time.time()
                state["pinsEnd"] = pins
            return

    def handleEvaluation(self, lane, ocr, binary, state):
        if state["phase"] != "THROW":
            return None
        if state["lastChangeTime"] is None:
            return None
        if time.time() - state["lastChangeTime"] < 1.0:
            return None
        
        state["phase"] = "RESULT"

        pinsStart = state["pinsStart"]
        pinsEnd = state["pinsEnd"]

        fallen = self.countFallen(pinsStart, pinsEnd)

        ocrValue = self.getOcrValue(ocr, lane, "fallenPins")

        result = {
            "lane": lane,
            "binary": fallen,
            "ocr": int(ocrValue) if ocrValue.isdigit() else None,
            "match": str(fallen) == ocrValue
        }

        state["phase"] = "WAITING"
        state["throwActive"] = False
        state["pinsStart"] = None
        state["pinsEnd"] = None
        state["lastChangeTime"] = None

        return result
    
    def getPinsForLane(self, binary, lane):
        result = {}

        for key, val in binary["state"]["pins"].items():
            l, pin = key.split("_")
            l = int(l)
            pin = int(pin)

            if l == lane:
                result[pin] = val

            return result
    
    def countFallen(self, start, end):
        count = 0
        for pin in start:
            if start[pin] == 1 and end.get(pin, 1) == 0:
                count += 1
        return count
    
    def getOcrValue(self, ocr, lane, boxType):
        for item in ocr.get(boxType, []):
            if item["lane"] == lane:
                return item["value"]
        return ""
    
    def getAllLanes(self, ocr, binary):
        lanes = set()

        for items in ocr.values():
            for item in items:
                lanes.add(item["lane"])

        for lane in binary.get("state", {}).get("startLight", {}).keys():
            lanes.add(lane)

        for key in binary.get("state", {}).get("pins", {}).keys():
            lane = int(key.split("_")[0])
            lanes.add(lane)

        return lanes