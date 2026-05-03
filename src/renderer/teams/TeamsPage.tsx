import { useEffect, useState, FocusEvent } from "react";
import Button from "../components/Button";
import styles from "./TeamsPage.module.css";
import { useDatabase } from "../database/database";
import { Team } from "../database/teams";
import TeamsTable from "./TeamsTable";
import MembersTable from "./MembersTable";
import { Member } from "../database/members";
import { League } from "../database/leagues";

import { useLocation } from "react-router-dom";


export default function TeamsPage(){
    const database = useDatabase();
    const [teams, setTeams] = useState<Team[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [leagues, setLeagues ] = useState<League[]>([]);
    const [selectedTeam, setSelectedTeam ] = useState<Team | null>(null);
    const [selectedMember, setSelectedMember] = useState<Member | null> (null);
    const location = useLocation();

    useEffect(() => {
        database.teams.getAll().then((teamList) => setTeams(teamList))
    }, [location.pathname]);

    useEffect(() => {
        database.members.getAll().then((membersList) => updateMembers(membersList))
    }, [location.pathname]);

    useEffect(() => {
        database.leagues.getAll().then((leaguesList) => setLeagues(leaguesList))
    }, [location.pathname]);

    function OnClickAddTeam(){
        database.teams.addTeam("", 1, null).then((newTeam) => {
            const newTeams = [...teams ,newTeam];
            setTeams(newTeams);
        });
    }

    function updateMembers(nextMembers: Member[]){
        setMembers(nextMembers);

        setTeams(prevTeams => 
            prevTeams.map(team => {
                const leaderStillExists = nextMembers.some(
                    m => m.id === team.leaderId
                );

                return leaderStillExists
                    ? team
                    : {...team, leaderId: null};
            }) 
        )
    }

    function OnClickAddMember(team: Team){
        database.members.addMember("", 0, team.id ).then((newMember) => {
            updateMembers([...members, newMember]);
        });
    }

    return(
        <div className={styles.container}>
            <div className={styles.teamsContainer}>
                <div className={styles.teamView}>
                    <h1>Týmy</h1>
                    <TeamsTable teams={teams} database={database} 
                        onTeamsChange={setTeams} selectedTeam={selectedTeam}
                        onSelectedTeam={setSelectedTeam} leagues={leagues}
                        members={members}
                    />
                </div>
                <div className={styles.menu}>
                    <Button onClick={OnClickAddTeam}>Přidat</Button>
                </div>
            </div>

            <div className={styles.membersContainer}>
                <div className={styles.membersView}>
                    <h1>Členové</h1>
                    <MembersTable teams={teams} members={members} 
                        database={database} 
                        onMembersChage={updateMembers}
                        onSelectedMember={setSelectedMember}
                        selectedMember={selectedMember}
                        selectedTeam={selectedTeam}
                        onTeamsChange={setTeams}>                        
                    </MembersTable>
                </div>
                <div className={styles.menu}>
                    <Button onClick={() => selectedTeam && OnClickAddMember(selectedTeam)}>Přidat</Button>
                </div>
            </div>                
        </div>
    );
}