import { StatementResultingChanges } from "node:sqlite";

export interface Team{//Soupiska
    id: number;
    name: string;
    leagueId: number;
    leaderId: number | null;
}

export class TeamsRepository{
    async getAll(): Promise<Team[]> {
        return await window.electron.ipcRenderer.invoke<Team[]>("dbAll", "SELECT * FROM teams");
    }

    async addTeam(name: string, leagueId: number, leaderId: number | null): Promise<Team> {
        const result = await window.electron.ipcRenderer.invoke<StatementResultingChanges>("dbRun", "INSERT INTO teams(name, leagueId, leaderId) VALUES(?, ?, ?)", name, leagueId, leaderId);
       
        return {
            id: result.lastInsertRowid as number,
            name: name,
            leagueId: leagueId,
            leaderId: leaderId
        };
    }

    async deleteTeam(id: number): Promise<boolean> {
        const result = await window.electron.ipcRenderer.invoke<StatementResultingChanges>
        ("dbRun", "DELETE FROM teams WHERE id=?", id);
        return result.changes > 0;
    }

    async setTeamName(id: number, name: string): Promise<boolean>{
        const result = await window.electron.ipcRenderer.invoke<StatementResultingChanges>("dbRun", "UPDATE teams SET name=? WHERE id=?", name, id);
        return result.changes > 0;
    }

    async changeTeamsLeague(id: number, leagueId: number): Promise<boolean>{
        const result = await window.electron.ipcRenderer.invoke<StatementResultingChanges>
        ("dbRun", "UPDATE teams SET leagueId=? WHERE id=?", leagueId, id);
        return result.changes > 0;
    }

    async changeTeamsLeader(id: number, leaderId: number): Promise<boolean>{
        const result = await window.electron.ipcRenderer.invoke<StatementResultingChanges>
        ("dbRun", "UPDATE teams SET leaderId=? WHERE id=? AND EXISTS (SELECT 1 FROM members WHERE members.id =? AND members.teamId = teams.id)", leaderId, id, leaderId);
        return result.changes > 0;
    }
}