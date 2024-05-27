import { Client, EmbedBuilder, TextChannel } from 'discord.js';
import prisma from '../../utils/database';
import * as variables from '../../utils/config';

const sentEmbeds = new Map<string, boolean>();

export const resolveEndedMatches = async (client: Client) => {
  try {
    const endedBets = await prisma.bet.findMany({
      where: { match: { ended: true } },
      include: { match: true, user: true },
    });

    const matchBets = new Map<string, any[]>();

    for (const bet of endedBets) {
      const { match } = bet;
      if (match && match.uniqueId) {
        if (!matchBets.has(match.uniqueId)) {
          matchBets.set(match.uniqueId, []);
        }
        matchBets.get(match.uniqueId)?.push(bet);
      }
    }

    for (const [uniqueId, bets] of matchBets.entries()) {
      const match = bets[0].match;
      const { team1, team2 } = match;

      const matchResult = await prisma.match.findUnique({
        where: { uniqueId },
      });

      if (!matchResult) {
        continue;
      }

      const { teamscore1, teamscore2 } = matchResult;

      const teamscore1Int = parseInt(teamscore1);
      const teamscore2Int = parseInt(teamscore2);

      if (!sentEmbeds.has(uniqueId)) {
        sentEmbeds.set(uniqueId, true);

        const generalChannel = client.channels.cache.get(
          variables.resolveMatchChat
        ) as TextChannel;

        if (generalChannel) {
          const winteam =
            teamscore1Int > teamscore2Int
              ? team1
              : teamscore1Int < teamscore2Int
              ? team2
              : variables.drawMatch;
          const loseteam =
            teamscore1Int < teamscore2Int
              ? team1
              : teamscore1Int > teamscore2Int
              ? team2
              : '';
          const diff = Math.abs(teamscore1Int - teamscore2Int);

          let resultDescription = '';

          if (winteam === variables.drawMatch) {
            resultDescription = variables.drawMatch;
          } else {
            resultDescription = `${winteam} pokonał ${loseteam} ${diff} punktami`;
          }

          const embed = new EmbedBuilder()
            .setColor('#C200FF')
            .setTitle('<:Weird:1243163283234492507> CwelBet - Mecz zakończony')
            .setDescription(
              `**${team1}** vs **${team2}** | **${teamscore1}** - **${teamscore2}**`
            );

          for (const bet of bets) {
            const { user, amount, odds, betOn } = bet;
            const { username, discordId } = user;

            let betStatus: string;
            if (
              (teamscore1Int > teamscore2Int && betOn === team1) ||
              (teamscore1Int < teamscore2Int && betOn === team2) ||
              (teamscore1Int === teamscore2Int && betOn === variables.drawMatch)
            ) {
              betStatus = variables.winMatch;
            } else {
              betStatus = variables.loseMatch;
            }

            if (betStatus === variables.winMatch) {
              const winningAmount = amount * odds;
              embed.addFields({
                name: `${username || discordId}`,
                value: `Wygrał **${winningAmount}** szekli, postawił **${amount}** szekli na **${betOn}**, z kursem: **${odds}**.`,
              });

              await prisma.user.update({
                where: { id: bet.userId },
                data: { balance: { increment: winningAmount } },
              });
            } else {
              embed.addFields({
                name: `${username || discordId}`,
                value: `Przegrał **${amount}** szekli, postawił na: **${betOn}**.`,
              });
              await prisma.user.update({
                where: { id: bet.userId },
                data: { balance: { decrement: amount } },
              });
            }

            await prisma.bet.update({
              where: { id: bet.id },
              data: { status: betStatus },
            });
          }

          embed.setTimestamp();

          await generalChannel.send({ embeds: [embed] });
        }
      }

      await prisma.match.update({
        where: { uniqueId },
        data: {
          ended: false,
          team1: 'U16 U17 U18 U19 U20',
          team2: 'U16 U17 U18 U19 U20',
        },
      });
    }
  } catch (err) {
    console.error('Błąd podczas rozstrzygania zakładów:', err);
  }
};
