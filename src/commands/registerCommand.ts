import { Client } from 'discord.js';
import { checkCoinRanking } from './account/balance';
import { handleDuel } from './account/duel';
import { getMatchesInfo } from './info/matches';
import { handleDailyClaim } from './account/claim';
import { help } from './info/help';
import { placeBet } from './bet/placeBet';

export async function registerCommands(client: Client) {
  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift()?.toLowerCase();

    if (command === 'szekle') {
      await checkCoinRanking(message);
    } else if (command === 'duel') {
      await handleDuel(message);
    } else if (command === 'mecze') {
      await getMatchesInfo(message);
    } else if (command === 'odbierz') {
      await handleDailyClaim(message);
    } else if (command === 'bet') {
      await placeBet(message);
    } else if (command === 'pomoc') {
      await help(message);
    }
  });
}
