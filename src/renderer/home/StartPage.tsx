import { useState } from "react";
import Button from "../components/Button";
import StartInformation from "./StartInformation";
import styles from "./StartPage.module.css"

export type Props = {
    onStart: () => void;
};

export default function StartPage(props: Props){
    const [homeTeamId, setHomeTeamId] = useState<number | null>(null);
    const [guestTeamId, setGuestTeamId] = useState<number | null>(null);

    const [homePlayerIds, setHomePlayerIds] = useState<number[]>([]);
    const [guestPlayerIds, setGuestPlayerIds] = useState<number[]>([]);

    const [date, setDate] = useState<number | null>(null);
    const [league, setLeague] = useState<string>("");
    const [totalThrows, setTotalThrows] = useState<number | null>(null);
    const [playerCount, setPlayerCount] = useState<number | null>(null);

    return(
       <div className={styles.container}>
            <div className={styles.menuContainer}>
                <Button onClick={props.onStart}>Záhájit hru </Button>
            </div>
            <div className={styles.content}>
                <div className={styles.header}>
                    <h4>Počet hodů</h4>
                    <input></input>
                </div>
                <div className={styles.info}>
                    <div className={styles.team}>
                        <StartInformation teamId={homeTeamId} onTeamChange={setHomeTeamId}
                        onPlayersChange={(id) => {setHomePlayerIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}}
                        playerIds={homePlayerIds}></StartInformation>
                    </div>
                    <div className={styles.team}>
                        <StartInformation teamId={guestTeamId} onTeamChange={setGuestTeamId} 
                        onPlayersChange={(id) => {setGuestPlayerIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}}
                        playerIds={guestPlayerIds}></StartInformation>
                    </div>
                </div>
            </div>
       </div>
    );
}