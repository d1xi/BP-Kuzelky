import { Database } from "../database/database";
import { Member } from "../database/members";
import { MouseEvent, ChangeEvent, FocusEvent, useState} from "react";
import styles from "./MembersTable.module.css";
import edit from "../utils/edit-black.svg";
import del from "../utils/delete-black.svg";
import { Team } from "../database/teams";

export type Props = {
    teams: Team[];
    members: Member[];
    database: Database;
    onMembersChage: (newMembers: Member[]) => void;
    selectedMember: Member | null;
    selectedTeam: Team | null;
    onSelectedMember: (member: Member | null) => void;
    onTeamsChange: (newTeams: Team[]) => void;
};

export default function MembersTable(props: Props) {
    const [editMode, setEditMode] = useState<number | null>(null);

    const visibleMembers = props.selectedTeam
        ? props.members.filter(m => m.teamId === props.selectedTeam?.id)
        : props.members;

    function updateMembers(updated: Member[]) {
        props.onMembersChage(updated);
    };

    const rows = visibleMembers.map((member) => {
        const readOnly = editMode !== member.id;

        function OnNameChange(event: FocusEvent<HTMLInputElement>) {
            const newName = event.currentTarget.value;

            props.database.members.setName(member.id, newName).then(() => {
                updateMembers(
                    props.members.map(m =>
                        m.id === member.id ? { ...m, name: newName } : m
                    )
                );
            });
        }

        function OnRegistrationNumberChange(event: FocusEvent<HTMLInputElement>) {
            const val = Number(event.currentTarget.value);

            if(isNaN(val)){
                alert("Neplatné číslo!");
                return;
            }

            props.database.members.setRegistrationNumber(member.id, val).then(() => {
                updateMembers(
                    props.members.map(m =>
                        m.id === member.id
                            ? { ...m, registrationNumber: val }
                            : m
                    )
                );
            });
        }

        function OnTeamChange(event: ChangeEvent<HTMLSelectElement>) {
            const newTeamId = Number(event.currentTarget.value);
            const oldTeamId = member.teamId;

            if (newTeamId === oldTeamId){
                return;
            } 

            props.database.members.changeMemberTeam(member.id, newTeamId).then(() => {
                const updatedMembers = props.members.map(m =>
                    m.id === member.id
                        ? { ...m, teamId: newTeamId }
                        : m
                );

                updateMembers(updatedMembers);

                props.onTeamsChange(
                    props.teams.map(t => {
                        if (t.id === oldTeamId && t.leaderId === member.id) {
                            return { ...t, leaderId: null };
                        }
                        return t;
                    })
                );
                });

                props.onTeamsChange(
                    props.teams.map(t => {
                        if(t.id === oldTeamId && t.leaderId === member.id){
                            return {...t, leaderId: null};
                        }
                        return t;
                    })
                );
            ;
        }

        function handleDelete(event: MouseEvent) {
            event.stopPropagation();
            const result = confirm(`Opravdu chcete odstranit člena ${member.name}?`);

            if (result){
                props.database.members.deleteMember(member.id).then((retVal) => {
                    if (!retVal) {
                        alert("Nepodařilo se odstranit člena");
                        return;
                    }

                    updateMembers(
                        props.members.filter(m => m.id !== member.id)
                    );

                    props.onSelectedMember(null);
                    setEditMode(null);
                });
            };     
        };

        function handleEditModeChange(event: MouseEvent) {
            event.stopPropagation();
            setEditMode(prev =>
                prev === member.id ? null : member.id
            );

            props.onSelectedMember(member);
        }

        const teamsRows = props.teams.map(((team) => {
            return(
                <option key={team.id} value={team.id}>{team.name}</option>
            );
        }))

        const handleSelecterdMemberChange = () => {
            props.onSelectedMember(member);
            setEditMode(null);
        }

        return (
            <tr key={member.id}
                className={[member.id === props.selectedMember?.id
                        ? styles.selectedRow
                        : "",
                    readOnly ? styles.readonlyRow : ""].join(" ")
                } onClick={readOnly ? handleSelecterdMemberChange :undefined}
            >
                <td><input className={styles.input} readOnly={readOnly} onBlur={OnNameChange} defaultValue={member.name}/></td>
                <td><input className={styles.input} defaultValue={member.registrationNumber} readOnly={readOnly} onBlur={OnRegistrationNumberChange} /></td>
                <td className={styles.td}>
                    <select className={styles.input} defaultValue={member.teamId} disabled={readOnly} onChange={OnTeamChange}>
                        {teamsRows}
                    </select>
                </td>
                <td  className={styles.center} onClick={handleEditModeChange}><img src={edit} alt="Edit row" /></td>
                <td className={styles.center} onClick={handleDelete}><img src={del} alt="Delete row" /></td>
            </tr>
        );
    });

    return (
        <table className={styles.table}>
            <thead>
                <tr>
                    <td>Jméno</td>
                    <td>Registr. číslo</td>
                    <td>Tým</td>
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