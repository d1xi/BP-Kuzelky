import BoxSelect from "./BoxSelect";
import styles from "./CalibrationMenu.module.css"
import PinMap from "./PinMap";

export type Props = {
    children: string;
};

export default function CalibrationMenu(props: Props){

    return(
        <div className={styles.container}>
            <div className={styles.boxes}>
                <BoxSelect></BoxSelect>
            </div>
            <div className={styles.pinMap}>
                <h2>Mapa kuželek</h2>
                <PinMap></PinMap>
            </div>
        </div>
    );
}