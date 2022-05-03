import { Knex } from 'knex';
import TelegramBot from 'node-telegram-bot-api';
import Web3 from 'web3';
import UserRepository from './repositories/db/UserRepository';
import LocalStoreService from './repositories/LocalStoreService';
import RuntimeStore from './repositories/RuntimeStore';
import AccountService from './services/AccountService';
import AuthService from './services/AuthService';
import { Web3Service } from './services/Web3Service';
import { Account, ActionTypes } from './types';
import { helpCommansText } from './utills/commads-doc';
import { cutAddress, getNewAccountId } from './utills/formatter';
import { generateMarkup, getIds } from './utills/helpers';
import { Networks } from './utills/network';

const ActionsMap: Record<ActionTypes, (msg: TelegramBot.Message) => Promise<void>> = {
  'password_input': AuthService.validatePassword,
  'password_setup': AuthService.setPassword,
  'account_import': AccountService.importAccount,
  'current_account_set': AccountService.setCurrentAccount,
  'current_network_set': AccountService.setCurrentNetwork,
}

export const botMain = async (bot: TelegramBot, client: Knex): Promise<void> => {
  bot.on('message', async (msg) => {
    const action = RuntimeStore.getAction(msg.from.id);
    if (action) await ActionsMap[action](msg);
  });

  bot.onText(/\/start/, async (msg) => {
    const { userId, chatId } = getIds(msg);
    const user = await UserRepository.getByTId(userId);
    
    if (!user) {
      bot.sendMessage(chatId, "Hello There! Let's create account.");
      bot.sendMessage(chatId, "Please set local password, it should be 16 characters.", { });
      RuntimeStore.setAction(userId, 'password_setup');
    } else {
      bot.sendMessage(chatId, 'Hello There! Please login.');
      RuntimeStore.setAction(userId, 'password_input');
    }
  });
  
  bot.onText(/\/help/, (msg) => bot.sendMessage(msg.chat.id, helpCommansText));
  
  bot.onText(/\/test/, async (msg) => {
    if (AuthService.shouldRefersh(msg)) return;

    const { userId, chatId } = getIds(msg);
    const store = await LocalStoreService.getStore(userId, chatId);
    console.log(store);
  });
  
  bot.onText(/\/my-accounts/, async (msg) => {
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

    bot.sendMessage(chatId, txt);
  });

  bot.onText(/\/set-current-account/, async (msg) => {
    if (AuthService.shouldRefersh(msg)) return;

    const { userId, chatId } = getIds(msg);
    const store = await LocalStoreService.getStore(userId, chatId);
    const accounts = store.accounts;

    const texts = accounts.map((account) => `${account.name} ${cutAddress(account.address)}`);
    const buttons = generateMarkup(texts);

    bot.sendMessage(chatId, 'Please choose account', {
      reply_markup: buttons,
    });

    RuntimeStore.setAction(userId, 'current_account_set');
  });
 
  bot.onText(/\/set-current-network/, async (msg) => {
    if (AuthService.shouldRefersh(msg)) return;

    const { userId, chatId } = getIds(msg);
    const networks = Object.values(Networks);
    
    const texts = networks.map((network) => `${network.id} ${network.name}`);
    const buttons = generateMarkup(texts);

    bot.sendMessage(chatId, 'Please choose network', {
      reply_markup: buttons,
    });

    RuntimeStore.setAction(userId, 'current_network_set');
  });

  bot.onText(/\/create-account/, async (msg) => {
    if (AuthService.shouldRefersh(msg)) return;

    const { userId, chatId } = getIds(msg);
    const store = await LocalStoreService.getStore(userId, chatId);

    const { address, pk } = Web3Service.createAccount(store.currentNetworkId);
    const newId = getNewAccountId(store.accounts);
    const newAccount: Account = { privateKey: pk, id: newId, address, name: `Account ${newId}`, imported: false };
    const newStore = { ...store, currentAccountId: newId, accounts: [...store.accounts, newAccount] };
    
    await LocalStoreService.updateStore(userId, chatId, newStore);
    bot.sendMessage(chatId, `New address: ${address}`);
  });

  bot.onText(/\/export-account/, async (msg) => {
    if (AuthService.shouldRefersh(msg)) return;

    const { userId, chatId } = getIds(msg);

    const store = await LocalStoreService.getStore(userId, chatId);
    const account = store.accounts.find(account => account.id === store.currentAccountId);
    
    bot.sendMessage(chatId, `Private Key: ${account.privateKey}`,);
  });
 
  bot.onText(/\/import-account/, async (msg) => {
    if (AuthService.shouldRefersh(msg)) return;
    
    const { userId, chatId } = getIds(msg);
    bot.sendMessage(chatId, "Please pass private key");
    RuntimeStore.setAction(userId, 'account_import');
  });
};
