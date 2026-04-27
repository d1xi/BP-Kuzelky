import styles from "./FallenPinsMap.module.css"
import { useState } from "react";

type Pin = {
  id: number;
  col: number;
  row: number;
  fallen: boolean;
};

export default function FallenPinsMap() {
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

  function setFallen(ids: number[]){
    setPins((prev) =>
    prev.map((p) =>
      ids.includes(p.id)
        ? { ...p, fallen: true }
        : p
    )
  );
}

  return (
    <div className={styles.container}>
       {pins.map((pin) => (
        <div
            key={pin.id}
            className={`${styles.pin} ${pin.fallen ? styles.fallen : ""}`}
            style={{
                gridColumn: pin.col,
                gridRow: pin.row,
            }}
            onClick={() => setFallen([pin.id])} //TODO
            >
            {pin.id}
        </div>
        ))}
    </div>
  );
}

