import { useEffect, useRef, useState } from "react";
import CalibrationMenu from "./CalibrationMenu";
import styles from "./CalibrationPage.module.css"
import Button from "../components/Button";
import CameraConnect from "./CameraConnect";
import { useDatabase } from "../database/database";
import Canvas, { BoxType, Mode } from "./Canvas";

export type CalibrationnStatus = "Nečinný" | "Připojování" | "Připojeno";

export type Box = {
    lane: number;
    type: BoxType;
    pinIndex: number | null;
    x: number;
    y: number;
    w: number;
    h: number;
};

const BoxMap: Record<BoxType, string> ={
    "Nevybráno": "",
    "Suma celkem": "sum",
    "Čas": "time",
    "Počet hodů": "throws",
    "Spadené": "fallenPins",
    "Suma dráhy": "laneSum",
    "Kuželky": "pins"
};

const ReverseBoxMap: Record<string, BoxType> = {
    sum: "Suma celkem",
    time: "Čas",
    throws: "Počet hodů",
    fallenPins: "Spadené",
    laneSum: "Suma dráhy",
    pins: "Kuželky"
};

export type ToolMode = "box" | "pin" | null;

export type SelectedPin = {
    lane: number;
    pinIndex: number;
}

export default function CalibrationPage(){
    const database = useDatabase();

    const [ip, setIP] = useState<string>("");
    const [port, setPort] = useState<string>("");
    const [userName, setUserName] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [status, setStatus] = useState<CalibrationnStatus>("Nečinný");
    const [detectedValues, setDetectedValues] = useState<any>(null);

    ///const [selectedBoxType, setSelectedBoxType] = useState<BoxType>("Nevybráno");
    const [selection, setSelection] = useState<Record<number, BoxType>>({});
    const [activeLane, setActiveLane] = useState<number | null>(null);
    const [boxes, setBoxes] = useState<Box[]>([]);
    const [mode, setMode] = useState<Mode>("Žádný");

    const [toolMode, setToolMode] = useState<ToolMode>(null);
    const [selectedPin, setSelectedPin] = useState<Record<number, number | null>>({});
    const [rtspURL, setRtspURL] = useState<string>("");
    
    const [interaction, setInteraction] = useState<{
        lane: number | null;
        type: BoxType | null;
        active: boolean;
    }>({
        lane: null,
        type: null,
        active: false
    });

    useEffect(() => {
        const up = () => {
            setInteraction({
                lane: null,
                type: null,
                active: false
            });
        };

        window.addEventListener("mouseup", up);
        return () => window.removeEventListener("mouseup", up);
    }, []);

    useEffect(() => {
        const load = async () =>{
            try{
                const result = await fetch("http://localhost:8000/config");
                const data = await result.json();

                setIP(data.ip ?? "");
                setPort(data.port ?? "");
                setUserName(data.userName ?? "");
                setRtspURL(data.rtspURL ?? "");

                setTimeout(() => {
                    connect();
                }, 0);
            }
            
            catch(error){
                return
            }
        }

        load();
    }, []);

    useEffect(() => {
        const pollingInterval = setInterval(async () => {
            try{
                const result = await fetch("http://localhost:8000/values");
                if(!result.ok){
                    return;
                }

                const data = await result.json();
                setDetectedValues(data);
            }  

            catch(error){   
                return; //TODO err
            }
        }, 5000);

        return () => clearInterval(pollingInterval);
    }, []);

    useEffect(() => {
        const loadBoxes = async () => {
            try{
                const result = await fetch("http://localhost:8000/boxes");

                if(!result.ok){
                    return;
                }

                const data = await result.json();
                const restoredBoxes: Box[] = [];

                for(const [type, list] of Object.entries(data)){
                    const mappedType = ReverseBoxMap[type];
                    if(!mappedType) continue;
                    for(const box of list as any[]){
                        restoredBoxes.push({
                            lane: box.lane,
                            type: mappedType,
                            pinIndex: box.pinIndex ?? null,
                            x: box.x,
                            y: box.y,
                            w: box.w,
                            h: box.h
                        });
                    }
                }

                setBoxes(restoredBoxes);
            }
            catch(error){
                return; //TODO err
            }
            
        };
        loadBoxes();
    }, []);

    useEffect(() => {
        console.log("Detected Values:", detectedValues);
    }, [detectedValues])

    useEffect(() => {
        const body: Record<string, any> = {
            sum: [],
            laneSum: [],
            throws: [],
            fallenPins: [],
            time: [],
            pins:[]
        };        

        for(const box of boxes){
            const key = BoxMap[box.type]
            if(!key) continue;
            body[key].push({
                lane: box.lane,
                pinIndex: box.pinIndex,
                x: box.x,
                y: box.y,
                w: box.w,
                h: box.h
            });
        }

        const timeout = setTimeout(async() => {
            try{
                const result = await fetch("http://localhost:8000/boxes", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(body)
                    });
            }
            catch(error){
                //TODO err
            }  
        
    }, 300);

    return () => clearTimeout(timeout);
    }, [boxes])


    const connect = async () => {
        setStatus("Připojování");
        const payLoad = {ip, port, userName, password, rtspURL}
        try{
            const result = await fetch("http://localhost:8000/connect", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(payLoad)
            });

            if(result.ok) {
                setStatus("Připojeno");
            }
            else{
                setStatus("Nečinný")
            }
        }

        catch (error) {
            setStatus("Nečinný");
            alert("Nepodařilo se připojit ke kameře")
        }
    };

    return(
        <div className={styles.container}>
            <div className={styles.videoContainer}>
                {status === "Připojeno" ? (
                    <img className={styles.img} src="http://localhost:8000/frame"></img>
                ) : (
                    <div className={styles.placeholder}>
                        {status === "Připojování" ? "Připojuji ke kameře ..." : "Nepřipojeno"}
                    </div>
                )}
                <Canvas onModeChange={setMode} selection={selection} 
                setSelection={setSelection} boxes={boxes} setBoxes={setBoxes} 
                activeLane={activeLane}
                selectedPin={selectedPin}
                toolMode={toolMode}></Canvas>
            </div>
            <div className={styles.menu}>
                <div className={styles.calibration}>
                    <CalibrationMenu activeLane={activeLane} laneNumber={1} 
                    onSelect={(lane, type) => {setActiveLane(lane);
                        setSelection(prev => ({...prev, [lane]: type})); 
                        if(type !== "Kuželky"){setSelectedPin({[lane]: null})}
                        }} 
                    setToolMode={setToolMode}
                    selected={selection[1] ?? "Nevybráno"}
                    selectedPin={selectedPin[1] ?? null} 
                    onSelectPin={(lane, pin) => {
                        setActiveLane(lane)
                        setSelectedPin({[lane]: pin});
                        setSelection({})}}>Dráha 1</CalibrationMenu>
                    <CalibrationMenu activeLane={activeLane} laneNumber={2}
                    onSelect={(lane, type) => {setActiveLane(lane);
                        setSelection(prev => ({...prev, [lane]: type})); 
                        if(type !== "Kuželky"){setSelectedPin({[lane]: null})}
                        }} 
                    setToolMode={setToolMode}
                    selected={selection[2] ?? "Nevybráno"}
                    selectedPin={selectedPin[2] ?? null} 
                    onSelectPin={(lane, pin) => {
                        setActiveLane(lane)
                        setSelectedPin({[lane]: pin});
                        setSelection({})}}>Dráha 2</CalibrationMenu>
                </div>                
                <div className={styles.streamConnectContainer}>
                    <CameraConnect database={database}
                        userName={userName}
                        onUserNameChange={setUserName}
                        password={password}
                        onPasswordChange={setPassword}
                        ip={ip}
                        onIpChange={setIP}
                        status={status}
                        onStatusChange={setStatus}
                        rtspURL={rtspURL}
                        onRtspURLChange={setRtspURL}
                        port={port}
                        onPortChange={setPort}></CameraConnect>
                        <Button onClick={() => connect()} disabled={status === "Připojování"}>Připojit</Button>
                </div>                                   
            </div>
        </div>
    );
}