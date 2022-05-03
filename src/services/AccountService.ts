import TelegramBot  from 'node-telegram-bot-api';
import { Account } from '../types';
import { getIds, RemoveButtons } from '../utills/helpers';
import LocalStoreService from '../repositories/LocalStoreService';
import RuntimeStore from '../repositories/RuntimeStore';
import { Web3Service } from './Web3Service';
import { getNewAccountId } from '../utills/formatter';


export default class AccountService {
  private static bot: TelegramBot;

  public static init(bot: TelegramBot) {
    AccountService.bot = bot;
  }
  
  public static async importAccount(msg: TelegramBot.Message): Promise<void> {
    const { userId, chatId, msgId } = getIds(msg);

    AccountService.bot.sendMessage(chatId, 'OK', RemoveButtons);
    RuntimeStore.removeAction(userId);
    const store = await LocalStoreService.getStore(userId, chatId);
    const address = await Web3Service.privateKeyToPublic(store.currentNetworkId, msg.text);
    const newId = getNewAccountId(store.accounts);
    const newAccount: Account = { privateKey: msg.text, id: newId, address, name: `Account ${newId}`, imported: true };
    const newStore = { ...store, accounts: [...store.accounts, newAccount] };
    LocalStoreService.updateStore(userId, chatId, newStore);
 
    AccountService.bot.deleteMessage(chatId, msgId.toString());
  }

  public static async setCurrentAccount(msg: TelegramBot.Message): Promise<void> {
    const { userId, chatId, msgId } = getIds(msg);
    const store = await LocalStoreService.getStore(userId, chatId);
    
    const id = Number(msg.text.split(' ')[1]);

    if (!!id) {
      RuntimeStore.removeAction(userId);
      AccountService.bot.sendMessage(chatId, 'OK', RemoveButtons);
      const newStore = { ...store, currentAccountId: id };
      LocalStoreService.updateStore(userId, chatId, newStore);
    } else {
      AccountService.bot.sendMessage(chatId, 'Please try again');
      AccountService.bot.deleteMessage(chatId, msgId.toString());
    }
  }

  public static async setCurrentNetwork(msg: TelegramBot.Message): Promise<void> {
    const { userId, chatId, msgId } = getIds(msg);
    const store = await LocalStoreService.getStore(userId, chatId);

    const networkId = Number(msg.text.split(' ')[0]);
    
    if (networkId > 0) {
      RuntimeStore.removeAction(userId);
      AccountService.bot.sendMessage(chatId, 'OK', RemoveButtons);
      const newStore = { ...store, currentNetworkId: networkId };
      LocalStoreService.updateStore(userId, chatId, newStore);
    } else {
      AccountService.bot.sendMessage(chatId, 'Please try again');
      AccountService.bot.deleteMessage(chatId, msgId.toString());
    }
  }
}
