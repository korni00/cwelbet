import { Message, EmbedBuilder } from 'discord.js';
import prisma from '../../utils/database';

export const handleDailyClaim = async (message: Message) => {
  try {
    const userId = message.author.id;

    let user = await prisma.user.findUnique({
      where: { discordId: userId },
    });
    const currentTime = new Date();

    if (!user) {
      user = await prisma.user.create({
        data: {
          discordId: userId,
          username: message.author.username,
          balance: 1000,
          balanceLastClaimed: currentTime,
        },
      });
    }

    const timeDiff = Math.abs(
      currentTime.getTime() - user.balanceLastClaimed.getTime()
    );
    const hoursDiff = Math.floor(timeDiff / (1000 * 3600));
    if (hoursDiff < 6) {
      const remainingHours = 6 - hoursDiff;
      const userAvatar = message.author.avatarURL() ?? undefined;

      const embed = new EmbedBuilder()
        .setTitle(
          '<:Weird:1243163283234492507> CwelBet - Bank Gringotta jest pusty'
        )
        .setColor('Red')
        .setImage(
          'https://static1.srcdn.com/wordpress/wp-content/uploads/2017/04/Harry-Potter-Goblin-Talking-to-Harry-and-Hagrid-at-Gringotts-Bank.jpg'
        )
        .setFooter({
          text: message.author.displayName,
          iconURL: userAvatar,
        })
        .setTimestamp()
        .setDescription(
          `Następne szekle możesz odebrać za **${remainingHours} godzin**`
        );

      return await message.channel.send({ embeds: [embed] });
    }

    await prisma.user.update({
      where: { discordId: userId },
      data: { balanceLastClaimed: currentTime },
    });

    const bonusAmount = Math.floor(Math.random() * (500 - 100 + 1)) + 100;
    const userAvatar = message.author.avatarURL() ?? undefined;

    const newBalance = user.balance + bonusAmount;
    await prisma.user.update({
      where: { discordId: userId },
      data: { balance: newBalance },
    });

    const embed = new EmbedBuilder()
      .setTitle(
        `<:Weird:1243163283234492507> CwelBet - Odebrano ${bonusAmount} szekli <:zyd:1149450085210542180>`
      )
      .setColor('Green')
      .setImage(
        'https://static1.srcdn.com/wordpress/wp-content/uploads/2018/10/Goblin-Harry-Potter-Movies-Gringotts-Bank.jpg'
      )
      .setFooter({
        text: message.author.displayName,
        iconURL: userAvatar,
      })
      .setTimestamp()
      .setDescription(`Twój aktualny stan konta: **${newBalance}**`);

    await message.channel.send({ embeds: [embed] });
  } catch (error) {
    console.error('Wystąpił błąd podczas obsługi codziennego bonusu:', error);
    message.reply('Wystąpił błąd podczas obsługi codziennego bonusu.');
  }
};
