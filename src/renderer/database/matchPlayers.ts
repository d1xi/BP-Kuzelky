import { Team } from "./teams";
import { Member } from "./members";
import { StatementResultingChanges } from "node:sqlite";

export interface MatchPlayer{
    id: number;
    teamId: number | null;
    memberId: number | null;
    teamName: string;
    memberName: string;
}

export class MatchPlayersRepository{
    async getAll(): Promise<MatchPlayer[]>{
        return await window.electron.ipcRenderer.invoke<MatchPlayer[]>("dbAll", "SELECT * FROM matchPlayers");
    }

    async addMatchPlayer(teamId: number, memberId: number, teamName: string, memberName: string): Promise<MatchPlayer>{
        const result = await window.electron.ipcRenderer.invoke<StatementResultingChanges>
            ("dbRun",
            `
            INSERT INTO matchPlayers (teamId, memberId, teamName, memberName)
            SELECT t.id, m.id, t.name, m.name
            FROM teams t, members m
            WHERE t.id = ? AND m.id = ?
            `,
            teamId,
            memberId
            );
        return {
            id: result.lastInsertRowid as number,
            teamId: teamId,
            memberId: memberId,
            teamName: teamName,
            memberName: memberName
        };
    }

    async deleteMatchPlayer(id: number): Promise<boolean>{
        const result = await window.electron.ipcRenderer.invoke<StatementResultingChanges>
        ("dbRun", "DELETE FROM matchPlayers WHERE id=?", id);
        return result.changes > 0;
    }
}