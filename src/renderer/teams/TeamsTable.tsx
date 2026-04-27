import { Database } from "../database/database";
import { MouseEvent, FocusEvent, useState, ChangeEvent } from "react";
import { Team } from "../database/teams";
import styles from "./TeamsTable.module.css";
import edit from "../utils/edit-black.svg";
import del from "../utils/delete-black.svg";
import members from "../utils/group-black.svg";
import { League } from "../database/leagues";
import Presearch from "../components/Presearch";
import { Member } from "../database/members";

export type Props = {
    teams: Team[],
    leagues: League[],
    members: Member[],
    database: Database,
    onTeamsChange: (newTeams: Team[]) => void, 
    selectedTeam: Team | null,
    onSelectedTeam: (team: Team | null) => void,
};

export default function TeamsTable(props: Props){    
    const [editMode, setEditMode] = useState<number | null>(null);

    function updateTeams(updated: Team[]){
        props.onTeamsChange(updated);
    };

    const rows = props.teams.map((team) => {
        const readOnly = editMode !== team.id;
        const teamMebmbers = props.members.filter(
            m => m.teamId === team.id
        );

        const OnNameChange = (event: FocusEvent<HTMLInputElement>) => {
            const newName = event.currentTarget.value;

            props.database.teams.setTeamName(team.id, newName).then(() => {
                updateTeams(
                    props.teams.map(t =>
                        t.id === team.id 
                        ? { ...t, name: newName } 
                        : t
                    )
                );
            });
        };

        function OnLeagueChange(event: ChangeEvent<HTMLSelectElement>){
            //const newLeague = props.leagues[event.currentTarget.selectedIndex];
            const newLeagueId = Number(event.currentTarget.value);
            if (newLeagueId === team.leagueId){
                return;
            }

            props.database.teams.changeTeamsLeague(team.id, newLeagueId).then(() => {
                updateTeams(
                    props.teams.map(t =>
                        t.id === team.id 
                        ? {...t, leagueId: newLeagueId} 
                        : t
                    )
                );
            });
        };

        function OnLeaderSelect(member: Member){
            props.database.teams.changeTeamsLeader(team.id, member.id).then(() =>  {
                updateTeams(
                    props.teams.map(t => 
                        t.id === team.id
                        ? {...t, leaderId: member.id}
                        :t
                    )
                );
            });
        }

        const handleSelectedTeamChange = () => {
            props.onSelectedTeam(team);
            setEditMode(null);
        };

        const handleEditModeChange = (event: MouseEvent) => {
            event.stopPropagation();

            if (editMode === team.id){
                setEditMode(null);
                return;
            }

            props.onSelectedTeam(team);
            setEditMode(team.id);
        };

        const handleDelete = (event: MouseEvent) => {
            event.stopPropagation();
            const result = confirm(`Opravdu chcete odstranit tým ${team.name}?`);
            
            if(result){
                props.database.teams.deleteTeam(team.id).then((retVal) => {
                    if(!retVal){
                        alert(`Nepodařilo se odstranit tým ${team.name}`);
                        return;
                    }

                    updateTeams(
                        props.teams.filter(t => t.id !== team.id)
                    );

                    props.onSelectedTeam(null);
                    setEditMode(null);
                });
            };
        };

        const leagueRows = props.leagues.map((league) => {
            return(
                <option key={league.id} value={league.id}>{league.name}</option>
            );
        });

        return(
            <tr key={team.id}
                    className={[team.id === props.selectedTeam?.id
                    ? styles.selectedRow
                    : ""       , readOnly ? styles.readonlyRow : ""].join(" ")            
                    } onClick={readOnly ? handleSelectedTeamChange :undefined}
            >
                <td><input className={styles.input} defaultValue={team.name} onBlur={ OnNameChange } readOnly={readOnly}/></td>
                <td className={styles.td}>
                    <select className={styles.input} defaultValue={team.leagueId} onChange={ OnLeagueChange } onMouseDown={(e) => {if(readOnly) e.preventDefault()}}>
                    {leagueRows}
                    </select>
                </td>
                <td onClick={readOnly ? handleSelectedTeamChange : undefined}>
                    {readOnly ? (<span>{props.members.find(m => m.id === team.leaderId)?.name ?? "" } </span>): (
                        <Presearch items={teamMebmbers} value={teamMebmbers.find(m => m.id === team.leaderId) ?? null} onChange={(m) => OnLeaderSelect(m)} getLabel={(m) => m.name}/>
                    )}                    
                    </td>
                <td className={styles.center}  onClick={handleSelectedTeamChange}><img src={members} alt="Show team members" /></td>
                <td className={styles.center} onClick={handleEditModeChange} ><img src={edit} alt="Edit row"/></td>
                <td className={styles.center} onClick={handleDelete}><img src={del} alt="Delete row"/></td>
            </tr>
        );
    });

    return(
        <table className={styles.table}>
            <thead>
                <tr>
                    <td>Název</td>
                    <td>Liga</td>
                    <td>Vedoucí družstva</td>
                    <td className={styles.center}>Členové</td>
                    <td className={styles.center}>Upravit</td>
                    <td className={styles.center}>Odstranit</td>
                </tr>
            </thead>
            <tbody>
                {rows}
            </tbody>
        </table>
    );
}