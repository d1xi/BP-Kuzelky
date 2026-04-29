import Button from "../components/Button";
import styles from "./BoxSelect.module.css"
import { BoxType } from "./Canvas";
import { laneColors } from "./theme";

const boxTypes: BoxType[] = [
    "sum",
    "time",
    "throws",
    "fallenPins",
    "laneSum",  
];

export type Props = {
    laneNumber: number;
    onSelect: (lane: number, type: BoxType) => void;
    selected: BoxType;
    activeLane: number | null;
}

export default function BoxSelect(props: Props){
    const laneColor =laneColors[props.laneNumber] ?? "#888";

    return(
        <div className={styles.container}>
            {boxTypes.map((type) => {
                const isActive = props.activeLane === props.laneNumber && props.selected === type;

                return(
                    <Button key={type} onClick={() => props.onSelect(props.laneNumber, type)}
                        style={{border: `2px solid ${laneColor}`, background: isActive ? laneColor: "transparent", 
                            color: isActive ? "#000" : "#fff",}}
                            >
                        {type}
                    </Button>
                );
            })}
        </div>
    );
}