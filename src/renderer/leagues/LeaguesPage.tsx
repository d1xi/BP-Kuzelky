import { useEffect, useState } from "react";
import styles from "./LeaguesPage.module.css"
import LeaguesTable from "./LeaguesTable";
import { League } from "../database/leagues";
import { useDatabase } from "../database/database";
import Button from "../components/Button";

import { useLocation } from "react-router-dom";


export default function LeaguesPage(){
    const database = useDatabase();
    const [leagues, setLeagues ] = useState<League[]>([]);
    const [selectedLeague, setSelectedLeague] = useState<League | null>(null);  
    const location = useLocation();
    
    useEffect(() => {
            database.leagues.getAll().then((leaguesList) => setLeagues(leaguesList))
        }, [location.pathname]);
    
    function OnClickAddLeague(){
        database.leagues.addLeague("").then((newLeague) => {
            const newLeagues = [ ...leagues, newLeague];
            setLeagues(newLeagues);
        })
    }

    function updateLeagues(nextLeagues: League[]){
        setLeagues(nextLeagues);
    }
    

    return(
        <div className={styles.container}>
            <div className={styles.leaguesContainer}>
                <h1>Ligy</h1>
                <LeaguesTable leagues={leagues}
                    database={database}
                    selectedLeague={selectedLeague}
                    onLeagueChange={setLeagues}
                    onSelectedLeague={setSelectedLeague}>

                </LeaguesTable>
                <div className={styles.menu}>
                    <Button onClick={OnClickAddLeague}>Přidat</Button>
                </div>
            </div> 
        </div>               
    );
}