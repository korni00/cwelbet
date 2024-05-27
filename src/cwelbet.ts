import { registerCommands } from './commands/registerCommand';
import { useScraper } from './hooks/useScraper';
import { useCreateUsers } from './hooks/useCreateUsers';
import { client } from './utils/client';

client.once('ready', async () => {
  await useCreateUsers().catch((error) =>
    console.error('Error when adding users', error)
  );
  await useScraper().catch((error) => {
    console.error('Error starting scraper:', error);
  });
  await registerCommands(client).catch((error) => {
    console.error('Error when registering commands', error);
  });
});

client.login(process.env.DISCORD_TOKEN);
