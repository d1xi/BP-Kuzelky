import numpy as np
import pytesseract
import cv2
import time
import math
import os

class OCR ():
    def __init__(self):
        self.capture = None

    def Start(self, config):
        #rtsp://admin:123456@192.168.1.13:554/media/video1 
        #link = f"rtsp://{config['userName']}:{config['password']}@{config['ip']}/media/video1"
        
        #link = "rtsp://localhost:8555/stream"
        link = "C:/Users/Lucie/Desktop/BP/NM_C.mp4"
        self.capture = cv2.VideoCapture(link, cv2.CAP_FFMPEG)
        self.capture.set(cv2.CAP_PROP_BUFFERSIZE, 1)

        if not self.capture.isOpened():
            print("Error: Could not open RTSP strem.\n")
            return (-1)

        print("Starting RTSP capturing:\n")


    def getFrame(self):
        ret, frame = self.capture.read()
        size = frame.shape
        print(size)
        return(frame)
    
    def getValues(self):
        frame = self.getFrame()
        frame = cv2.cvtColor(frame, cv2.COLOR_RGB2GRAY)

        boxes = [ # TODO: Load from database 
            ("SUM1", 35, 77, 10, 79),
            ("TIME1", 26, 70, 202, 284),
            ("THROWS1", 190, 231, 34, 83),
            ("FALLEN1", 188, 231, 113, 145),
            ("LANESUM1", 188, 233, 210, 287),

            ("SUM2", 10, 57, 456, 544),
            ("TIME2", 19, 63, 628, 691),
            ("THROWS2", 185, 228, 467, 531),
            ("FALLEN2", 180, 224, 560, 593),
            ("LANESUM2", 176, 216, 648, 694),
        ]

        language = "digitSevenSegmentNew" #digitSevenSegment #digitSevenSegment-psm13
        configuration = "--psm 13 -c tessedit_char_whitelist=0123456789 -c classify_bln_numeric_mode=1 -c load_system_dawg=0 -c load_system_dawg=0"
        min_confidence=40

        detected_numbers = {}

        for name, y1, y2, x1, x2 in boxes:
            crop = frame[y1:y2, x1:x2]

            oldHeight, oldWidth = crop.shape
            newHeight = 50
            newWidth = math.floor(oldWidth / oldHeight * newHeight)
            crop = cv2.resize(crop, (newWidth, newHeight))
            cv2.imwrite("test.jpg", crop)
            break

            # Raw Tesseract data with per-character confidence
            data = pytesseract.image_to_data(
                crop,
                lang=language,
                config=configuration,
                output_type=pytesseract.Output.DICT
            )

            chars = []
            confs = []
            for i in range(len(data['text'])):
                text = data['text'][i].strip()
                conf = int(data['conf'][i])
                if text != "":
                    chars.append(text)
                    confs.append(conf)

            # Filter digits by confidence
            filtered_chars = [c for c, cf in zip(chars, confs) if cf >= min_confidence]
            number = ''.join(filtered_chars)

            avg_conf_filtered = np.mean([cf for cf in confs if cf >= min_confidence]) if filtered_chars else 0
            detected_numbers[name] = (number, avg_conf_filtered)

        return detected_numbers
        



