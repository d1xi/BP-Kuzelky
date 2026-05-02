import { useState } from "react";
import styles from "./PinMap.module.css"
import { BoxType } from "./Canvas";

export type Props = {
  laneNumber: number;
  selectedPin: number | null;
  onSelectPin: (lane: number, pinId: number) => void;
}

type Pin = {
  id: number;
  col: number;
  row: number;
  fallen: boolean;
};

export default function PinMap(props: Props){
    const [pins, setPins] = useState<Pin[]>([
  { id: 9, col: 3, row: 1, fallen: false },
  { id: 7, col: 2, row: 2, fallen: false },
  { id: 8, col: 4, row: 2, fallen: false },
  { id: 4, col: 1, row: 3, fallen: false },
  { id: 5, col: 3, row: 3, fallen: false },
  { id: 6, col: 5, row: 3, fallen: false },
  { id: 2, col: 2, row: 4, fallen: false },
  { id: 3, col: 4, row: 4, fallen: false },
  { id: 1, col: 3, row: 5, fallen: false },
  ]);

  return (
    <div className={styles.container}>
       {pins.map((pin) => {
        const isSelected = props.selectedPin === pin.id;
        return(
          <div
            key={pin.id}
            className={`${styles.pin} ${isSelected ? styles.active : ""}`}
            style={{
                gridColumn: pin.col,
                gridRow: pin.row,
            }}
            onClick={() => props.onSelectPin(props.laneNumber, pin.id)}
            >
            {pin.id}
        </div>
        )
      }        
        )}
    </div>
  );
}