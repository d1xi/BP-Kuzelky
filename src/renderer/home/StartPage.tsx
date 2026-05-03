import { useEffect, useState } from "react";
import Button from "../components/Button";
import StartInformation from "./StartInformation";
import styles from "./StartPage.module.css"
import { useDatabase } from "../database/database";

export type Props = {
    onStart: (id: number) => void;
    matchId: number | null;
};

type Mode = "createMatch" | "editMatch";

export default function StartPage(props: Props){
    const database = useDatabase();
    const [homeTeamId, setHomeTeamId] = useState<number | null>(null);
    const [guestTeamId, setGuestTeamId] = useState<number | null>(null);

    const [homePlayerIds, setHomePlayerIds] = useState<number[]>([]);
    const [guestPlayerIds, setGuestPlayerIds] = useState<number[]>([]);

    const [date, setDate] = useState<number | null>(null);
    const [leagueId, setLeagueId] = useState<number | null>(null);
    const [totalThrows, setTotalThrows] = useState<number | null>(null);
    const [playerCount, setPlayerCount] = useState<number | null>(null);

    useEffect(() => {
        if(!props.matchId){
            return;
        }
        const matchId = props.matchId
        const loadMatch = async () => {
            const match = await database.matches.getById(matchId);
            if(!match) return;

            setTotalThrows(match.totalThrows);
            setDate(match.date);

            const teams = await database.matchTeams.getByMatchId(matchId);

            setHomeTeamId(teams[0]?.teamId ?? null);
            setGuestTeamId(teams[1]?.teamId ?? null);

            const players = await database.matchPlayers.getByMatchId(matchId);

            const home = players.filter(p => p.teamId === teams[0]?.teamId).map(p => p.memberId);
            const guest = players.filter(p => p.teamId === teams[1]?.teamId).map(p => p.memberId);
            
            setHomePlayerIds(home);
            setGuestPlayerIds(guest);
        };

        loadMatch();
    }, [props.matchId])

    const handleMatchStart = async () => {
        if(!homeTeamId || !guestTeamId){
            alert("Vyberte oba týmy");
            return;
        }
        
        if(homePlayerIds.length === 0 || guestPlayerIds.length === 0){
            alert("Vyberte hráče");
            return;
        }

        if(!totalThrows){
            alert("Zadejte počet hodů");
            return;
        }

        const teams = await database.teams.getAll();
        const homeTeamLeague = teams.find(t => t.id === homeTeamId);
        const guestTeamLegue = teams.find(t => t.id === guestTeamId);

        if(!homeTeamLeague || !guestTeamLegue){
            alert("Neplatný tým")
            return;
        }
        if(homeTeamLeague.leagueId !== guestTeamLegue.leagueId){
            alert("Týmy nejsou ze stejné ligy")
            return;
        }


        if(props.matchId){
            await window.electron.ipcRenderer.invoke("updateMatch", {
                matchId: props.matchId,
                homePlayerIds,
                guestPlayerIds
            });
            props.onStart(props.matchId);
        }

        else{
            try{
            const matchDate = date ?? Date.now();
            const matchId = await window.electron.ipcRenderer.invoke<number>(
                "createNewMatch",{
                    date: matchDate,
                    leagueId: homeTeamLeague.leagueId,
                    totalThrows,
                    playerCount: homePlayerIds.length + guestPlayerIds.length,
                    homeTeamId,
                    guestTeamId,
                    homePlayerIds,
                    guestPlayerIds
                }
            );
            props.onStart(matchId)
        }
        catch (error){
            alert("Došlo k chybě při vytváření zápasu");
            return;//TODO err
        }
        }     
        
    };

    const handleHomeTeamChange = (id: number) => {
        setHomeTeamId(id);
        setHomePlayerIds([]);
    };

    const handleGuestTeamChange = (id: number) => {
        setGuestTeamId(id);
        setGuestPlayerIds([]);
    };

    return(
       <div className={styles.container}>
            <div className={styles.menuContainer}>
                <Button onClick={handleMatchStart}>{props.matchId ? "Pokračovat ve hře" : "Zahájit hru"}</Button>
            </div>
            <div className={styles.content}>
                <div className={styles.header}>
                    <h4>Počet hodů</h4>
                    <input className={styles.input} placeholder="200" type="number"
                        value={totalThrows ?? ""}  min={5} step={5}
                        onChange={(event) => {const val = event.target.value; setTotalThrows(val === "" ? null : Number(val))}}></input>
                </div>
                <div className={styles.info}>
                    <div className={styles.team}>
                        <StartInformation teamId={homeTeamId} onTeamChange={props.matchId ? undefined : handleHomeTeamChange}
                        onPlayersChange={(id) => {setHomePlayerIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}}
                        playerIds={homePlayerIds}> Domácí</StartInformation>
                    </div>
                    <div className={styles.team}>
                        <StartInformation teamId={guestTeamId} onTeamChange={props.matchId ? undefined : handleGuestTeamChange} 
                        onPlayersChange={(id) => {setGuestPlayerIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}}
                        playerIds={guestPlayerIds}>Hosté</StartInformation>
                    </div>
                </div>
            </div>
       </div>
    );
}