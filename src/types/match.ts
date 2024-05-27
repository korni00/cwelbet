export interface Match {
  team1: string;
  team2: string;
  teamscore1: string;
  teamscore2: string;
  time: string;
  odds?: {
    team1: string | null;
    draw: string | null;
    team2: string | null;
  };
  uniqueId: string;
  ended: boolean;
}
