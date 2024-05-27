import type { Match } from '../types/match';
import { Page } from 'puppeteer';
import { upsertMatches } from './upsertMatches';
import * as variables from '../utils/config';

export const scrapePage = async (page: Page) => {
  await page.waitForSelector(variables.liveEventsSelector);

  const leagueGroupElements = await page.$$eval(
    variables.leagueGroupSelector,
    (elements, variables) => {
      const cleanTeamName = (name: string): string =>
        name
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '')
          .replace(/[^\w\s]/gi, '')
          .substring(0, 3);

      const generateUniqueId = (team1: string, team2: string): string => {
        const formattedTeam1 = cleanTeamName(team1);
        const formattedTeam2 = cleanTeamName(team2);
        return `${formattedTeam1}-${formattedTeam2}`;
      };

      const parseMatch = (matchElement: Element): Match | null => {
        const team1Element = matchElement.querySelector(
          `${variables.matchNameSelector}:first-child`
        );
        const team2Element = matchElement.querySelector(
          `${variables.matchNameSelector}:last-child`
        );
        const scoreElement = matchElement.querySelector(
          variables.matchScoreTotalSelector
        );
        const timeElement = matchElement.querySelector(
          variables.matchGameTimeSelector
        );

        const team1 = team1Element?.textContent?.trim() || '';
        const team2 = team2Element?.textContent?.trim() || '';
        const score = scoreElement?.textContent?.trim() || '';
        const time = timeElement?.textContent?.trim() || '';

        const invalidTeamName = /\bU1[6-9]\b|\bU2[0-3]\b/i;
        if (
          !team1 ||
          !team2 ||
          invalidTeamName.test(team1) ||
          invalidTeamName.test(team2)
        ) {
          return null;
        }

        const [teamscore1, teamscore2] = score.split(' : ');
        const oddsElements = matchElement.querySelectorAll(
          variables.oddsGroupSelector
        );
        const odds = Array.from(oddsElements).map((oddsElement) => {
          const oddsText = oddsElement?.textContent?.trim() || '';
          return oddsText.replace(/^\d\s/, '');
        });

        const uniqueId = generateUniqueId(team1, team2);

        return {
          team1,
          team2,
          teamscore1,
          teamscore2,
          time,
          odds: {
            team1: odds[0] || null,
            draw: odds[1] || null,
            team2: odds[2] || null,
          },
          uniqueId,
          ended: time.toLowerCase().trim() === variables.endOfTheMatch,
        } as Match;
      };

      const parseLeagueGroup = (element: Element) => {
        const competitionTitleElement = element.querySelector(
          variables.competitionTitleSelector
        );
        if (!competitionTitleElement || !competitionTitleElement.textContent)
          return null;

        const competitionTitle = competitionTitleElement.textContent.trim();
        if (
          variables.EXCLUDED_COMPETITIONS.some((excluded) =>
            competitionTitle.includes(excluded)
          )
        )
          return null;

        const matchElements = Array.from(
          element.querySelectorAll(variables.marketItemEventSelector)
        );
        const matches = matchElements
          .map(parseMatch)
          .filter((match): match is Match => match !== null);

        return {
          competition: competitionTitle,
          matches,
        };
      };

      return elements
        .map((element) => parseLeagueGroup(element))
        .filter((group): group is NonNullable<typeof group> => group !== null);
    },
    variables
  );

  const newMatches = leagueGroupElements.flatMap(
    (leagueGroup) => leagueGroup.matches
  );

  await upsertMatches(newMatches);

  console.log(`Updated ${newMatches.length} matches.`);
};
