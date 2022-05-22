import TelegramBot from "node-telegram-bot-api";
import LocalStoreService from "../repositories/LocalStoreService";
import { getPortifolioByChain } from "../utills/apis";
import { round } from "../utills/formatter";
import { getIds } from "../utills/helpers";
import { Networks } from "../utills/network";
import Web3Helper from "../utills/web3";
import AuthService from "./AuthService";

export default class AssetService {
  private static bot: TelegramBot;

  public static init(bot: TelegramBot) {
    AssetService.bot = bot;
  }

  public static async getAssets(msg: TelegramBot.Message): Promise<void> {
    if (AuthService.shouldRefersh(msg)) return;

    const { userId, chatId } = getIds(msg);
    const store = await LocalStoreService.getStore(userId, chatId);
    const network = Networks[store.currentNetworkId];
    const account = store.accounts.find(account => account.id === store.currentAccountId);

    const assets = await getPortifolioByChain(account.address, network);

    const foundTwt = assets.find((asset) => asset.address === network.tokenAddress);
    if (!foundTwt) {
      assets.push({
        address: network.tokenAddress,
        symbol: 'TWT',
        decimals: 18,
        name: 'TW Token',
        balance: await Web3Helper.getAssstBalance(network.id, network.tokenAddress, account),
        price: 0,
      });
    }

    let txt = 'Assets\n\n';

    assets.forEach((asset) => txt += `${asset.name}(${asset.symbol}): ${round(asset.balance, 0)} ≈ $${round(asset.balance * asset.price, 1)}\n`);

    AssetService.bot.sendMessage(chatId, txt);
  }
}
