import { Database } from "../database/database";
import styles from "./CameraConnect.module.css"
import { CalibrationnStatus } from "./CalibrationPage";

export type Props = {
    database: Database,
    userName: string,
    password: string,
    ip: string,
    port: string,
    rtspURL: string,
    status: CalibrationnStatus,
    onUserNameChange: (newUserName: string) => void,
    onPasswordChange: (newPassword: string) => void,
    onIpChange: (newIp: string) => void,
    onStatusChange: (newStatus: CalibrationnStatus) => void,
    onRtspURLChange: (newRtspURL: string) => void,
    onPortChange: (newPort: string) => void,
}

export default function CameraConnect(props: Props){

    return(
        <div className={styles.container}>
            <div className={styles.header}>
                <h4>Připojit ke kameře: </h4>
                <h6>Status: {props.status}</h6>
            </div>
            <div className={styles.rtspMenu}>
                <h5>Zadejte IP adresu kamery:</h5>
                <input className={styles.input} placeholder="IP kamery: <192.168.1.100>" value={props.ip ?? ""} onChange={(event) => props.onIpChange(event.target.value)}></input>
                <h5>Zadejte port kamery</h5>
                <input className={styles.input} placeholder="IP kamery: <554>" value={props.port ?? ""} onChange={(event) => props.onPortChange(event.target.value)}></input>
                <h5>Zadejte přihlašovací jméno ke kameře</h5>
                <input className={styles.input} placeholder="Uživatelké jméno: <admin>" value={props.userName ?? ""} onChange={(event) => props.onUserNameChange(event.target.value)}></input>
                <h5>Zadejte heslo ke kameře</h5>
                <input className={styles.input} type="password" placeholder="Heslo uživatele: <*****>" value={props.password ?? ""} onChange={(event) => props.onPasswordChange(event.target.value)}></input>
                <h5>Zadejte celou rtsp url</h5>
                <input className={styles.input} placeholder="rtsp://username:password@IPaddress:554/media/video1" value={props.rtspURL ?? ""} onChange={(event) => props.onRtspURLChange(event.target.value)}></input>
            </div>
        </div>
    );
}