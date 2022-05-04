import { Knex } from 'knex';
import TelegramBot from 'node-telegram-bot-api';
import LocalStoreService from './repositories/LocalStoreService';
import RuntimeStore from './repositories/RuntimeStore';
import AccountService from './services/AccountService';
import AssetService from './services/AssetService';
import AuthService from './services/AuthService';
import IntergrationService from './services/IntergrationsService';
import WalletService from './services/WalletService';
import { ActionTypes } from './types';
import { helpCommansText } from './utills/commads-doc';
import { getIds } from './utills/helpers';

const ActionsMap: Record<ActionTypes, (msg: TelegramBot.Message) => Promise<void>> = {
  'password_input': AuthService.validatePasswordAction,
  'password_setup': AuthService.setPasswordAction,
  'account_import': AccountService.importAccountAction,
  'current_account_set': AccountService.setCurrentAccountAction,
  'current_network_set': AccountService.setCurrentNetworkAction,
}

export const botMain = async (bot: TelegramBot, client: Knex): Promise<void> => {
  bot.on('message', async (msg) => {
    const action = RuntimeStore.getAction(msg.from.id);
    if (action) await ActionsMap[action](msg);
  });

  bot.onText(/\/help/, (msg) => bot.sendMessage(msg.chat.id, helpCommansText));
  
  bot.onText(/\/test/, async (msg) => {
    if (AuthService.shouldRefersh(msg)) return;

    const { userId, chatId } = getIds(msg);
    const store = await LocalStoreService.getStore(userId, chatId);
    console.log(store);
  });

  bot.onText(/\/start/, AuthService.startup);

  bot.onText(/\/my-accounts/, AccountService.getMyAccounts);
  bot.onText(/\/set-current-account/, AccountService.setCurrentAccount);
  bot.onText(/\/set-current-network/, AccountService.setCurrentNetwork);
  bot.onText(/\/create-account/, AccountService.createAccount);
  bot.onText(/\/export-account/, AccountService.exportAccount);
  bot.onText(/\/import-account/, AccountService.importAccount);

  //TODO implement
  bot.onText(/\/stake-asset/, IntergrationService.stakeAsset);
  bot.onText(/\/unstake-asset/, IntergrationService.unstakeAsset);
  bot.onText(/\/get-staked-reward/, IntergrationService.getReward);
  bot.onText(/\/stake-lp/, IntergrationService.stakeLP);
  bot.onText(/\/unstake-lp/, IntergrationService.unstakeLp);
  bot.onText(/\/get-lp-reward/, IntergrationService.getLpReward);
  bot.onText(/\/swap/, IntergrationService.swap);
  bot.onText(/\/bridge/, IntergrationService.bridge);

  bot.onText(/\/send-eth/, WalletService.sendEth);
  bot.onText(/\/send-asset/, WalletService.sendAsset);
  bot.onText(/\/transactions/, WalletService.getTransactions);
  bot.onText(/\/transaction-info/, WalletService.getTransactionInfo);

  bot.onText(/\/assets/, AssetService.getAssets);
  bot.onText(/\/add-asset/, AssetService.addAsset);
  bot.onText(/\/forget-asset/, AssetService.forgetAsset);
};
