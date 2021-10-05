import * as Sentry from '@sentry/node';
import { Knex } from 'knex';
import { connect } from './db/connection';
import { Telegraf } from 'telegraf';
import { botMain } from './bot/main';

const main = async (): Promise<void> => {
  require('dotenv').config();
  let knexClient: Knex;
  try {
    Sentry.init({ dsn: process.env.SENTRY_URL });
    knexClient = connect();
    const bot = new Telegraf(process.env.BOT_TOKEN);

    await botMain(bot, knexClient);

    bot.launch();

    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));

    console.log("Launched!");
  } catch (e) {
    Sentry.captureException(e);
  } finally {
    if (knexClient) await knexClient.destroy();
  }
};

main();
