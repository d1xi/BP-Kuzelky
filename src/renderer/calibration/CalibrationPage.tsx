import { useEffect, useState } from "react";
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
    x: number;
    y: number;
    w: number;
    h: number;
}

export type Props = {

}

export default function CalibrationPage(props: Props){
    const database = useDatabase();

    const [ip, setIP] = useState<string>("");
    const [userName, setUserName] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [status, setStatus] = useState<CalibrationnStatus>("Nečinný");

    ///const [selectedBoxType, setSelectedBoxType] = useState<BoxType>("Nevybráno");
    const [selection, setSelection] = useState<Record<number, BoxType>>({});
    const [activeLane, setActiveLane] = useState<number | null>(null);
    const [boxes, setBoxes] = useState<Box[]>([]);
    const [mode, setMode] = useState<Mode>("Žádný");
    
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

                setIP(data.ip || "");
                setUserName(data.userName || "");

                if(data.ip){
                    setTimeout(connect, 0);
                }
            }
            
            catch(error){
                return
            }
        }

        load();
    }, []);

    useEffect(() => {
        const body: Record<string, any> = {};

        for (const box of boxes) {
            body[box.type] = {
                lane: box.lane,
                x: Math.floor(box.x),
                y: Math.floor(box.y),
                w: Math.floor(box.w),
                h: Math.floor(box.h)
            };
        }

        body['pins'] = [];

        if (mode === "Žádný") {
            fetch("http://localhost:8000/boxes", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(body)
            });
        }
    }, [mode]);

    const connect = async () => {
        setStatus("Připojování");

        try{
            const result = await fetch("http://localhost:8000/connect", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ host: ip, username: userName, password})
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

    //const frame = await fetch("http://localhost:8000/frame").then((data) => {})

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
                <Canvas onModeChange={setMode} selection={selection} setSelection={setSelection} boxes={boxes} setBoxes={setBoxes} activeLane={activeLane}></Canvas>
            </div>
            <div className={styles.menu}>
                <div className={styles.calibration}>
                    <CalibrationMenu activeLane={activeLane} laneNumber={1} onSelect={(lane, type) => {setActiveLane(lane), setSelection(prev => ({...prev, [lane]: type}))}} selected={selection[1] ?? "Nevybráno"}>Dráha 1</CalibrationMenu>
                    <CalibrationMenu activeLane={activeLane} laneNumber={2} onSelect={(lane, type) => {setActiveLane(lane), setSelection(prev => ({...prev, [lane]: type}))}} selected={selection[2] ?? "Nevybráno"}>Dráha 2</CalibrationMenu>
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
                        onStatusChange={setStatus}></CameraConnect>
                        <Button onClick={connect} disabled={status === "Připojování"}>Připojit</Button>
                </div>                                   
            </div>
        </div>
    );
}