def Detect():
    snapshotInterval = 20 #in seconds
    lastSnapshot = 0
    min_confidence=40
     
    #for creating dataset
    #out_dir = "data"
    #os.makedirs(out_dir, exist_ok=True)

    #Input data set --------------------
    counter = 511
    boxes = [
        ("SUM1", 35, 78, 30, 100),
        ("TIME1", 22, 66, 192, 278),
        ("THROWS1", 184, 224, 25, 78),
        ("FALLEN1", 184, 226, 103, 138),
        ("LANESUM1", 184, 226, 197, 276),

        ("SUM2", 13, 58, 446, 530),
        ("TIME2", 17, 60, 613, 682),
        ("THROWS2", 180, 225, 453, 518),
        ("FALLEN2", 180, 222, 552, 582),
        ("LANESUM2", 173, 218, 634, 694),
    ]

    '''
    boxes = [ #NM C 
        ("SUM1", 40, 82, 40, 109),
        ("TIME1", 26, 70, 202, 284),
        ("THROWS1", 190, 231, 34, 83),
        ("FALLEN1", 188, 231, 113, 145),
        ("LANESUM1", 188, 233, 210, 287),

        ("SUM2", 10, 57, 456, 544),
        ("TIME2", 19, 63, 628, 691),
        ("THROWS2", 185, 228, 467, 531),
        ("FALLEN2", 180, 224, 560, 593),
        ("LANESUM2", 176, 216, 648, 694),
    ] 
    '''

    # Maximum expected digits per box
    max_digits_per_box = {
        "SUM1": 3,
        "TIME1": 3,
        "THROWS1": 3,
        "FALLEN1": 1,
        "LANESUM1": 3,
        "SUM2": 3,
        "TIME2": 3,
        "THROWS2": 3,
        "FALLEN2": 1,
        "LANESUM2": 3
    }

    #Open VideoStream
    video = "C:/Users/Lucie/Desktop/BP/NM C - Kamenice D - Kuželky TJ Nové Město na Moravě (1080p, h264).mp4"
    #video = "C:/Users/Lucie/Desktop/BP/14.1.2026 NMNMC.mkv"
    

    capture = cv2.VideoCapture(video, cv2.CAP_FFMPEG)
    capture.set(cv2.CAP_PROP_BUFFERSIZE, 1)

    if not capture.isOpened():
        print("Error: Could not open RTSP strem.\n")
        exit(-1)

    print("Starting RTSP capturing:\n")

    def test(event, x, y, flags, param):
        print(x, y)

    #Tesseract config:
    language = "digitSevenSegmentNew" #digitSevenSegment #digitSevenSegment-psm13
    configuration = "--psm 13 -c tessedit_char_whitelist=0123456789 -c classify_bln_numeric_mode=1 -c load_system_dawg=0 -c load_system_dawg=0"   
    iteration = 0

    while True:
        ret, frame = capture.read()
        
        if not ret:
            for i in range(3):
                print("Connection lost, trying to connect ...\n")
                capture.release()
                time.sleep(2)
                capture = cv2.VideoCapture(video, cv2.CAP_FFMPEG)
            break

        currentTime = time.time()

        if (currentTime - lastSnapshot) >= snapshotInterval:
            lastSnapshot = currentTime  
            iteration +=1
        #Preprocessing------------------------------------------------------------------------
            frame = cv2.cvtColor(frame, cv2.COLOR_RGB2GRAY)
            #ret, frame = cv2.threshold(frame, threshold, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
            #frame = cv2.fastNlMeansDenoising(frame) 
            detected_numbers = {}

        #Bounding boxes---------------------------------------------------------------
            for name, y1, y2, x1, x2 in boxes:
                crop = frame[y1:y2, x1:x2]

                # Raw Tesseract data with per-character confidence
                data = pytesseract.image_to_data(
                    crop,
                    lang=language,
                    config=configuration,
                    output_type=pytesseract.Output.DICT
                )

                chars = []
                confs = []
                for i in range(len(data['text'])):
                    text = data['text'][i].strip()
                    conf = int(data['conf'][i])
                    if text != "":
                        chars.append(text)
                        confs.append(conf)

                # Filter digits by confidence
                filtered_chars = [c for c, cf in zip(chars, confs) if cf >= min_confidence]
                number = ''.join(filtered_chars)

                # Enforce max digits per box
                max_digits = max_digits_per_box.get(name, None)
                if max_digits:
                    number = number[:max_digits]

                avg_conf_filtered = np.mean([cf for cf in confs if cf >= min_confidence]) if filtered_chars else 0
                detected_numbers[name] = (number, avg_conf_filtered)
           

        #Detect numbers-------------------------------------------------------------------    
            

        #Print numbers---------------------------------------------------------------------
            for name, (num, conf) in detected_numbers.items():
                print(f"{name}: {num}  (avg conf: {conf:.1f}%)")
            print(f"Iteration: {iteration}\n")

        #Show bounding boxes------------------------------------------------------    
            test = frame
            scoreboard = test[0:450, 0:750]
            im = cv2.resize(scoreboard, (960, 540))
            cv2.imshow("RTSP Stream", im)

            #cv2.imshow("SUM1", sum1_frame)
            #cv2.imshow("TIME1", time1_frame)
            #cv2.imshow("THROWS1", throws1_frame)
            #cv2.imshow("FALLEN1", fallen1_frame)
            #cv2.imshow("LANESUM1", laneSum1_frame)

            #cv2.imshow("SUM2", sum2_frame)
            #cv2.imshow("TIME2", time2_frame)
            #cv2.imshow("THROWS2", throws2_frame)
            #cv2.imshow("FALLEN2", fallen2_frame)
            #cv2.imshow("LANESUM2", laneSum2_frame)

            #cv2.setMouseCallback("RTSP Stream", test)
            '''
            for name, y1, y2, x1, x2 in boxes:
                crop = frame[y1:y2, x1:x2]
                filename = os.path.join(out_dir, f"{counter}.png")
                cv2.imwrite(filename, crop)
                counter +=1
            '''
            key = cv2.waitKey(1)
            
            if key == ord("q"):
                break

            if key == ord("u"):
                threshold += 5
                print(threshold)
                
            if key == ord("j"):
                threshold -= 5
                print(threshold)

    capture.release()
    cv2.destroyAllWindows()