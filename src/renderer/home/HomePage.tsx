import { useState } from "react";
import styles from "./HomePage.module.css";
import MatchPage from "./MatchPage";
import StartPage from "./StartPage";

export type Page = "start" | "match";

export default function HomePage(){
    const [page, setPage] = useState <Page>("start");
    const [matchId, setMatchId] = useState<number | null>(null);

    return(
        <div className={styles.container}>            
            {page === "start" && (
                <StartPage matchId={matchId} onStart={(id) => {setMatchId(id); setPage("match")}}/>
            )}

            {page === "match" && (
                <MatchPage matchId={matchId} onBack={() => setPage("start")}/>
            )}
        </div>
    );
}