import { Knex } from 'knex';
import { Telegraf } from 'telegraf';

export const botMain = async (bot: Telegraf, client: Knex): Promise<void> => {
  bot.command("start", (ctx) => {
    bot.telegram.sendMessage(ctx.chat.id, 'Hello There!');
  });

  return;
};
