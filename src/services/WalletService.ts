import TelegramBot from "node-telegram-bot-api";
import Web3 from "web3";
import LocalStoreService from "../repositories/LocalStoreService";
import RuntimeStore from "../repositories/RuntimeStore";
import { Asset } from "../types";
import { getPortifolioByChain, getTransactions } from "../utills/apis";
import { cutAddress, round } from "../utills/formatter";
import { generateMarkup, getIds, RemoveButtons } from "../utills/helpers";
import { Networks } from "../utills/network";
import AuthService from "./AuthService";
import Web3Helper from "../utills/web3";

export default class WalletService {
  private static bot: TelegramBot;

  public static init(bot: TelegramBot) {
    WalletService.bot = bot;
  }

  public static async sendEthAction(msg: TelegramBot.Message, step: number): Promise<void> {
    const { userId, chatId, msgId } = getIds(msg);

    const store = await LocalStoreService.getStore(userId, chatId);
    const network = Networks[store.currentNetworkId];
    const account = store.accounts.find(account => account.id === store.currentAccountId);

    if (step === 1) {
      const address = msg.text;
      if (!Web3.utils.isAddress(address)) {
        WalletService.bot.sendMessage(chatId, 'Invalid address, please try again');
        WalletService.bot.deleteMessage(chatId, msgId.toString());
      } else {    
        RuntimeStore.removeAction(userId);
        const balance = await Web3Helper.getBalance(network.id, account);
        WalletService.bot.sendMessage(chatId, `Please specify amount. (Balance: ${round(balance)}${network.currencySymbol})`);
        RuntimeStore.setAction(userId, 'eth_send_2');
        RuntimeStore.setTempData(userId, 'recipient', address)
      }
    } else if (step === 2) {
      let amount = Number(msg.text);

      const balance = await Web3Helper.getBalance(network.id, account);

      if (!amount || amount >= balance) {
        WalletService.bot.sendMessage(chatId, 'Invalid amount, please try again');
        WalletService.bot.deleteMessage(chatId, msgId.toString());
      } else {
        RuntimeStore.removeAction(userId);
        const buttons = generateMarkup(['Cancel', 'Confirm']);
        const recipient = RuntimeStore.getTempData(userId, 'recipient');

        WalletService.bot.sendMessage(chatId, `You are going to send ${amount}${network.currencySymbol} to ${cutAddress(recipient)}`, {
          reply_markup: buttons,
        });

        RuntimeStore.setTempData(userId, 'send_data', {
          recipient,
          amount,
        })

        RuntimeStore.setAction(userId, 'eth_send_3');
      }
    } else {
      if (msg.text === 'Confirm') {
        const { recipient, amount } = RuntimeStore.getTempData(userId, 'send_data');
        WalletService.bot.sendMessage(chatId, 'Sending Eth..', RemoveButtons);
        new Promise<void>(async (resolve) => {
          try {
            await Web3Helper.sendEth(network.id, account, recipient, amount);
            await WalletService.bot.sendMessage(chatId, 'Successfully sent.');
          } catch(e) {
            await WalletService.bot.sendMessage(chatId, `Eth sending error: ${e}`, RemoveButtons);
          } 
          resolve();
        });
      } else {
        WalletService.bot.sendMessage(chatId, 'Ok', RemoveButtons);
        WalletService.bot.deleteMessage(chatId, msgId.toString());
      }
      RuntimeStore.removeAction(userId);
    }
  }

  public static async sendEth(msg: TelegramBot.Message): Promise<void> {
    if (AuthService.shouldRefersh(msg)) return;

    const { userId, chatId } = getIds(msg);
    WalletService.bot.sendMessage(chatId, "Please insert recipient address");
    RuntimeStore.setAction(userId, 'eth_send_1');
  }

