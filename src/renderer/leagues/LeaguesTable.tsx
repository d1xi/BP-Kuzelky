import { MouseEvent, useEffect, useState } from "react";
import styles from "./LeaguesTable.module.css";
import { League } from "../database/leagues";
import { Database } from "../database/database";
import edit from "../utils/edit-black.svg";
import del from "../utils/delete-black.svg";

export type Props = {
    leagues: League[];
    database: Database;
    selectedLeague: League | null;
    onLeagueChange: (newLeagues: League[]) => void;
    onSelectedLeague: (league: League | null) => void;
};

export default function LeaguesTable(props: Props) {
    const [editMode, setEditMode] = useState<number | null>(null);

    const rows = props.leagues.map((league) => {
        const isEditing = editMode === league.id;

        function HandleEditModeChange(event: MouseEvent) {
            event.stopPropagation();

            setEditMode(prev => {
                const isSameRow = prev === league.id;

                if(isSameRow){
                    return null;
                }

                props.onSelectedLeague(league);
                return league.id
            })
        }

        function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
            const newName = e.target.value.trim();

            setEditMode(null);

            if (!newName || newName === league.name) return;

            props.database.leagues.setName(league.id, newName);

            props.onLeagueChange(
                props.leagues.map(l =>
                    l.id === league.id ? { ...l, name: newName } : l
                )
            );
        }

        function HandleDelete(event: MouseEvent) {
            event.stopPropagation();

            props.database.leagues.deleteLeague(league.id).then(() => {
                props.onLeagueChange(
                    props.leagues.filter(l => l.id !== league.id)
                );
            });
        }

        return (
            <tr key={league.id}
                className={[league.id === props.selectedLeague?.id ? styles.selectedRow : "",
                    !isEditing ? styles.readonlyRow : ""].join(" ")}
                onClick={() => props.onSelectedLeague(league)}
            >
                <td><input className={styles.input} readOnly={!isEditing}
                        defaultValue={league.name}
                        onBlur={handleBlur}/></td>
                <td className={styles.center} onClick={HandleEditModeChange}><img src={edit} alt="edit" /></td>
                <td className={styles.center} onClick={HandleDelete}><img src={del} alt="delete" /></td>
            </tr>
        );
    });

    return (
        <table className={styles.table}>
            <thead>
                <tr>
                    <td>Název</td>
                    <td className={styles.center}>Upravit</td>
                    <td className={styles.center}>Odstranit</td>
                </tr>
            </thead>
            <tbody>{rows}</tbody>
        </table>
    );
}