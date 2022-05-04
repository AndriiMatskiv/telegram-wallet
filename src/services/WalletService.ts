import TelegramBot from "node-telegram-bot-api";

export default class WalletService {
  private static bot: TelegramBot;

  public static init(bot: TelegramBot) {
    WalletService.bot = bot;
  }

  public static async sendEth(msg: TelegramBot.Message): Promise<void> {}

  public static async sendAsset(msg: TelegramBot.Message): Promise<void> {}

  public static async getTransactions(msg: TelegramBot.Message): Promise<void> {}

  public static async getTransactionInfo(msg: TelegramBot.Message): Promise<void> {}
}
