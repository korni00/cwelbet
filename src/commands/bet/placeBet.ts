import {
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  Message,
  ActionRowBuilder,
  ComponentType,
} from 'discord.js';
import prisma from '../../utils/database';

export const placeBet = async (message: Message): Promise<void> => {
  try {
    const args = message.content.slice(1).trim().split(/ +/).slice(1);

    const regex = /(\w+-\w+) (.+) (\d+)/;
    const match = args.join(' ').match(regex);

    if (!match) {
      message.reply('!bet `id-meczu` `nazwa-druzyny` `liczba-szekli` ');
      return;
    }

    const [, uniqueId, teamName, amountString] = match;
    const amount = parseFloat(amountString);

    if (isNaN(amount) || amount <= 0) {
      message.reply('Niepoprawne wartości dla amount.');
      return;
    }

    const fetchedMatch = await prisma.match.findUnique({
      where: { uniqueId: uniqueId },
    });

    if (!fetchedMatch) {
      message.reply('Nie można znaleźć meczu o podanym identyfikatorze.');
      return;
    }

    const user = await prisma.user.findUnique({
      where: { discordId: message.author.id },
    });

    if (!user) {
      message.reply('Nie możemy znaleźć twojego konta w bazie danych.');
      return;
    }

    if (user.balance < amount) {
      message.reply('Nie masz wystarczających środków na koncie.');
      return;
    }

    const existingBet = await prisma.bet.findFirst({
      where: {
        userId: user.id,
        matchId: fetchedMatch.uniqueId,
      },
    });

    if (existingBet) {
      message.reply('Już obstawiłeś ten mecz.');
      return;
    }

    let odds: number;
    let betOn: string;

    if (fetchedMatch.team1.toLowerCase() === teamName.toLowerCase()) {
      betOn = fetchedMatch.team1;
      odds =
        fetchedMatch.oddsTeam1 !== null &&
        !isNaN(parseFloat(fetchedMatch.oddsTeam1))
          ? parseFloat(fetchedMatch.oddsTeam1)
          : 2.0;
    } else if (fetchedMatch.team2.toLowerCase() === teamName.toLowerCase()) {
      betOn = fetchedMatch.team2;
      odds =
        fetchedMatch.oddsTeam2 !== null &&
        !isNaN(parseFloat(fetchedMatch.oddsTeam2))
          ? parseFloat(fetchedMatch.oddsTeam2)
          : 2.0;
    } else if (teamName.toLowerCase() === 'remis') {
      betOn = 'remis';
      odds =
        fetchedMatch.oddsDraw !== null &&
        !isNaN(parseFloat(fetchedMatch.oddsDraw))
          ? parseFloat(fetchedMatch.oddsDraw)
          : 2.0;
    } else {
      message.reply('Nazwa drużyny lub remis nie jest poprawna.');
      return;
    }

    const betEmbed = new EmbedBuilder()
      .setColor('#C200FF')
      .setTitle('<:Weird:1243163283234492507> CwelBet - Obstawianie meczy')
      .setDescription(
        `Obstawiasz mecz **${fetchedMatch.team1} vs ${fetchedMatch.team2}**.`
      )
      .addFields({
        name: 'Podsumowanie:',
        value: `**${amount}** szekli na **${teamName}** po kursie **${odds}**`,
        inline: false,
      })
      .setTimestamp();

    const declineButton = new ButtonBuilder()
      .setCustomId('decline')
      .setLabel('Odrzuć')
      .setStyle(ButtonStyle.Danger);

    const acceptButton = new ButtonBuilder()
      .setCustomId('accept')
      .setLabel('Akceptuj')
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      acceptButton,
      declineButton
    );

    const betMessage = await message.channel.send({
      embeds: [betEmbed],
      components: [row],
    });

    const filter = (interaction: any) =>
      interaction.user.id === message.author.id;
    const collector = betMessage.createMessageComponentCollector({
      filter,
      componentType: ComponentType.Button,
      time: 60000,
    });

    collector.on('collect', async (interaction) => {
      if (interaction.customId === 'accept') {
        await prisma.bet.create({
          data: {
            userId: user.id,
            matchId: fetchedMatch.uniqueId,
            amount: amount,
            odds: odds,
            betOn: betOn,
          },
        });

        await prisma.user.update({
          where: { id: user.id },
          data: { balance: { decrement: amount } },
        });

        const updatedEmbed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle(
            '<:Weird:1243163283234492507> CwelBet - Zakład zaakceptowany'
          )
          .setDescription(
            `Pomyślnie obstawiłeś mecz **${fetchedMatch.team1} vs ${fetchedMatch.team2}**.`
          )
          .addFields({
            name: 'Podsumowanie:',
            value: `**${amount}** szekli na **${teamName}** po kursie **${odds}**`,
            inline: false,
          })
          .setTimestamp();

        await interaction.update({
          embeds: [updatedEmbed],
          components: [],
        });
      } else if (interaction.customId === 'decline') {
        const updatedEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('<:Weird:1243163283234492507> CwelBet - Zakład odrzucony')
          .setDescription(
            `Zakład na mecz **${fetchedMatch.team1} vs ${fetchedMatch.team2}** został odrzucony.`
          )
          .setTimestamp();

        await interaction.update({
          embeds: [updatedEmbed],
          components: [],
        });
      }
      collector.stop();
    });

    collector.on('end', (collected) => {
      if (collected.size === 0) {
        const timeoutEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('<:Weird:1243163283234492507> CwelBet - Czas upłynął')
          .setDescription(
            `Upłynął czas na potwierdzenie zakładu na mecz **${fetchedMatch.team1} vs ${fetchedMatch.team2}**. Zakład został anulowany.`
          )
          .setTimestamp();

        betMessage.edit({
          embeds: [timeoutEmbed],
          components: [],
        });
      }
    });
  } catch (err) {
    console.log(err);
    message.reply(
      'Wystąpił błąd podczas obstawiania meczu. Spróbuj ponownie później.'
    );
  }
};
