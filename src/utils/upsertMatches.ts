import prisma from './database';
import type { Match } from '../types/match';
import * as variables from './config';

export const upsertMatches = async (matches: Match[]) => {
  const matchUpserts = matches.map((match) => {
    const ended = match.time.toLowerCase().trim() === variables.endOfTheMatch;
    return prisma.match.upsert({
      where: { uniqueId: match.uniqueId },
      update: {
        team1: match.team1,
        team2: match.team2,
        teamscore1: match.teamscore1,
        teamscore2: match.teamscore2,
        time: match.time,
        oddsTeam1: match.odds?.team1 ?? undefined,
        oddsDraw: match.odds?.draw ?? undefined,
        oddsTeam2: match.odds?.team2 ?? undefined,
        ended,
      },
      create: {
        team1: match.team1,
        team2: match.team2,
        teamscore1: match.teamscore1,
        teamscore2: match.teamscore2,
        time: match.time,
        oddsTeam1: match.odds?.team1 ?? undefined,
        oddsDraw: match.odds?.draw ?? undefined,
        oddsTeam2: match.odds?.team2 ?? undefined,
        uniqueId: match.uniqueId,
        ended,
      },
    });
  });

  await prisma.$transaction(matchUpserts);
};
