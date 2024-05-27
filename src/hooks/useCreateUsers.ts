import prisma from '../utils/database';
import { client } from '../utils/client';

export const useCreateUsers = async () => {
  const currentTime = new Date();

  const guilds = client.guilds.cache.map((guild) => guild);
  for (const guild of guilds) {
    const members = await guild.members.fetch();
    members.forEach(async (member) => {
      if (!member.user.bot) {
        const discordId = member.user.id;
        const username = member.user.username;

        let user = await prisma.user.findUnique({
          where: { discordId },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              discordId,
              username,
              balance: 1000,
              balanceLastClaimed: currentTime,
            },
          });
          console.log(
            `Created new user in the database: ${username} (${discordId})`
          );
        }
      }
    });
  }
};
