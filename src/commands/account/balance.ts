import { EmbedBuilder, Message } from 'discord.js';
import prisma from '../../utils/database';

export const checkCoinRanking = async (message: Message) => {
  try {
    const rankingData = await prisma.user.findMany({
      take: 10,
      orderBy: {
        balance: 'desc',
      },
    });

    const messageAuthor = await prisma.user.findUnique({
      where: { discordId: message.author.id },
    });

    const messageAuthorIndex = rankingData.findIndex(
      (user) => user.discordId === message.author.id
    );

    const isMessageAuthorOutsideTopTen = messageAuthorIndex === -1;

    const buildRankingFields = async () => {
      function getFieldContent(user: any, index: number) {
        return `${index + 1}. ${user.username ?? 'Unknown User'}: **${
          user.balance
        }** szekli`;
      }

      const fields = rankingData.map((user, index) => {
        if (index === 0) {
          return `## 🥇**${user.username ?? 'Unknown User'}: ${
            user.balance
          } szekli**`;
        } else if (index === 1) {
          return `## 🥈**${user.username ?? 'Unknown User'}: ${
            user.balance
          } szekli**`;
        } else if (index === 2) {
          return `## 🥉**${user.username ?? 'Unknown User'}: ${
            user.balance
          } szekli**`;
        } else {
          return getFieldContent(user, index);
        }
      });

      if (isMessageAuthorOutsideTopTen && messageAuthor) {
        const userRank = await prisma.user.count({
          where: { balance: { gt: messageAuthor.balance } },
        });
        const userPosition = userRank + 1;
        fields.push(
          '...',
          `${userPosition}. ${messageAuthor.username ?? 'Unknown User'}: **${
            messageAuthor.balance
          }** szekli`
        );
      }

      return fields.join('\n');
    };
    const userAvatar = message.author.avatarURL() ?? undefined;

    const embed = new EmbedBuilder()
      .setTitle('<:Weird:1243163283234492507> CwelBet - Ranking szekli')
      .setColor('#C200FF')
      .setFooter({
        text: message.author.displayName,
        iconURL: userAvatar,
      })
      .setTimestamp()
      .setDescription(await buildRankingFields());

    message.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Wystąpił błąd podczas pobierania rankingu:', error);
    message.reply('Wystąpił błąd podczas pobierania rankingu.');
  }
};