  public static async sendAssetAction(msg: TelegramBot.Message, step: number): Promise<void> {
    const { userId, chatId, msgId } = getIds(msg);

    const store = await LocalStoreService.getStore(userId, chatId);
    const network = Networks[store.currentNetworkId];
    const account = store.accounts.find(account => account.id === store.currentAccountId);

    if (step === 1) {
      const btnsTexts: string[] = RuntimeStore.getTempData(userId, 'assets_btns');
      if (!btnsTexts.includes(msg.text)) {
        WalletService.bot.sendMessage(chatId, 'Invalid asset, please try again');
        WalletService.bot.deleteMessage(chatId, msgId.toString());
      } else {
        RuntimeStore.deleteTempData(userId, 'assets_btns');
        RuntimeStore.removeAction(userId);

        const assets: Asset[] = RuntimeStore.getAndDeleteTempData(userId, 'assets');
        const asset = assets.find((el) => msg.text.startsWith(el.name));

        WalletService.bot.sendMessage(chatId, `Please specify amount. (Balance: ${round(asset.balance)}${network.currencySymbol})`, RemoveButtons);
        RuntimeStore.setAction(userId, 'asset_send_2');
        RuntimeStore.setTempData(userId, 'selected_asset', asset);
      }
    } else if (step === 2) {
      let amount = Number(msg.text);

      const selectedAsset = RuntimeStore.getTempData(userId, 'selected_asset');

      if (!amount || amount >= selectedAsset.balance) {
        WalletService.bot.sendMessage(chatId, 'Invalid amount, please try again');
        WalletService.bot.deleteMessage(chatId, msgId.toString());
      } else {
        RuntimeStore.removeAction(userId);
        RuntimeStore.setTempData(userId, 'asset_send_amount', amount);
        WalletService.bot.sendMessage(chatId, "Please insert recipient address");
        RuntimeStore.setAction(userId, 'asset_send_3');
      }
    } else if (step === 3) {
      const address = msg.text;
      if (!Web3.utils.isAddress(address)) {
        WalletService.bot.sendMessage(chatId, 'Invalid address, please try again');
        WalletService.bot.deleteMessage(chatId, msgId.toString());
      } else {
        RuntimeStore.removeAction(userId);
        const buttons = generateMarkup(['Cancel', 'Confirm']);
        const selectedAsset: Asset = RuntimeStore.getTempData(userId, 'selected_asset');
        const amount = RuntimeStore.getTempData(userId, 'asset_send_amount');

        WalletService.bot.sendMessage(chatId, `You are going to send ${amount}${selectedAsset.symbol} to ${cutAddress(address)}`, {
          reply_markup: buttons,
        });

        RuntimeStore.setTempData(userId, 'asset_send_address', address);
        RuntimeStore.setAction(userId, 'asset_send_4');
      }
    } else {
      const selectedAsset: Asset = RuntimeStore.getAndDeleteTempData(userId, 'selected_asset');
      const amount: number = RuntimeStore.getAndDeleteTempData(userId, 'asset_send_amount');
      const recipient: string = RuntimeStore.getAndDeleteTempData(userId, 'asset_send_address');

      if (msg.text === 'Confirm') {
        WalletService.bot.sendMessage(chatId, `Sending ${selectedAsset.name}...`, RemoveButtons);
        new Promise<void>(async (resolve) => {
          try {
            await Web3Helper.sendAsset(network.id, selectedAsset, recipient, amount, account);
            await WalletService.bot.sendMessage(chatId, 'Successfully sent.');
          } catch(e) {
            await WalletService.bot.sendMessage(chatId, `Eth sending error: ${e}`, RemoveButtons);
          } 
          resolve();
        });
      } else {
        WalletService.bot.sendMessage(chatId, 'Ok', RemoveButtons);
        WalletService.bot.deleteMessage(chatId, msgId.toString());
      }
      RuntimeStore.removeAction(userId);
    }
  }

  public static async sendAsset(msg: TelegramBot.Message): Promise<void> {
    if (AuthService.shouldRefersh(msg)) return;

    const { userId, chatId } = getIds(msg);
    const store = await LocalStoreService.getStore(userId, chatId);
    const network = Networks[store.currentNetworkId];
    const currAddress = store.accounts.find(account => account.id === store.currentAccountId).address;

    const assets = await getPortifolioByChain(currAddress, network);

    const texts = assets.map((asset) => `${asset.name}(${asset.symbol}) ≈ $${round(asset.balance * asset.price, 1)}\n`);
    const buttons = generateMarkup(texts);

    RuntimeStore.setTempData(userId, 'assets', assets);
    RuntimeStore.setTempData(userId, 'assets_btns', texts);

    WalletService.bot.sendMessage(chatId, "Please select asset address", {
      reply_markup: buttons,
    });
    RuntimeStore.setAction(userId, 'asset_send_1');
  }

