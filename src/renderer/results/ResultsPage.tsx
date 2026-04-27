import Button from "../components/Button";
import TeamScoreBoard from "../components/TeamScoreBoard";
import { teamAData, teamBData } from "../testData/score";
import styles from "./ResultsPage.module.css"

function openNewWindow(){
    window.electron.ipcRenderer.sendMessage("openResultsWindow");
}

export default function ResultsPage(){
    
    return(
        <div className={styles.container}>
            <div className={styles.exportContainer}>
                <div className={styles.menu}>
                    <Button> Náhled</Button>
                    <Button>Export</Button>
                    <Button onClick={openNewWindow}> Open new window</Button>
                </div>                
            </div>

            <div className={styles.teamsContainer}>
                <TeamScoreBoard
                    name='Nové Město na Moravě "C"'
                    initialData={teamAData}
                    collapsible={false}
                />
                <TeamScoreBoard
                    name='Kamenice nad Lipou "D"'
                    initialData={teamBData}
                    collapsible={false}
                />
            </div>           
            
        </div>
    );
}