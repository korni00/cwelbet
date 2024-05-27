import {
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  Message,
  type ActionRowData,
  type MessageActionRowComponentData,
} from 'discord.js';
import prisma from '../../utils/database';

export const handleDuel = async (message: Message) => {
  try {
    await initiateDuel(message);
  } catch (error) {
    console.error('Wystąpił błąd podczas obsługi pojedynku:', error);
    message.reply('Wystąpił błąd podczas obsługi pojedynku.');
  }
};

const initiateDuel = async (message: Message) => {
  const args = message.content.split(' ');
  const challengedUserId = args[1].replace(/[<@!>]/g, '');
  const amount = parseInt(args[2], 10);

  if (isNaN(amount) || amount <= 0) {
    return message.reply('Podaj prawidłową ilość szekli do pojedynku.');
  }

  const challenger = await prisma.user.findUnique({
    where: { discordId: message.author.id },
  });

  const challenged = await prisma.user.findUnique({
    where: { discordId: challengedUserId },
  });

  if (challenger!.id === challenged!.id) {
    return message.reply('Nie możesz wyzwać samego siebie.');
  }

  if (challenger!.balance < amount) {
    return message.reply('Masz za mało szekli.');
  }

  if (challenged!.balance < amount) {
    return message.reply(`${challenged!.username} ma za mało szekli.`);
  }

  const duelEmbed = new EmbedBuilder()
    .setTitle('<:Weird:1243163283234492507> Cwelbet - Duel')
    .setColor('#C200FF')
    .setDescription(
      `${message.author.username} wyzywa do pojedynku użytkownika ${
        challenged!.username
      } na ${amount} szekli!`
    );

  const confirmButton = new ButtonBuilder()
    .setCustomId('confirm')
    .setLabel('Akceptuj')
    .setStyle(ButtonStyle.Success);

  const declineButton = new ButtonBuilder()
    .setCustomId('decline')
    .setLabel('Odrzuć')
    .setStyle(ButtonStyle.Danger);

  const row: ActionRowData<MessageActionRowComponentData> = {
    type: 1,
    components: [confirmButton, declineButton],
  };

  const duelMessage = await message.channel.send({
    embeds: [duelEmbed],
    components: [row],
  });

  const filter = (interaction: { user: { id: string } }) =>
    interaction.user.id === challengedUserId;
  const collector = duelMessage.createMessageComponentCollector({
    filter,
    max: 1,
    time: 60000,
  });

  collector.on('collect', async (interaction) => {
    try {
      await interaction.deferUpdate();
      if (interaction.customId === 'confirm') {
        await handleDuelConfirmation(
          challenger,
          challenged,
          amount,
          duelMessage,
          duelEmbed,
          confirmButton,
          declineButton,
          row
        );
      } else if (interaction.customId === 'decline') {
        duelEmbed.setDescription('Pojedynek został odrzucony.');
        duelEmbed.setColor('Red');
        await duelMessage.edit({ embeds: [duelEmbed] });
      }
    } catch (error) {
      console.error(
        'Wystąpił błąd podczas obsługi interakcji przycisku:',
        error
      );
    }
  });

  collector.on('end', (collected, reason) => {
    if (reason === 'time') {
      duelEmbed.setColor('Red');
      duelEmbed.setDescription(
        'Czas na odpowiedź minął. Pojedynek został anulowany.'
      );
      duelMessage.edit({ embeds: [duelEmbed] });
    }
  });
};

const handleDuelConfirmation = async (
  challenger: any,
  challenged: any,
  amount: number,
  duelMessage: Message,
  duelEmbed: EmbedBuilder,
  confirmButton: ButtonBuilder,
  declineButton: ButtonBuilder,
  row: ActionRowData<MessageActionRowComponentData>
) => {
  try {
    const winner = Math.random() < 0.5 ? challenger : challenged;
    const loser = winner.id === challenger.id ? challenged : challenger;

    await prisma.user.update({
      where: { id: winner.id },
      data: { balance: { increment: amount } },
    });

    await prisma.user.update({
      where: { id: loser.id },
      data: { balance: { decrement: amount } },
    });

    const winnerUsername = winner.username ?? 'Unknown User';
    const loserUsername = loser.username ?? 'Unknown User';
    const newDescription = `${winnerUsername} wygrał(a) ${amount} szekli od ${loserUsername}!`;
    duelEmbed.setDescription(newDescription);

    confirmButton.setDisabled(true);
    declineButton.setDisabled(true);
    duelEmbed.setColor('Green');
    await duelMessage.edit({
      embeds: [duelEmbed],
      components: [row],
    });
  } catch (error) {
    console.error(
      'Wystąpił błąd podczas obsługi potwierdzenia pojedynku:',
      error
    );
  }
};
