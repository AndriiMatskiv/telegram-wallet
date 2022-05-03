import { Knex } from 'knex';
import TelegramBot from 'node-telegram-bot-api';
import UserRepository from './repositories/db/UserRepository';
import LocalStoreService from './repositories/LocalStoreService';
import AccountService from './services/AccountService';
import AuthService from './services/AuthService';

export const Factory = (bot: TelegramBot, client: Knex) => {
  LocalStoreService.init(bot);  
  UserRepository.init(client);
  AuthService.init(bot); 
  AccountService.init(bot)
};