  public static async getTransactions(msg: TelegramBot.Message): Promise<void> {
    if (AuthService.shouldRefersh(msg)) return;

    const { userId, chatId } = getIds(msg);
    const store = await LocalStoreService.getStore(userId, chatId);
    const network = Networks[store.currentNetworkId];
    const currAddress = store.accounts.find(account => account.id === store.currentAccountId).address;

    const transactions = await getTransactions(currAddress, network);
    const texts = transactions.map((tx) => `Hash: ${tx.hash} From: ${cutAddress(tx.from)} To ${cutAddress(tx.to)} At Block: ${tx.blockNumber}`);
    const text = `Transactions (total: ${transactions.length})\n` + texts.join('\n');
    WalletService.bot.sendMessage(chatId, text);
  }

  public static async getTransactionInfoActoin(msg: TelegramBot.Message): Promise<void> {
    const { userId, msgId, chatId } = getIds(msg);
    const store = await LocalStoreService.getStore(userId, chatId);
    const network = Networks[store.currentNetworkId];
    const hash = msg.text;

    if (!/^0x([A-Fa-f0-9]{64})$/.test(hash)) {
      WalletService.bot.sendMessage(chatId, 'Invalid tx hash, please try again');
      WalletService.bot.deleteMessage(chatId, msgId.toString());
    } else {
      const info = await Web3Helper.getTxInfo(hash, network.id);
      let txt = 'Transaction Info\n';
      Object.keys(info).forEach((key) => {
        txt += `${key.toLocaleUpperCase()}: ${(info as any)[key].toString()}`;
      });
      WalletService.bot.sendMessage(chatId, txt);
      RuntimeStore.removeAction(userId);
    }
  }

  public static async getTransactionInfo(msg: TelegramBot.Message): Promise<void> {
    if (AuthService.shouldRefersh(msg)) return;

    const { userId, chatId } = getIds(msg);
    WalletService.bot.sendMessage(chatId, "Please insert transaction hash");
    RuntimeStore.setAction(userId, 'tx_info');
  }


  public static async approveAssetAction(msg: TelegramBot.Message, step: number): Promise<void> {
    const { userId, chatId, msgId } = getIds(msg);
    const store = await LocalStoreService.getStore(userId, chatId);
    const network = Networks[store.currentNetworkId];
    const account = store.accounts.find(account => account.id === store.currentAccountId);

    if (step === 1) {
      let arr;

      if (msg.text.split(',').length == 3) {
        arr = msg.text.split(',');
      } else if (msg.text.split(' ').length == 3) {
        arr = msg.text.split(' ');
      } else {
        WalletService.bot.sendMessage(chatId, 'Invalid parameters, please try again');
        WalletService.bot.deleteMessage(chatId, msgId.toString());
      }

      const token = arr[0].trim();
      const spender = arr[1].trim();
      const amount = Number(arr[2].trim());
      
      RuntimeStore.removeAction(userId);
      const buttons = generateMarkup(['Cancel', 'Confirm']);

      const tokenInfo = await Web3Helper.getTokenInfo(network.id, token, account);

      WalletService.bot.sendMessage(chatId, `You are going to approve ${amount} ${tokenInfo.name} to ${cutAddress(spender)}`, {
        reply_markup: buttons,
      });

      RuntimeStore.setTempData(userId, 'approve_data', { token, spender, amount });
      RuntimeStore.setAction(userId, 'approve_asset_2');
    } else {
      if (msg.text === 'Confirm') {
        WalletService.bot.sendMessage(chatId, `Approving...`, RemoveButtons);
        const  { token, spender, amount } =  RuntimeStore.getAndDeleteTempData(userId, 'approve_data');

        new Promise<void>(async (resolve) => {
          try {
            await Web3Helper.approveAsset(network.id, token, spender, amount, account);
            await WalletService.bot.sendMessage(chatId, 'Successfully approved.');
          } catch(e) {
            await WalletService.bot.sendMessage(chatId, `Eth sending error: ${e}`, RemoveButtons);
          } 
          resolve();
        });
      } else {
        WalletService.bot.sendMessage(chatId, 'Ok', RemoveButtons);
        WalletService.bot.deleteMessage(chatId, msgId.toString());
      }
      RuntimeStore.removeAction(userId);
    }
  }

  public static async approveAsset(msg: TelegramBot.Message): Promise<void> {
    if (AuthService.shouldRefersh(msg)) return;

    const { userId, chatId } = getIds(msg);
    WalletService.bot.sendMessage(chatId, "Please select asset address, spender address and amount");
    RuntimeStore.setAction(userId, 'approve_asset_1');
  }
}
