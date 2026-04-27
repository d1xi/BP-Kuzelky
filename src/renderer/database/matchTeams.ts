import { StatementResultingChanges } from "node:sqlite";
import { Match } from "./matches"
import { Team } from "./teams"

export interface MatchTeam{//Tým v daném zápase
    id: number;
    match: Match;
    team: Team;
}

export class MatchTeamsRepository{
    async getAll(): Promise<MatchTeam[]>{
        return await window.electron.ipcRenderer.invoke<MatchTeam[]>("dbAll", "SELECT * FROM matchTeams");
    }

    async addTeam(match: Match, team: Team): Promise<MatchTeam>{
        const result = await window.electron.ipcRenderer.invoke<StatementResultingChanges>
        ("dbRun", "INSERT INTO matchTeams(match, team), Values(?,?)", match.id, team.id);
        return {
            id: result.lastInsertRowid as number,
            match: match,
            team: team
        };
    }

    async deleteTeam(id: number): Promise<boolean>{
        const result = await window.electron.ipcRenderer.invoke<StatementResultingChanges>
        ("dbRun", "DELETE FROM matchTeams WHERE id=?", id);
        return result.changes > 0;
    }   
}