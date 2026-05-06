import numpy as np
from collections import defaultdict, deque


class Binary:
    def __init__(self):

        self.prevPins = {}

        # rolling window per pin (15 frames)
        self.windowSize = 15
        self.history = defaultdict(lambda: deque(maxlen=self.windowSize))

        # thresholds
        self.onThreshold = 0.85
        self.offThreshold = 0.62

        # stability counters (THIS fixes flicker)
        self.onCounter = defaultdict(int)
        self.offCounter = defaultdict(int)

        # how many consecutive confirmations needed
        self.onConfirm = 5
        self.offConfirm = 5

    # FRAME PROCESS
    def processFrame(self, inputs):

        newState = {}
        events = []

        for item in inputs:
            key = (item["lane"], item["pinIndex"])

            signal = self.centerNormalized(item["crop"])

            #SMOOTHING (rolling window) 
            self.history[key].append(signal)
            values = self.history[key]

            # more robust than mean (reduces LED spikes)
            avg = float(np.median(values))

            prev = self.prevPins.get(key, 0)

            state = prev

            # ON LOGIC 
            if avg > self.onThreshold:
                self.onCounter[key] += 1
                self.offCounter[key] = 0

                if self.onCounter[key] >= self.onConfirm:
                    state = 1

            # OFF LOGIC
            elif avg < self.offThreshold:
                self.offCounter[key] += 1
                self.onCounter[key] = 0

                if self.offCounter[key] >= self.offConfirm:
                    state = 0

            # NEUTRAL ZONE
            else:
                self.onCounter[key] = 0
                self.offCounter[key] = 0
                state = prev

            newState[key] = state

            # EVENTS 
            if state != prev:
                events.append({
                    "pin": f"{key[0]}_{key[1]}",
                    "from": prev,
                    "to": state,
                    "avg": float(avg),
                    "signal": float(signal)
                })

        self.prevPins = newState

        return {
            "state": {f"{k[0]}_{k[1]}": v for k, v in newState.items()},
            "events": events
        }

    # SIGNAL EXTRACTION 

    def centerNormalized(self, crop):
        if crop is None:
            return 0.0

        h, w = crop.shape[:2]
        if h == 0 or w == 0:
            return 0.0

        ch, cw = h // 2, w // 2
        half = 4

        region = crop[
            max(0, ch - half): min(h, ch + half + 1),
            max(0, cw - half): min(w, cw + half + 1)
        ]

        if region.size == 0:
            return 0.0

        return float(np.mean(region)) / 255.0