import Button from "../components/Button";
import FallenPinsMap from "./FallenPinsMap";
import styles from "./Lane.module.css"

export interface LaneProps{
    children: string;
    name: string;
}


export default function Lane(props: LaneProps){

    return(
        <div className={styles.container}>
            <div className={styles.playerName}>
                {props.name}
            </div>

            <div className={styles.laneNumber}>
                {props.children}
            </div>

            <div className={styles.laneContainer}>
                <div className={styles.fallenMapContainer}>
                    <div className={styles.fallenNumber}>
                        Spadené:
                        <p>X</p>
                    </div>
                    <div className={styles.fallenMap}>
                        <FallenPinsMap></FallenPinsMap>
                    </div>
                </div>

                <div className={styles.detectedNumbersContainer}>
                    <div className={styles.item}> Suma celkem: </div>
                    <div className={styles.item}> Čas: </div>
                    <div className={styles.item}> Hod:  </div>
                    <div className={styles.item}> Celkem dráha: </div>
                </div>
            </div>

            <div className={styles.throwHistory}>
                <Button> Historie hodů </Button>
            </div>
        </div>
    );
}