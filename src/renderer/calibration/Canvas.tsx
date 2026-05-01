import React, { useEffect, useRef, useState } from "react";
import { Box } from "./CalibrationPage";
import styles from "./Canvas.module.css"
import { laneColors, typeColors } from "./theme";

const DRAG_TRESHOLD = 5;

export type BoxType = "Nevybráno" | "Suma celkem" | "Čas" | "Počet hodů" | "Spadené" | "Suma dráhy";
export type Mode = "Žádný" | "Náhled" | "Kreslení" | "Přemístění" | "Rozměry";

const boxColors: Record<BoxType, string> = {
    "Nevybráno": "transparent",
    "Suma celkem": "red",
    "Čas": "blue",
    "Počet hodů": "green",
    "Spadené": "orange",
    "Suma dráhy": "purple",
};

export type Props = {
    //laneNumber: number | null,
    //selectedBoxType: BoxType,
    selection: Record<number, BoxType>,
    setSelection: React.Dispatch<React.SetStateAction<Record<number, BoxType>>>,
    boxes: Box[],
    setBoxes: React.Dispatch<React.SetStateAction<Box[]>>,
    activeLane: number | null,
    onModeChange: (mode: Mode) => void
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

    const size = useRef({w: 1, h: 1});
    const isReady = () => size.current.w > 0 && size.current.h > 0;

    useEffect(() => {
        if(!containerRef.current){
            return;
        }

        const observer = new ResizeObserver((entries) => {
            const rectangle = entries[0].contentRect;
            size.current = {w: rectangle.width, h: rectangle.height};
        });

        observer.observe(containerRef.current);
        return () => observer.disconnect();

    }, []);

    const toNormalizedCoordinates = (x: number, y: number) => ({
        x: isReady() ? x / size.current.w : 0,
        y: isReady() ? y / size.current.h : 0
    });

    const toCanvasCoordinates = (box: Box) => ({
        x: box.x * size.current.w,
        y: box.y * size.current.h,
        w: box.w * size.current.w,
        h: box.h * size.current.h
    });

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
        setStart(toNormalizedCoordinates(position.x, position.y));
        setDrawing(true);
    };

    const onMouseMove = (event: React.MouseEvent) => {;
        const mouse = getNormalizedFromEvent(event)
        if(!resizing){
            return;
        }

        props.setBoxes(prev => {
            const updated = [...prev];
            const box = { ...updated[resizing.index] };

            const x1 = box.x;
            const y1 = box.y;
            const x2 = box.x + box.w;
            const y2 = box.y + box.h;

            let nx = x1;
            let ny = y1;
            let nw = box.w;
            let nh = box.h;

            switch (resizing.corner) {
                case "tl":
                    nx = mouse.x;
                    ny = mouse.y;
                    nw = x2 - mouse.x;
                    nh = y2 - mouse.y;
                    break;

                case "tr":
                    ny = mouse.y;
                    nw = mouse.x - x1;
                    nh = y2 - mouse.y;
                    break;

                case "bl":
                    nx = mouse.x;
                    nw = x2 - mouse.x;
                    nh = mouse.y - y1;
                    break;

                case "br":
                    nw = mouse.x - x1;
                    nh = mouse.y - y1;
                    break;
            }

            // normalize negative safety
            if (nw < 0) {
                nx += nw;
                nw = Math.abs(nw);
            }
            if (nh < 0) {
                ny += nh;
                nh = Math.abs(nh);
            }

            updated[resizing.index] = {
                ...box,
                x: nx,
                y: ny,
                w: nw,
                h: nh,
            };

            return updated;
        });
        
        if(movingIndex !== null && dragOffset){
            const normalized = getNormalizedFromEvent(event);

            props.setBoxes((prev) => {
                const updated = [... prev];

                updated[movingIndex] = {
                    ...updated[movingIndex],
                    x: normalized.x - dragOffset.x,
                    y: normalized.y - dragOffset.y,
                };

                return updated;
            });

            return;
        }

        if(drawing && start){
            const lane = props.activeLane;
            const normalized = getNormalizedFromEvent(event);

            if (!lane) return;

            const type = props.selection[lane] ?? "Nevybráno";

            setCurrent({
                lane,
                type,
                x: start.x,
                y: start.y,
                w: normalized.x - start.x,
                h: normalized.y - start.y
            });
        }

        if(resizing) return;
        if(movingIndex !== null && dragOffset) return;
        if(drawing && start) return;
    };

    const onMouseUp = () => {
       props.onModeChange("Žádný");
        setPointerDownOnBox(false);

        if(resizing){
            setResizing(null);
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

        const wPx = current.w * size.current.w;
        const hPx = current.h * size.current.h;
        if(wPx < 10 || hPx < 10){
            setDrawing(false);
            setStart(null);
            setCurrent(null);
            return;
        }


        const box: Box = {
            lane: current.lane,
            type: current.type,
            x: Math.min(start.x, start.x + current.w),
            y: Math.min(start.y, start.y + current.h),
            w: Math.abs(current.w),
            h: Math.abs(current.h)
       };

        props.setBoxes(prev => {
            const filtered = prev.filter(
                b => !(b.lane === box.lane && b.type === box.type)
            );
            
            return [...filtered, box];
        });

        setDrawing(false);
        setStart(null);
        setCurrent(null);
    };

    const handleBoxMouseDown = (
        event: React.MouseEvent,
        index: number,
        box: Box,
    ) => {
        event.stopPropagation();
        setPointerDownOnBox(true);
        setSelectedIndex(index);

        const rectangle = containerRef.current?.getBoundingClientRect();
        if(!rectangle){
            return;
        }

      setMovingIndex(index);
      props.onModeChange("Přemístění");
      
      const position = getRelativePosition(event);
      const normalized = toNormalizedCoordinates(position.x, position.y);
      
      setDragOffset({
        x: normalized.x - box.x,
        y: normalized.y - box.y
      });
    };

    const startResize = (event: React.MouseEvent, index: number, corner: "tl" | "tr" | "bl" | "br") => {
        event.stopPropagation();
        setPointerDownOnBox(true);
        setMovingIndex(null);
        setResizing({index, corner});
        props.onModeChange("Rozměry");
    }

    const getNormalizedFromEvent = (event: React.MouseEvent) => {
        const position = getRelativePosition(event);
        return toNormalizedCoordinates(position.x, position.y);
    };

    return(
        <div ref={containerRef} className={styles.container} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp}>
            {props.boxes.map((box, i) => {
                const b = toCanvasCoordinates(box);
                return (
                    <div key={i} className={styles.box} style={{left: b.x, top: b.y, width: b.w, height: b.h, borderColor: laneColors[box.lane] ?? typeColors[box.type]}}
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
                );
            })}

            {current && (() => {
                const c = toCanvasCoordinates(current);
                return(
                    <div className={styles.preview} style={{left: c.x, top: c.y, width: c.w, height: c.h}}>
                    </div>
                );
            })()}
        </div>
    );
}