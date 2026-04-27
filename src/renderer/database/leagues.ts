import { StatementResultingChanges } from "node:sqlite";

export interface League{
    id: number;
    name: string;
}

export class LeaguesRepository{
    async getAll(): Promise<League[]>{
        return await window.electron.ipcRenderer.invoke<League[]>
        ("dbAll", "SELECT * FROM leagues");
    }

    async addLeague(name: string): Promise<League>{
        const result = await window.electron.ipcRenderer.invoke<StatementResultingChanges>
        ("dbRun", "INSERT INTO leagues(name) Values(?)", name);
        return{
            id: result.lastInsertRowid as number,
            name: name
        }
    }

    async deleteLeague(id: number): Promise<boolean>{
        const result = await window.electron.ipcRenderer.invoke<StatementResultingChanges>
        ("dbRun", "DELETE FROM leagues WHERE id=?", id);
        return result.changes > 0;
    }

    async setName(id: number, name: string): Promise<boolean>{
        const result = await window.electron.ipcRenderer.invoke<StatementResultingChanges>
        ("dbRun", "UPDATE leagues SET name=? WHERE id=?", name, id);
        return result.changes > 0;
    }
}