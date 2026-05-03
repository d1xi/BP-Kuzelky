import { useEffect, useMemo, useState } from "react";
import styles from "./StartInformation.module.css"
import { Team } from "../database/teams";
import { Member } from "../database/members";
import Presearch from "../components/Presearch";
import del from "../utils/delete-black.svg";

export type Props = {
    children: string;
    teamId: number | null;
    onTeamChange?: (id: number) => void;
    playerIds: number[] | null;
    onPlayersChange: (id: number) => void;
}

export default function StartInformation(props: Props){
    const [teams, setTeams] = useState<Team[]>([]);
    const [players, setPlayers] = useState<Member[]>([]);

    const [searchInTeam, setSearchInTeam] = useState("");
    const [searchAllTeams, setSearchAllTeams] = useState<Member[]>([]);
    const [query, setQuery] = useState("");

    useEffect(() => {
        const loadTeams = async () => {
            try{
                const result = await window.electron.ipcRenderer.invoke<Team[]>(
                    "dbAll",
                    "SELECT id, name, leagueId FROM teams"
                );

                setTeams(result);
            }
            catch(error){
                //TODO ERR
            }
        };
        loadTeams();
    }, []);

    useEffect(() => {
        if(!props.teamId) return;

        const loadPlayers = async () => {
            const result = await window.electron.ipcRenderer.invoke<Member[]>(
                "dbAll",
                `SELECT id, name, registrationNumber, teamId
                FROM members
                WHERE teamId = ?`,
                props.teamId
            );

            setPlayers(result);
        };

        loadPlayers();
    }, [props.teamId]);

    useEffect(() => {
        const loadAllMembers = async () => {
            const result = await window.electron.ipcRenderer.invoke<Member[]>(
                "dbAll",
                "SELECT id, name, registrationNumber, teamId FROM members"
            );

            setSearchAllTeams(result);
        };

        loadAllMembers();
    }, []);
    
    const handleDelete = (id: number) => {
        props.onPlayersChange(id);
    };

    const getTeamName = (teamId: number | null) => {
        return teams.find(t => t.id === teamId)?.name ?? "-";
    };

    const teamPlayers = players;

    const availableTeamPlayers = teamPlayers.filter(
    p => !(props.playerIds ?? []).includes(p.id)
    );

    const availableAllPlayers = searchAllTeams.filter(
    p => !(props.playerIds ?? []).includes(p.id)
    );

    const filteredPlayers = useMemo(() => {
    if (!query) return availableTeamPlayers;

    const teamMatches = availableTeamPlayers.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase())
    );

    if (teamMatches.length > 0) return teamMatches;

    return availableAllPlayers.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase())
    );
    }, [query, availableTeamPlayers, availableAllPlayers]);

    return(
        <div className={styles.container}>
            <div className={styles.header}>
                <h4>{props.children}</h4>
                <select className={styles.input} value={props.teamId ?? ""} 
                    disabled={!props.onTeamChange}
                    onChange={(event) => props.onTeamChange?.(Number(event.target.value))}>
                    <option value="" disabled hidden> Vyber Tým ...</option>
                    {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                            {team.name}
                        </option>
                    ))}
                </select>                
            </div>
            <div className={styles.tableContainer}>
                <h4>Hráči</h4>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <td>Jméno</td>
                            <td>Reg. číslo</td>
                            <td>Tým</td>
                        </tr>
                    </thead>
                    <tbody>
                        {(props.playerIds ?? []).map(id => {
                            const player = searchAllTeams.find(p => p.id === id);
                            if(!player) return null;
                            
                            return(
                                <tr key={id}>
                                    <td>{player.name}</td>
                                    <td>{player.registrationNumber}</td>
                                    <td>{getTeamName(player.teamId)}</td>
                                    <td className={styles.center} onClick={() => handleDelete(id)}><img src={del} alt="Delete Player"/></td>
                                </tr>
                            );
                        })}

                        <tr>
                            <td colSpan={4}>
                                {props.teamId ? (
                                    <Presearch items={filteredPlayers} value={null} onChange={(player) => {props.onPlayersChange(player.id); setQuery("")}}
                                        getLabel={(player) => player.name} placeholder="Přidat hráče ..."
                                        onQueryChange={setQuery}
                                    ></Presearch>
                                ) : (
                                    <div className={styles.hint}>
                                        Nejprve vyberte tým
                                    </div>
                                )}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}