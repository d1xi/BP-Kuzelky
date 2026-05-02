import Button from "../components/Button";
import Lane from "../components/Lane";
import TeamScoreBoard from "../components/TeamScoreBoard";
import styles from "./MatchPage.module.css"


import { teamAData, teamBData } from "../testData/score";

export type Props = {
    onBack: () => void;
}

export default function MatchPage(props: Props){

    return(
        <div className={styles.container}>
            <div className={styles.menuContainer}>
                <div className={styles.menu}>
                    <Button> Start </Button>
                    <Button> Pauza </Button>
                    <Button> Uložit </Button>
                    <Button> Přechod mezi dráhami </Button>
                    <Button> Další dvojice </Button>
                </div>
                <div className={styles.return}>
                    <Button onClick={props.onBack}>Nastavení</Button>
                </div>
            </div>

            <div className={styles.laneContainer}>
                <Lane name="Jan Novák"> Dráha 1 </Lane>
                <Lane name="Petr Svoboda"> Dráha 2 </Lane>
            </div>

            <div className={styles.teamContainer}>
                <TeamScoreBoard
                    name='Nové Město na Moravě "C"'
                    initialData={teamAData}
                />
                <TeamScoreBoard
                    name='Kamenice nad Lipou "D"'
                    initialData={teamBData}
                />
            </div>
        </div>  
    );
}