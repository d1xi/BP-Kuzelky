import { StatementResultingChanges } from "node:sqlite";

export interface Match{//Zápas
    id: number;
    date: number;
    leagueId: number;
    totalThrows: number;
    playerCount: number;
}

export class MatchRepository{
    async getAll(): Promise<Match[]>{
        return await window.electron.ipcRenderer.invoke<Match[]>("dbAll", "SELECT * FROM matches");
    }

    async addMatch(date: number, leagueId: number, totalThrows: number, playerCount: number): Promise<Match>{
        const result = await window.electron.ipcRenderer.invoke<StatementResultingChanges>("dbRun", "INSERT INTO matches(date, leagueId, totalThrows, playerCount) VALUES(?,?,?,?)", date, leagueId, totalThrows, playerCount);
        return {
            id: result.lastInsertRowid as number,
            date: date,
            leagueId: leagueId,
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

    async getById(id: number): Promise<Match | null>{
        const result = await window.electron.ipcRenderer.invoke<Match>(
            "dbGet",
            "SELECT * FROM matches where id = ?",
            id
        );
        return result ?? null;
    }

    async changeMatchleague(){
        
    }

    async changeMatchTotalThrows(){
        
    }

    async changeMatchPlayerCount(){
        
    }
}