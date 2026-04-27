import { StatementResultingChanges } from "node:sqlite";
import { ThrowSeries } from "./throwSeries";

export interface Throw{
    id: number;
    throwSeries: ThrowSeries;
    throwNumber: number;
    fallenPins: number;
    fallenPinsMap: number;    
}

export class ThrowsRepository{
    async addThrow(throwSeries: ThrowSeries, throwNumber: number, fallenPins: number, fallenPinsMap: number): Promise<Throw>{
        const result = await window.electron.ipcRenderer.invoke<StatementResultingChanges>
        ("dbRun", "INSERT INTO throws(throwSeries, throwNumber, fallenPins, fallenPinsMap)", throwSeries, throwNumber, fallenPins, fallenPinsMap);

        return {
            id: result.lastInsertRowid as number,
            throwSeries: throwSeries,
            throwNumber: throwNumber,
            fallenPins: fallenPins,
            fallenPinsMap: fallenPinsMap
        };
    }

    async deleteThrow(id: number): Promise<boolean>{
        const result = await window.electron.ipcRenderer.invoke<StatementResultingChanges>
        ("dbRun", "DELETE FROM throws WHERE id=?", id);
        return result.changes > 0;
    }
}