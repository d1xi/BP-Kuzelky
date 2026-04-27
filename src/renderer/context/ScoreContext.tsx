import { createContext, useContext, useState } from "react";
import { Row } from "../utils/score";

type ScoreContextType = {
    data: Row[];
    setData: React.Dispatch<React.SetStateAction<Row[]>>;
};

const ScoreContext = createContext<ScoreContextType | null>(null);

export function ScoreProvider({
    children,
    initialData,
}: {
    children: React.ReactNode;
    initialData: Row[];
}) {
    const [data, setData] = useState<Row[]>(initialData);

    return (
        <ScoreContext.Provider value={{ data, setData }}>
            {children}
        </ScoreContext.Provider>
    );
}

export function useScore() {
    const ctx = useContext(ScoreContext);
    if (!ctx) throw new Error("useScore must be used inside ScoreProvider");
    return ctx;
}