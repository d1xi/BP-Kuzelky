import { useEffect, useState } from "react";
import CalibrationMenu from "./CalibrationMenu";
import styles from "./CalibrationPage.module.css"
import Button from "../components/Button";

export type Props = {

}

export default function CalibrationPage(props: Props){
    const [ip, setIP] = useState("");
    const [username, setUserName] = useState("");
    const [password, setPassword] = useState("");

    const [status, setStatus] = useState<"Nečinný" | "Připojování" | "Připojeno">("Nečinný");

    useEffect(() => {
        const load = async () =>{
            const result = await fetch("http://localhost:8000/config");
            const data = await result.json();

            setIP(data.ip || "");
            setUserName(data.username || "");
        }

        load();
    }, []);

    const connect = async () => {
        setStatus("Připojování");

        const result = await fetch("http://localhost:8000/connect", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ ip, username, password})
        });
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
                
            </div>
            <div className={styles.menu}>
                <div className={styles.calibration}>
                    <CalibrationMenu>Dráha 1</CalibrationMenu>
                    <CalibrationMenu>Dráha 2</CalibrationMenu>
                </div>                
                <div className={styles.streamConnectContainer}>
                    <h2>RTSP připojení ke kameře</h2>
                    <div className={styles.status}>
                        Status: {status}
                    </div>
                    <div className={styles.rtspMenu}>
                        <h4>Zadejte IP adresu kamery:</h4>
                        <input placeholder="IP kamery: <192.168.1.100>" defaultValue={ip} onBlur={(event) => setIP(event.target.value)}></input>
                        <h4>Zadejte přihlašovací jméno ke kameře</h4>
                        <input placeholder="Uživatelké jméno: <admin>" defaultValue={username} onBlur={(event) => setUserName(event.target.value)}></input>
                        <h4>Zadejte heslo ke kameře</h4>
                        <input type="password" placeholder="Heslo uživatele: <*****>" defaultValue={password} onBlur={(event) => setPassword(event.target.value)}></input>
                    </div>
                    <Button onClick={connect}>Připojit</Button>                    
                </div>
            </div>
        </div>
    );
}