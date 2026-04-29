import BoxSelect from "./BoxSelect";
import styles from "./CalibrationMenu.module.css"
import { BoxType } from "./Canvas";
import PinMap from "./PinMap";

export type Props = {
    children: string;
    laneNumber: number;
    onSelect: (laneNumber: number, type: BoxType) => void;
    selected: BoxType;
    activeLane: number | null;
};

export default function CalibrationMenu(props: Props){

    return(
        <div className={styles.container}>
            <div className={styles.boxes}>
                <BoxSelect activeLane={props.activeLane} laneNumber={props.laneNumber} onSelect={props.onSelect} selected={props.selected}></BoxSelect>
            </div>
            <div className={styles.pinMap}>
                <h2>Mapa kuželek</h2>
                <PinMap></PinMap>
            </div>
        </div>
    );
}