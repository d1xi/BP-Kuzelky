import { MembersRepository } from "./members";
import { TeamsRepository } from "./teams";
import { MatchRepository } from "./matches";
import { MatchTeamsRepository } from "./matchTeams";
import { MatchPlayersRepository } from "./matchPlayers";
import { ThrowsRepository } from "./throw";
import { ThrowSeriesRepository } from "./throwSeries";
import { LeaguesRepository } from "./leagues";

export interface Database {
    teams: TeamsRepository; //Soupiska
    members: MembersRepository; //Člen
    matches: MatchRepository;   //Zápas
    matchTeams: MatchTeamsRepository;   //Tým
    matchPlayers: MatchPlayersRepository; // Hráč
    throws: ThrowsRepository;
    throwSeries: ThrowSeriesRepository;
    leagues: LeaguesRepository;
}

export function useDatabase(): Database {
    return {
        teams: new TeamsRepository(),
        members: new MembersRepository(),
        matches: new MatchRepository(),
        matchTeams: new MatchTeamsRepository(),
        matchPlayers: new MatchPlayersRepository(),
        throws: new ThrowsRepository(),
        throwSeries: new ThrowSeriesRepository(),
        leagues: new LeaguesRepository()
    };
} 
