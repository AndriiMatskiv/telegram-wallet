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
  'eth_send_1': (msg) => WalletService.sendEthAction(msg, 1),
  'eth_send_2': (msg) => WalletService.sendEthAction(msg, 2),
  'eth_send_3': (msg) => WalletService.sendEthAction(msg, 3),
  'asset_send_1': (msg) => WalletService.sendAssetAction(msg, 1),
  'asset_send_2': (msg) => WalletService.sendAssetAction(msg, 2),
  'asset_send_3': (msg) => WalletService.sendAssetAction(msg, 3),
  'asset_send_4': (msg) => WalletService.sendAssetAction(msg, 4),
  'stake_1': (msg) => IntergrationService.stakeAssetAction(msg, 1),
  'stake_2': (msg) => IntergrationService.stakeAssetAction(msg, 2),
  'stake_3': (msg) => IntergrationService.stakeAssetAction(msg, 3),
  'unstake_1': (msg) => IntergrationService.unstakeAssetAction(msg, 1),
  'unstake_2': (msg) => IntergrationService.unstakeAssetAction(msg, 2),
  'unstake_3': (msg) => IntergrationService.unstakeAssetAction(msg, 3),
  'approve_asset_1': (msg) => WalletService.approveAssetAction(msg, 1),
  'approve_asset_2': (msg) => WalletService.approveAssetAction(msg, 2),
  'tx_info': WalletService.getTransactionInfoActoin,
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

  bot.onText(/\/send-eth/, WalletService.sendEth);
  bot.onText(/\/send-asset/, WalletService.sendAsset);
  bot.onText(/\/approve/, WalletService.approveAsset);
  bot.onText(/\/transactions/, WalletService.getTransactions);
  bot.onText(/\/transaction-info/, WalletService.getTransactionInfo);

  bot.onText(/\/assets/, AssetService.getAssets)

  bot.onText(/\/staking-pools/, IntergrationService.getPoolInfos);
  bot.onText(/\/my-staking-info/, IntergrationService.getMyInfo);
  bot.onText(/\/stake/, IntergrationService.stakeAsset);
  bot.onText(/\/unstake/, IntergrationService.unstakeAsset);
}
