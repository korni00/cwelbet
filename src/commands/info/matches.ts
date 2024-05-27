import { ButtonBuilder, ButtonStyle, EmbedBuilder, Message } from 'discord.js';
import prisma from '../../utils/database';
import type { Match } from '../../types/match';

export const getMatchesInfo = async (message: Message) => {
  try {
    const userAvatar = message.author.avatarURL() ?? undefined;

    const matches = await prisma.match.findMany({
      where: { ended: false },
      select: {
        team1: true,
        team2: true,
        teamscore1: true,
        teamscore2: true,
        time: true,
        oddsTeam1: true,
        oddsDraw: true,
        oddsTeam2: true,
        uniqueId: true,
        ended: true,
      },
    });

    const transformedMatches = matches
      .filter(
        (match) =>
          !match.team1.includes('U21') &&
          !match.team1.includes('U16') &&
          !match.team1.includes('U17') &&
          !match.team1.includes('U18') &&
          !match.team1.includes('U19') &&
          !match.team1.includes('U20') &&
          !match.team1.includes('U22') &&
          !match.team1.includes('U23') &&
          !match.team2.includes('U21') &&
          !match.team2.includes('U16') &&
          !match.team2.includes('U17') &&
          !match.team2.includes('U18') &&
          !match.team2.includes('U19') &&
          !match.team2.includes('U20') &&
          !match.team2.includes('U22') &&
          !match.team2.includes('U23')
      )
      .map((match) => ({
        ...match,
        odds: {
          team1: match.oddsTeam1,
          draw: match.oddsDraw,
          team2: match.oddsTeam2,
        },
        oddsTeam1: undefined,
        oddsDraw: undefined,
        oddsTeam2: undefined,
      }));

    const pages = Math.ceil(transformedMatches.length / 10);
    let currentPage = 0;

    const generateEmbed = (start: any) => {
      const current = transformedMatches.slice(start, start + 10);

      const embed = new EmbedBuilder()
        .setColor('#C200FF')
        .setTitle('<:Weird:1243163283234492507> CwelBet - Live mecze')
        .setFooter({
          text: message.author.displayName,
          iconURL: userAvatar,
        })
        .setTimestamp()
        .setDescription('Lista aktualnych meczów');

      current.forEach((match: Match) => {
        const typedMatch: Match = match as Match;
        const oddsTeam1 = typedMatch.odds?.team1 ?? 2.0;
        const oddsDraw = typedMatch.odds?.draw ?? 2.0;
        const oddsTeam2 = typedMatch.odds?.team2 ?? 2.0;

        const oddsEmojisTeam1 =
          oddsTeam1 > oddsTeam2
            ? ':small_red_triangle:'
            : ':small_red_triangle_down:';
        const oddsEmojisTeam2 =
          oddsTeam2 > oddsTeam1
            ? ':small_red_triangle:'
            : ':small_red_triangle_down:';

        embed.addFields({
          name: `**${typedMatch.team1}** vs **${typedMatch.team2}** - **${typedMatch.teamscore1}** : **${typedMatch.teamscore2}** ⏱️ ${typedMatch.time}`,
          value: `**${typedMatch.uniqueId} - ${oddsEmojisTeam1} ${oddsTeam1} | ${oddsDraw} | ${oddsTeam2} ${oddsEmojisTeam2}**`,
          inline: false,
        });
      });

      return embed;
    };

    const updateButtons = () => {
      previousButton.setDisabled(currentPage === 0);
      nextButton.setDisabled(currentPage >= pages - 1);
    };

    const previousButton = new ButtonBuilder()
      .setCustomId('previous')
      .setLabel('Poprzednia strona')
      .setStyle(ButtonStyle.Primary);

    const nextButton = new ButtonBuilder()
      .setCustomId('next')
      .setLabel('Następna strona')
      .setStyle(ButtonStyle.Secondary);

    updateButtons();

    const row = {
      type: 1,
      components: [previousButton, nextButton],
    };

    const msg = await message.channel.send({
      embeds: [generateEmbed(0)],
      components: [row],
    });

    const collector = msg.createMessageComponentCollector();

    collector.on('collect', async (interaction) => {
      if (interaction.customId === 'previous') {
        if (currentPage !== 0) {
          --currentPage;
        }
      } else if (interaction.customId === 'next') {
        if (currentPage < pages - 1) {
          ++currentPage;
        }
      }

      updateButtons();

      await interaction.update({
        embeds: [generateEmbed(currentPage * 10)],
        components: [row],
      });
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
  }
};
