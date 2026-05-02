import { useState } from "react";
import styles from "./HomePage.module.css";
import MatchPage from "./MatchPage";
import StartPage from "./StartPage";

export type Page = "start" | "match";

export default function HomePage(){
    const [page, setPage] = useState <Page>("start");

    return(
        <div className={styles.container}>            
            {page === "start" && (
                <StartPage onStart={() => setPage("match")}/>
            )}

            {page === "match" && (
                <MatchPage onBack={() => setPage("start")}/>
            )}
        </div>
    );
}