import { ScoreProvider } from "../context/ScoreContext";
import { Row } from "../utils/score";
import ScoreTable from "./ScoreTable";
import SumScoreTable from "./SumScoreTable";
import styles from "./TeamScoreBoard.module.css"

type Props = {
    name: string;
    initialData: Row[];
    collapsible?: boolean;
}

export default function TeamScoreBoard({ name, initialData, collapsible = true }: Props){

    return(
        <ScoreProvider initialData={initialData}>
            <div className={styles.container}>
                <div className={styles.teamName}>
                    {name}
                </div>

                <div className={styles.teamContainer}>
                    <ScoreTable collapsible={collapsible}></ScoreTable>
                </div>

                <div className={styles.scoreBoard}>
                    <SumScoreTable ></SumScoreTable>
                </div>
            </div>
        </ScoreProvider>
    );
}