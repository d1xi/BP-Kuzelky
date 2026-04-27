import { StatementResultingChanges } from "node:sqlite";

export interface Match{//Zápas
    id: number;
    date: number;
    league: string;
    totalThrows: number;
    playerCount: number;
}

export class MatchRepository{
    async getAll(): Promise<Match[]>{
        return await window.electron.ipcRenderer.invoke<Match[]>("dbAll", "SELECT * FROM matches");
    }

    async addMatch(date: number, league: string, totalThrows: number, playerCount: number): Promise<Match>{
        const result = await window.electron.ipcRenderer.invoke<StatementResultingChanges>("dbRun", "INSERT INTO matches(date, league, totalThrows, playerCount) VALUES(?,?,?,?)", date, league, totalThrows, playerCount);
        return {
            id: result.lastInsertRowid as number,
            date: date,
            league: league,
            totalThrows: totalThrows,
            playerCount: playerCount
        };
    }

    async deleteMatch(id: number): Promise<boolean>{
        const result = await window.electron.ipcRenderer.invoke<StatementResultingChanges>
        ("dbRun", "DELETE FROM matches WHERE id=?", id);
        return result.changes > 0;
    }

    async changeMatchDate(id: number, date: number): Promise<boolean>{
        const result = await window.electron.ipcRenderer.invoke<StatementResultingChanges>
        ("dbRun", "UPDATE matches SET date=? WHERE id=? ", date, id);
        return result.changes > 0;
    }

    async changeMatchleague(){
        
    }

    async changeMatchTotalThrows(){
        
    }

    async changeMatchPlayerCount(){
        
    }
}