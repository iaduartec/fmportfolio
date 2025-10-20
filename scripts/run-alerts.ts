import cron from 'node-cron';
import { evaluateAlerts } from '../lib/alerts';
import { runMigrations } from '../lib/db';

async function bootstrap() {
  await runMigrations();
  console.log('Scheduler iniciado.');
  cron.schedule('* * * * *', async () => {
    await evaluateAlerts();
  });
}

bootstrap().catch((error) => {
  console.error('Error en scheduler', error);
  process.exit(1);
});
