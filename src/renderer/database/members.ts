import { StatementResultingChanges } from "node:sqlite";
import { Team } from "./teams";

export interface Member{//Člen
    id: number;
    name: string;
    registrationNumber: number;
    teamId: number;
}

export class MembersRepository{
    async getAll(): Promise<Member[]>{
        return await window.electron.ipcRenderer.invoke<Member[]>("dbAll", "SELECT * FROM members");
    }

    async addMember(name: string, registrationNumber: number, teamId: number ): Promise<Member>{
        const result = await window.electron.ipcRenderer.invoke<StatementResultingChanges>
        ("dbRun", "INSERT INTO members(name, registrationNumber, teamId) Values(?,?,?)", name, registrationNumber, teamId);
        return {
            id: result.lastInsertRowid as number,
            name: name,
            registrationNumber: registrationNumber,
            teamId: teamId
        }
    }

    async deleteMember(id: number): Promise<boolean>{
        const result = await window.electron.ipcRenderer.invoke<StatementResultingChanges>
        ("dbRun", "DELETE FROM members WHERE id=?", id);
        return result.changes > 0;
    }

    async changeMemberTeam(id: number, teamId: number): Promise<boolean>{
        const result = await window.electron.ipcRenderer.invoke<StatementResultingChanges>
        ("dbRun", "UPDATE members SET teamId=? WHERE id=? ", teamId, id);
        return result.changes > 0;
    }

    async setName(id: number, name: string): Promise<boolean>{
        const result = await window.electron.ipcRenderer.invoke<StatementResultingChanges>
        ("dbRun", "UPDATE members SET name=? WHERE id=?", name, id);
        return result.changes > 0;
    }

    async setRegistrationNumber(id: number, registrationNumber: number): Promise<boolean>{
        const result = await window.electron.ipcRenderer.invoke<StatementResultingChanges>
        ("dbRun", "UPDATE members SET registrationNumber=? WHERE id=?", registrationNumber, id);
        return result.changes > 0;
    }
}