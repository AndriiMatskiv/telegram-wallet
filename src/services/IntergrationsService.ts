import TelegramBot from "node-telegram-bot-api";
import LocalStoreService from "../repositories/LocalStoreService";
import RuntimeStore from "../repositories/RuntimeStore";
import { PoolInfo, PoolPersonalInfo, TokenInfo } from "../types";
import { cutAddress, round } from "../utills/formatter";
import { generateMarkup, getIds, RemoveButtons } from "../utills/helpers";
import { Networks } from "../utills/network";
import StakingHelper from "../utills/staking";
import Web3Helper from "../utills/web3";
import AuthService from "./AuthService";

export default class IntergrationService {
  private static bot: TelegramBot;

  public static init(bot: TelegramBot) {
    IntergrationService.bot = bot;
  }

  public static async stakeAssetAction(msg: TelegramBot.Message, step: number): Promise<void> {
    const { userId, chatId, msgId } = getIds(msg);
    const store = await LocalStoreService.getStore(userId, chatId);
    const network = Networks[store.currentNetworkId];
    const account = store.accounts.find(account => account.id === store.currentAccountId);

    if (step === 1) {
      const poolsAmount = await StakingHelper.getPoolsAmount(network);
      const id = Number(msg.text);
      if (!id || id > poolsAmount || id < 1) {
        IntergrationService.bot.sendMessage(chatId, 'Invalid pool index, please try again');
        IntergrationService.bot.deleteMessage(chatId, msgId.toString());
      } else {
        RuntimeStore.removeAction(userId);
        const pool = await StakingHelper.getPoolInfo(network, id - 1);
        if (!pool.active) {
          IntergrationService.bot.sendMessage(chatId, 'This pool is no more active, please try later...');
          return;
        }
        const tokenInfo = await Web3Helper.getTokenInfo(network.id, pool.token, account);
        if (tokenInfo.balance === 0) {
          IntergrationService.bot.sendMessage(chatId, `You dont have enough ${tokenInfo.symbol} tokens`);
          return;
        }

        RuntimeStore.setTempData(userId, 'selected_pool', pool);
        RuntimeStore.setTempData(userId, 'selected_pool_token', tokenInfo);
        IntergrationService.bot.sendMessage(chatId, `Please specify ${tokenInfo.symbol} amount to stake`);
        RuntimeStore.setAction(userId, 'stake_2');
      }
    } else if (step === 2) {
      const amount = Number(msg.text);
      const poolToken: TokenInfo = RuntimeStore.getTempData(userId, 'selected_pool_token');
      if (!amount || amount > poolToken.balance || amount < 0) {
        IntergrationService.bot.sendMessage(chatId, `Invalid amount (your balance: ${round(poolToken.balance)}), please try again`);
        IntergrationService.bot.deleteMessage(chatId, msgId.toString());
      } else {
        RuntimeStore.removeAction(userId);
        RuntimeStore.deleteTempData(userId, 'selected_pool_token');
        const buttons = generateMarkup(['Cancel', 'Confirm']);
        const pool: PoolInfo = RuntimeStore.getTempData(userId, 'selected_pool');

        IntergrationService.bot.sendMessage(chatId, `You are going to stake ${amount}${poolToken.symbol} in pool #${pool.id + 1}`, {
          reply_markup: buttons,
        });

        RuntimeStore.setTempData(userId, 'stake_amount', amount);
        RuntimeStore.setAction(userId, 'stake_3');
      }
    } else {
      const pool: PoolInfo = RuntimeStore.getAndDeleteTempData(userId, 'selected_pool');
      const stakeAmount: number = RuntimeStore.getAndDeleteTempData(userId, 'stake_amount');

      if (msg.text === 'Confirm') {
        IntergrationService.bot.sendMessage(chatId, 'Processing...');
        new Promise<void>(async (resolve) => {
          try {
            await StakingHelper.stake(network, account, stakeAmount, pool.id);
            await IntergrationService.bot.sendMessage(chatId, 'Successfully staked');
          } catch(e) {
            await IntergrationService.bot.sendMessage(chatId, `Staking error: ${e}`, RemoveButtons);
          } 
          resolve();
        });
      } else {
        IntergrationService.bot.sendMessage(chatId, 'Ok', RemoveButtons);
        IntergrationService.bot.deleteMessage(chatId, msgId.toString());
      }
      RuntimeStore.removeAction(userId);
    }
  }

  public static async stakeAsset(msg: TelegramBot.Message): Promise<void> {
    if (AuthService.shouldRefersh(msg)) return;

    const { userId, chatId } = getIds(msg);

    IntergrationService.bot.sendMessage(chatId, 'Please specify pool index');
    RuntimeStore.setAction(userId, 'stake_1');
  }

