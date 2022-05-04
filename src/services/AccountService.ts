import TelegramBot  from 'node-telegram-bot-api';
import { Account } from '../types';
import { generateMarkup, getIds, RemoveButtons } from '../utills/helpers';
import LocalStoreService from '../repositories/LocalStoreService';
import RuntimeStore from '../repositories/RuntimeStore';
import { Web3Service } from './Web3Service';
import { cutAddress, getNewAccountId } from '../utills/formatter';
import AuthService from './AuthService';
import { Networks } from '../utills/network';
import Web3 from 'web3';


export default class AccountService {
  private static bot: TelegramBot;

  public static init(bot: TelegramBot) {
    AccountService.bot = bot;
  }
  
  public static async importAccountAction(msg: TelegramBot.Message): Promise<void> {
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

  public static async importAccount(msg: TelegramBot.Message): Promise<void> {
    if (AuthService.shouldRefersh(msg)) return;
    
    const { userId, chatId } = getIds(msg);
    AccountService.bot.sendMessage(chatId, "Please pass private key");
    RuntimeStore.setAction(userId, 'account_import');
  }

  public static async exportAccount(msg: TelegramBot.Message): Promise<void> {
    if (AuthService.shouldRefersh(msg)) return;

    const { userId, chatId } = getIds(msg);

    const store = await LocalStoreService.getStore(userId, chatId);
    const account = store.accounts.find(account => account.id === store.currentAccountId);
    
    AccountService.bot.sendMessage(chatId, `Private Key: ${account.privateKey}`,);
  }

  public static async getMyAccounts(msg: TelegramBot.Message): Promise<void> {
    if (AuthService.shouldRefersh(msg)) return;

    const { userId, chatId } = getIds(msg);
    const store = await LocalStoreService.getStore(userId, chatId);

    const accounts = store.accounts;
    const network = Networks[store.currentNetworkId];
    const balances = await Web3Service.getAccountsBalances(store.currentNetworkId, accounts);

    let txt = 'Accounts\n';

    accounts.forEach((account, index) => {
      const s = store.currentAccountId == account.id ? '✓' : '';
      const n = account.name;
      const a = cutAddress(account.address);
      const b = Number(Web3.utils.fromWei(balances[index])).toFixed(3);
      txt += `${s} ${n} ${a}\n${b} ${network.currencySymbol}\n`
    });

    AccountService.bot.sendMessage(chatId, txt);
  }

  public static async createAccount(msg: TelegramBot.Message): Promise<void> {
    if (AuthService.shouldRefersh(msg)) return;

    const { userId, chatId } = getIds(msg);
    const store = await LocalStoreService.getStore(userId, chatId);

    const { address, pk } = Web3Service.createAccount(store.currentNetworkId);
    const newId = getNewAccountId(store.accounts);
    const newAccount: Account = { privateKey: pk, id: newId, address, name: `Account ${newId}`, imported: false };
    const newStore = { ...store, currentAccountId: newId, accounts: [...store.accounts, newAccount] };
    
    await LocalStoreService.updateStore(userId, chatId, newStore);
    AccountService.bot.sendMessage(chatId, `New address: ${address}`);
  }

  public static async setCurrentNetwork(msg: TelegramBot.Message): Promise<void> {
    if (AuthService.shouldRefersh(msg)) return;

    const { userId, chatId } = getIds(msg);
    const networks = Object.values(Networks);
    
    const texts = networks.map((network) => `${network.id} ${network.name}`);
    const buttons = generateMarkup(texts);

    AccountService.bot.sendMessage(chatId, 'Please choose network', {
      reply_markup: buttons,
    });

    RuntimeStore.setAction(userId, 'current_network_set');
  }

  public static async setCurrentAccount(msg: TelegramBot.Message): Promise<void> {
    if (AuthService.shouldRefersh(msg)) return;

    const { userId, chatId } = getIds(msg);
    const store = await LocalStoreService.getStore(userId, chatId);
    const accounts = store.accounts;

    const texts = accounts.map((account) => `${account.name} ${cutAddress(account.address)}`);
    const buttons = generateMarkup(texts);

    AccountService.bot.sendMessage(chatId, 'Please choose account', {
      reply_markup: buttons,
    });

    RuntimeStore.setAction(userId, 'current_account_set');
  }

  public static async setCurrentAccountAction(msg: TelegramBot.Message): Promise<void> {
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

  public static async setCurrentNetworkAction(msg: TelegramBot.Message): Promise<void> {
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
