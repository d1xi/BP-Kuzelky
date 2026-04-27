import { MouseEvent, FocusEvent, useState } from "react";
import styles from "./LeaguesTable.module.css"
import { League } from "../database/leagues";
import { Database } from "../database/database";
import edit from "../utils/edit-black.svg";
import del from "../utils/delete-black.svg";

export type Props = {
    leagues: League[],
    database: Database,
    selectedLeague: League | null,
    onLeagueChange: (newLeagues: League[]) => void,
    onSelectedLeague: (league: League | null) => void,
}

export default function LeaguesTable(props: Props){
    const [editMode, setEditMode] = useState<number | null>(null);
    const [name, setName] = useState<string>("");
    

    function updateLeagues(updated: League[]){
        props.onLeagueChange(updated);
    };

    const rows = props.leagues.map((league) => {
        const readOnly = editMode !== league.id;
        const isEditing = editMode === league.id;

        function OnNameChange(event: FocusEvent<HTMLInputElement>){
            const newName = event.currentTarget.value;

            props.database.leagues.setName(league.id, newName).then(() =>{
                updateLeagues(
                    props.leagues.map(l =>
                        l.id === league.id ? { ...l, name: newName} : l
                    )
                )
            });
        }

        function handleDelete(event: MouseEvent){
            event.stopPropagation();
            const result = confirm(`Opravdu chcete odstranit Ligu ${league.name}?`);

            if(result){
                props.database.leagues.deleteLeague(league.id).then((retVal) => {
                    if(!retVal){
                        alert("Nepodařilo se odstranit Ligu");
                        return;
                    }

                    updateLeagues(
                        props.leagues.filter(l => l.id !== league.id)
                    );

                    props.onSelectedLeague(null);
                    setEditMode(null);
                })
            }
        }

        function handleEditModeChange(event: MouseEvent){
            event.stopPropagation();

        setEditMode(prev => {
            const next = prev === league.id ? null : league.id;

            if (next === league.id) {
                setName(league.name);
            }

            return next;
        });

        props.onSelectedLeague(league);
        }

        const handleSelectedLeagueChange = () => {
            props.onSelectedLeague(league);
            setEditMode(null);
        }

        return(
            <tr key={league.id}
                className={[league.id === props.selectedLeague?.id
                    ? styles.selectedRow
                    : "",
                    !isEditing ? styles.readonlyRow : ""].join(" ")
                }   onClick={!isEditing ? handleSelectedLeagueChange :undefined}
            >
                <td><input className={styles.input} readOnly={!isEditing} onBlur={OnNameChange}
                     value={isEditing ? name : league.name}
                     onFocus={() => setName(league.name)}
                     onChange={(event) => setName(event.currentTarget.value)}
                     ></input></td>
                <td  className={styles.center} onClick={handleEditModeChange}><img src={edit} alt="Edit row" /></td>
                <td className={styles.center} onClick={handleDelete}><img src={del} alt="Delete row" /></td>
            </tr>
        );

    });


    return(
        <table className={styles.table}> 
            <thead>
                <tr>
                    <td>Název</td>
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