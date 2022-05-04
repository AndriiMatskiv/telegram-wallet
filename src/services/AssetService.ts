import TelegramBot from "node-telegram-bot-api";

export default class AssetService {
  private static bot: TelegramBot;

  public static init(bot: TelegramBot) {
    AssetService.bot = bot;
  }

  public static async getAssets(msg: TelegramBot.Message): Promise<void> {}
  
  public static async addAsset(msg: TelegramBot.Message): Promise<void> {}

  public static async forgetAsset(msg: TelegramBot.Message): Promise<void> {}
}
