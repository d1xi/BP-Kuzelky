import { Team } from "./teams";
import { Member } from "./members";
import { StatementResultingChanges } from "node:sqlite";

export interface MatchPlayer{
    id: number;
    matchId: number;
    teamId: number | null;
    memberId: number | null;
    teamName: string;
    memberName: string;
}

export class MatchPlayersRepository{
    async getAll(): Promise<MatchPlayer[]>{
        return await window.electron.ipcRenderer.invoke<MatchPlayer[]>("dbAll", "SELECT * FROM matchPlayers");
    }

    async addMatchPlayer(matchId: number, memberId: number,): Promise<MatchPlayer>{
        const result = await window.electron.ipcRenderer.invoke<StatementResultingChanges>
            ("dbRun",
            `
            INSERT INTO matchPlayers (matchId, teamId, memberId, teamName, memberName)
            SELECT ?, t.id, m.id, t.name, m.name
            FROM members m
            JOIN teams t ON t.id = m.teamId
            WHERE m.id = ?
            `,
            matchId,
            memberId,
            );
        return {
            id: result.lastInsertRowid as number,
            matchId: matchId,
            teamId: 0,
            memberId: memberId,
            teamName: "",
            memberName: ""
        };
    }

    async deleteMatchPlayer(id: number): Promise<boolean>{
        const result = await window.electron.ipcRenderer.invoke<StatementResultingChanges>
        ("dbRun", "DELETE FROM matchPlayers WHERE id=?", id);
        return result.changes > 0;
    }

    async getByMatchId(matchId: number): Promise<any[]>{
        return await window.electron.ipcRenderer.invoke(
            "dbAll",
            "SELECT * FROM matchPlayers where matchId = ?",
            matchId
        );
    }
}