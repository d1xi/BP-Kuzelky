import { StatementResultingChanges } from "node:sqlite";
import { MatchPlayer } from "./matchPlayers";

export interface ThrowSeries{ //Série hodů
    id: number;
    matchplayer: MatchPlayer;
    line: number;
}

export class ThrowSeriesRepository{
    async addThowSeries(matchPlayer: MatchPlayer, line: number): Promise<ThrowSeries>{
        const result = await window.electron.ipcRenderer.invoke<StatementResultingChanges>
        ("dbRun", "INSERT INTO throwSeries(matchPlayer, line) Values(?,?)", matchPlayer.id, line);
        return {
            id: result.lastInsertRowid as number,
            matchplayer: matchPlayer,
            line: line
        };
    }

    async deleteThrowSeries(matchPlayer: MatchPlayer, line: number): Promise<boolean>{
        const result = await window.electron.ipcRenderer.invoke<StatementResultingChanges>
        ("dbRun", "DELETE FROM throwSeries WHERE matchPlayer=? AND line=?", matchPlayer.id, line);
        return result.changes > 0;
    }

    async addSubstitute(){
        //TODO
    }
}