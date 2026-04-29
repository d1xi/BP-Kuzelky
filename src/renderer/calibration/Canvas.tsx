import React, { SetStateAction, useRef, useState } from "react";
import { Box } from "./CalibrationPage";
import styles from "./Canvas.module.css"
import { laneColors, typeColors } from "./theme";

const DRAG_TRESHOLD = 5; 

export type BoxType = "Nevybráno" | "sum" | "time" | "throws" | "fallenPins" | "laneSum";
export type Mode = "Žádný" | "Kreslení" | "Přemístění" | "Rozměry";

const boxColors: Record<BoxType, string> = {
    "Nevybráno": "transparent",
    "sum": "red",
    "time": "blue",
    "throws": "green",
    "fallenPins": "orange",
    "laneSum": "purple",
};

export type Props = {
    onModeChange: (mode: Mode) => void,
    selection: Record<number, BoxType>,
    setSelection: (selection: Record<number, BoxType>) => void,
    boxes: Box[],
    setBoxes: (action: SetStateAction<Box[]>) => void,
    activeLane: number | null,
}

export default function Canvas(props: Props){
    const containerRef = useRef<HTMLDivElement>(null);

    const [drawing, setDrawing] = useState(false);
    const [start, setStart] = useState<{x: number; y: number} | null>(null);
    const [current, setCurrent] = useState<Box | null>(null);

    const [resizing, setResizing] = useState<{index: number, corner: "tl" | "tr" | "bl" | "br"} | null>(null);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [movingIndex, setMovingIndex] = useState<number | null>(null);   
    const [dragOffset, setDragOffset] = useState<{x: number, y: number} | null>(null);
    const [pointerDownOnBox, setPointerDownOnBox] = useState(false);

    const getRelativePosition = (event: React.MouseEvent) => {
        const rectangle = containerRef.current?.getBoundingClientRect();
        
        if(!rectangle){
            return{
                x: 0,
                y: 0
            };
        }
        
        return{
            x: event.clientX - rectangle.left,
            y: event.clientY - rectangle.top
        };
    };

    const normalizeBox = (box: Box): Box => {
        return{
            ...box,
            x: Math.min(box.x, box.x + box.w),
            y: Math.min(box.y, box.y + box.h),
            w: Math.abs(box.w),
            h: Math.abs(box.h)
        };
    };

    const onMouseDown = (event: React.MouseEvent) => {
        if(pointerDownOnBox){
            setPointerDownOnBox(false);
            return;
        }

        if(event.target === containerRef.current){
            setSelectedIndex(null);
        }
        
        const lane = props.activeLane;
        if (!lane) return;

        const type = props.selection[lane] ?? "Nevybráno";
        if(type === "Nevybráno") return;

        const position = getRelativePosition(event);
        setStart(position);
        setDrawing(false);
    };

    const onMouseMove = (event: React.MouseEvent) => {
        const position = getRelativePosition(event);

        if(resizing){
            props.setBoxes(prev => {
                const updated = [...prev];
                let box = {...updated[resizing.index]};

                switch(resizing.corner){
                    case "tl":
                        box.w += box.x - position.x;
                        box.h += box.y - position.y;
                        box.x = position.x;
                        box.y = position.y;
                        break;
                    
                    case "tr":
                        box.w = position.x - box.x;
                        box.h += box.y - position.y;
                        box.y = position.y;
                        break;

                    case "bl":
                        box.w += box.x - position.x;
                        box.x = position.x;
                        box.h = position.y - box.y;
                        break;
                    
                    case "br":
                        box.w = position.x - box.x;
                        box.h = position.y - box.y;
                        break;
                }

                updated[resizing.index] = normalizeBox(box);
                return updated;
            });
            return;
        }

        if(movingIndex !== null && dragOffset){
            props.setBoxes((prev) => {
                const updated = [... prev];

                updated[movingIndex] = {
                    ...updated[movingIndex],
                    x: position.x - dragOffset.x,
                    y: position.y - dragOffset.y,
                };

                return updated;
            });

            return;
        }

        if(start && !drawing){
            const dx = Math.abs(position.x - start.x);
            const dy = Math.abs(position.y - start.y);

            if(dx > DRAG_TRESHOLD || dy > DRAG_TRESHOLD){
                setDrawing(true);
                props.onModeChange("Kreslení");
            }
        }

        if(drawing && start){
            const lane = props.activeLane;
            if (!lane) return;

            const type = props.selection[lane] ?? "Nevybráno";

            setCurrent({
                lane,
                type,
                x: start.x,
                y: start.y,
                w: position.x - start.x,
                h: position.y - start.y
            });
        }
    };

    const onMouseUp = () => {
       props.onModeChange("Žádný");
       setPointerDownOnBox(false);
       
       if(resizing){
        setResizing(null);
        return;
       }

       if(movingIndex !== null){
           setMovingIndex(null);
           setDragOffset(null);
           return;
       }

        if(!drawing || !start || !current){
            setStart(null);
            return;
        }

        const normalized = normalizeBox(current);
        if(normalized.w < 10 || normalized.h < 10){
            setDrawing(false);
            setStart(null);
            setCurrent(null);
            return;
        }

        props.setBoxes(prev => {
            const filtered = prev.filter(b => !(b.lane === normalized.lane && b.type === normalized.type));

            return [...filtered, normalized];
        });

        setDrawing(false);
        setStart(null);
        setCurrent(null);
    };

    const handleBoxMouseDown = (event: React.MouseEvent, index: number, box: Box,) => {
        event.stopPropagation();
        
        setSelectedIndex(index);
        setPointerDownOnBox(true);

        const rectangle = containerRef.current?.getBoundingClientRect();
        if(!rectangle){
            return;
        }

        setMovingIndex(index);
        props.onModeChange("Přemístění");

        setDragOffset({
            x: event.clientX - rectangle.left - box.x,
            y: event.clientY - rectangle.top - box.y
        })
    };

    const startResize = (event: React.MouseEvent, index: number, corner: "tl" | "tr" | "bl" | "br") => {
        event.stopPropagation();
        setPointerDownOnBox(true);
        setMovingIndex(null);
        setResizing({index, corner});
        props.onModeChange("Rozměry");
    }

    return(
        <div ref={containerRef} className={styles.container} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp}>
            {props.boxes.map((box, i) => (
                <div key={i} className={styles.box} style={{left: box.x, top: box.y, width: box.w, height: box.h, borderColor: laneColors[box.lane] ?? typeColors[box.type]}}
                    onMouseDown={(event) => handleBoxMouseDown(event, i, box)}>
                    {box.type}
                    {selectedIndex === i && (
                        <>
                            <div className={styles.handleTL} onMouseDown={(event) => startResize(event, i, "tl")}></div>
                            <div className={styles.handleTR} onMouseDown={(event) => startResize(event, i, "tr")}></div>
                            <div className={styles.handleBL} onMouseDown={(event) => startResize(event, i, "bl")}></div>
                            <div className={styles.handleBR} onMouseDown={(event) => startResize(event, i, "br")}></div>                
                        </>
                    )}
                    </div>
            ))}

            {current && (
                <div className={styles.preview} style={{left: current.x, top: current.y, width: current.w, height: current.h}}>
                </div>
            )}
        </div>
    );
}