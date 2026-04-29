import { BoxType } from "./Canvas";

export const laneColors: Record<number, string> = {
    1: "#ff3b3b",
    2: "#3b82f6",
};

export const typeColors: Record<BoxType, string> = {
    "Nevybráno": "transparent",
    "Suma celkem": "#ff3b3b",
    "Čas": "#3b82f6",
    "Počet hodů": "#22c55e",
    "Spadené": "#f59e0b",
    "Suma dráhy": "#a855f7",
};