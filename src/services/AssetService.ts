import TelegramBot from "node-telegram-bot-api";
import LocalStoreService from "../repositories/LocalStoreService";
import { getPortifolioByChain } from "../utills/apis";
import { round } from "../utills/formatter";
import { getIds } from "../utills/helpers";
import { Networks } from "../utills/network";
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
    const currAddress = store.accounts[store.currentAccountId].address;

    const assets = await getPortifolioByChain(currAddress, network);

    let txt = 'Assets\n';

    assets.forEach((asset) => txt += `${asset.name}(${asset.symbol}) ≈ $${round(asset.balance * asset.price, 1)}\n`);

    AssetService.bot.sendMessage(chatId, txt);
  }
}
