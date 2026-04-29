import { Database } from "../database/database";
import styles from "./CameraConnect.module.css"
import { CalibrationnStatus } from "./CalibrationPage";

export type Props = {
    database: Database,
    userName: string,
    password: string,
    ip: string,
    status: CalibrationnStatus,
    onUserNameChange: (newUserName: string) => void,
    onPasswordChange: (newPassword: string) => void,
    onIpChange: (newIp: string) => void,
    onStatusChange: (newStatus: CalibrationnStatus) => void,
}

export default function CameraConnect(props: Props){

    return(
        <div className={styles.container}>
            <div className={styles.status}>
                <h3>Připojit ke kameře: </h3>
                Status: {props.status}
            </div>
            <div className={styles.rtspMenu}>
                <h4>Zadejte IP adresu kamery:</h4>
                <input className={styles.input} placeholder="IP kamery: <192.168.1.100>" value={props.ip} onChange={(event) => props.onIpChange(event.target.value)}></input>
                <h4>Zadejte přihlašovací jméno ke kameře</h4>
                <input className={styles.input} placeholder="Uživatelké jméno: <admin>" defaultValue={props.userName} onBlur={(event) => props.onUserNameChange(event.target.value)}></input>
                <h4>Zadejte heslo ke kameře</h4>
                <input className={styles.input} type="password" placeholder="Heslo uživatele: <*****>" defaultValue={props.password} onBlur={(event) => props.onPasswordChange(event.target.value)}></input>
            </div>
        </div>
    );
}