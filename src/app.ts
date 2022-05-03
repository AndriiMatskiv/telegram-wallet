import * as Sentry from '@sentry/node';
import { Knex } from 'knex';
import { connect } from './repositories/db/connection';
import TelegramBot  from 'node-telegram-bot-api';
import { botMain } from './main';
import { Factory } from './factory';

const main = async (): Promise<void> => {
  require('dotenv').config();
  let knexClient: Knex;
  try {
    Sentry.init({ dsn: process.env.SENTRY_URL });
    knexClient = connect();

    const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

    Factory(bot, knexClient);
    await botMain(bot, knexClient);

    console.log("Launched!");
  } catch (e) {
    Sentry.captureException(e);
    if (knexClient) await knexClient.destroy();
  } 
};

main();
