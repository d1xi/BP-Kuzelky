import { StatementResultingChanges } from "node:sqlite";
import { Match } from "./matches"
import { Team } from "./teams"

export interface MatchTeam{//Tým v daném zápase
    id: number;
    matchId: number;
    teamId: number;
}

export class MatchTeamsRepository{
    async getAll(): Promise<MatchTeam[]>{
        return await window.electron.ipcRenderer.invoke<MatchTeam[]>("dbAll", "SELECT * FROM matchTeams");
    }

    async addTeam(matchId: number, teamId: number): Promise<MatchTeam>{
        const result = await window.electron.ipcRenderer.invoke<StatementResultingChanges>
        ("dbRun", "INSERT INTO matchTeams(matchId, teamId) Values(?,?)", matchId, teamId);
        return {
            id: result.lastInsertRowid as number,
            matchId: matchId,
            teamId: teamId
        };
    }

    async deleteTeam(id: number): Promise<boolean>{
        const result = await window.electron.ipcRenderer.invoke<StatementResultingChanges>
        ("dbRun", "DELETE FROM matchTeams WHERE id=?", id);
        return result.changes > 0;
    }
    
    async getByMatchId(matchId: number): Promise<MatchTeam[]>{
        return await window.electron.ipcRenderer.invoke<MatchTeam[]>(
            "dbAll",
            "SELECT * FROM matchTeams where matchId = ?",
            matchId
        );
    }
}