  public static async unstakeAssetAction(msg: TelegramBot.Message, step: number): Promise<void> {
    const { userId, chatId, msgId } = getIds(msg);
    const store = await LocalStoreService.getStore(userId, chatId);
    const network = Networks[store.currentNetworkId];
    const account = store.accounts.find(account => account.id === store.currentAccountId);

    if (step === 1) {
      const poolsAmount = await StakingHelper.getPoolsAmount(network);
      const id = Number(msg.text);
      if (!id || id > poolsAmount || id < 1) {
        IntergrationService.bot.sendMessage(chatId, 'Invalid pool index, please try again');
        IntergrationService.bot.deleteMessage(chatId, msgId.toString());
      } else {
        RuntimeStore.removeAction(userId);
        const pool = await StakingHelper.getPoolInfo(network, id - 1);
        const personalInfo = await StakingHelper.getPersonalInfoByPool(network, account, id - 1);
        if (personalInfo.staked === 0) {
          IntergrationService.bot.sendMessage(chatId, `You dont have staked tokens`);
          return;
        }

        RuntimeStore.setTempData(userId, 'selected_pool', pool);
        RuntimeStore.setTempData(userId, 'pool_personal_info', personalInfo);
        IntergrationService.bot.sendMessage(chatId, `Please specify amount to withdraw`);
        RuntimeStore.setAction(userId, 'unstake_2');
      }
    } else if (step === 2) {
      const amount = Number(msg.text);
      const info: PoolPersonalInfo = RuntimeStore.getTempData(userId, 'pool_personal_info');
      if (!amount || amount > info.staked || amount < 0) {
        IntergrationService.bot.sendMessage(chatId, `Invalid amount (your balance: ${round(info.balance)}), please try again`);
        IntergrationService.bot.deleteMessage(chatId, msgId.toString());
      } else {
        RuntimeStore.removeAction(userId);
        RuntimeStore.deleteTempData(userId, 'pool_personal_info');
        const buttons = generateMarkup(['Cancel', 'Confirm']);
        const pool: PoolInfo = RuntimeStore.getTempData(userId, 'selected_pool');

        IntergrationService.bot.sendMessage(chatId, `You are going to withdraw ${amount} tokens in pool #${pool.id + 1}`, {
          reply_markup: buttons,
        });

        RuntimeStore.setTempData(userId, 'withdraw_amount', amount);
        RuntimeStore.setAction(userId, 'unstake_3');
      }
    } else {
      const pool: PoolInfo = RuntimeStore.getAndDeleteTempData(userId, 'selected_pool');
      const withdrawAmount: number = RuntimeStore.getAndDeleteTempData(userId, 'withdraw_amount');

      if (msg.text === 'Confirm') {
        IntergrationService.bot.sendMessage(chatId, 'Processing...');
        new Promise<void>(async (resolve) => {
          try {
            await StakingHelper.stake(network, account, withdrawAmount, pool.id);
            await IntergrationService.bot.sendMessage(chatId, 'Successfully withdrawn');
          } catch(e) {
            await IntergrationService.bot.sendMessage(chatId, `Withdrawing error: ${e}`, RemoveButtons);
          } 
          resolve();
        });
      } else {
        IntergrationService.bot.sendMessage(chatId, 'Ok', RemoveButtons);
        IntergrationService.bot.deleteMessage(chatId, msgId.toString());
      }
      RuntimeStore.removeAction(userId);
    }
  }

  public static async unstakeAsset(msg: TelegramBot.Message): Promise<void> {
    if (AuthService.shouldRefersh(msg)) return;

    const { userId, chatId } = getIds(msg);

    IntergrationService.bot.sendMessage(chatId, 'Please specify pool index');
    RuntimeStore.setAction(userId, 'unstake_1');
  }

  public static async getPoolInfos(msg: TelegramBot.Message): Promise<void> {
    if (AuthService.shouldRefersh(msg)) return;

    const { userId, chatId } = getIds(msg);
    const store = await LocalStoreService.getStore(userId, chatId);
    const network = Networks[store.currentNetworkId];

    const infos = await StakingHelper.getAllPoolsInfos(network);

    let txt = 'All Pools\n';

    infos.forEach((info, index) => txt += 
      `Pool #${index + 1}
       Token: ${cutAddress(info.token)}
       Reward rate: ${round(info.rewardRate)}
       Bonus rate: ${round(info.bonusRate)}
       Bonus duration: ${round(info.bonusDuration / 86400, 1)} days
       Active: ${info.active ? 'True' : 'False'}
      \n`
    );

    IntergrationService.bot.sendMessage(chatId, txt);
  }

  public static async getMyInfo(msg: TelegramBot.Message): Promise<void> {
    if (AuthService.shouldRefersh(msg)) return;

    const { userId, chatId } = getIds(msg);
    const store = await LocalStoreService.getStore(userId, chatId);
    const network = Networks[store.currentNetworkId];
    const account = store.accounts.find(account => account.id === store.currentAccountId);

    const info = await StakingHelper.getAllPersonalInfo(network, account);

    let txt = 
    `My Info
     Total staked: ${info.totalStaked}
     Total bonus: ${info.totalBonus}
     Reward balance: ${info.balance}
     Info by pools:
    `;

    info.pools.forEach((info, index) => txt += 
      `Pool #${index + 1}\nReward balance: ${info.balance}\nBonus: ${info.bonus}\nStaked: ${info.staked}\n\n`
    )

    IntergrationService.bot.sendMessage(chatId, txt);
  }
}
