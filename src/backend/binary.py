import numpy as np

class Binary():
    def __init__(self):
        self.prevStart = {}
        self.prevPins = {}

        self.currentPins = {}
        self.currentStart = {}

        self.onThreshold = 0.6
        self.offThreshold = 0.4

        self.centerSize = 5

    def process(self, inputs):
        events = {
            "startEvents": [],
            "pinEvents" : []
        }

        self.processStartLight(inputs.get("startLight", []), events)
        self.processPins(inputs.get("pins", []), events)

        return{
            "events": events,
            "state": {
                "startLight": self.currentStart,
                "pins": self.currentPins
            }
        }
    
    def processStartLight(self, items, events):
        for item in items:
            lane = item["lane"]
            signal = self.centerNormalized(item["crop"])

            prev = self.prevStart.get(lane, 0)
            
            if prev == 0 and signal > self.onThreshold:
                value = 1
                events["startEvents"].append({
                    "type": "READY",
                    "lane": lane
                })

            elif prev == 1 and signal < self.offThreshold:
                value = 0
            else:
                value = prev

            self.prevStart[lane] = value
            self.currentStart[lane] = value
    
    def processPins(self, items, events):
        current = {}

        for item in items:
            lane = item["lane"]
            pin = item["pinIndex"]
            key = (lane, pin)

            prev = self.prevPins.get(key, 0)
            signal = self.centerNormalized(item["crop"])

            if prev == 0 and signal > self.onThreshold:
                value = 1
                events["pinEvents"].append({
                    "type": "PIN_FALL",
                    "lane": lane,
                    "pinIndex": pin
                })

            elif prev == 1 and signal < self.offThreshold:
                value = 0
            else:
                value = prev
            current[f"{lane}_{pin}"] = value
        
        self.prevPins = current
        self.currentPins = current
    
    def centerMeanOfPixels(self, crop):
        if crop is None:
            return 0.0

        h, w = crop.shape[:2]
        if h == 0 or w == 0:
            return 0.0

        ch, cw = h // 2, w // 2
        half = self.centerSize // 2

        region = crop[
            max(0, ch - half): min(h, ch + half + 1),
            max(0, cw - half): min(w, cw + half + 1)
        ]

        if region.size == 0:
            return 0.0
        if np.mean(region) < 20:
            return 0.0

        return float(np.median(region))
    
    def centerNormalized(self, crop):
        return self.centerMeanOfPixels(crop) / 255.0