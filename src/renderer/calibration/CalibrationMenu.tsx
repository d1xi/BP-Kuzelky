import BoxSelect from "./BoxSelect";
import styles from "./CalibrationMenu.module.css"
import { ToolMode } from "./CalibrationPage";
import { BoxType } from "./Canvas";
import PinMap from "./PinMap";

export type Props = {
    children: string;
    laneNumber: number;
    onSelect: (laneNumber: number, type: BoxType) => void;
    selected: BoxType;
    activeLane: number | null;
    selectedPin: number | null;
    onSelectPin: (lane: number, pinId: number) => void;
    setToolMode: (mode: ToolMode) => void;
};

export default function CalibrationMenu(props: Props){

    return(
        <div className={styles.container}>
            <div className={styles.boxes}>
                <BoxSelect activeLane={props.activeLane} laneNumber={props.laneNumber} 
                onSelect={(lane, type) => { props.onSelect(lane, type); props.setToolMode("box")}} 
                selected={props.selected}></BoxSelect>
            </div>
            <div className={styles.pinMap}>
                <h2>Mapa kuželek</h2>
                <PinMap laneNumber={props.laneNumber} selectedPin={props.selectedPin}
                onSelectPin={(lane, pin) => { props.onSelectPin(lane, pin); props.setToolMode("pin")}}></PinMap>
            </div>
        </div>
    );
}