import TelegramBot from "node-telegram-bot-api";

export default class IntergrationService {
  private static bot: TelegramBot;

  public static init(bot: TelegramBot) {
    IntergrationService.bot = bot;
  }

  public static async stakeAsset(msg: TelegramBot.Message): Promise<void> {}

  public static async unstakeAsset(msg: TelegramBot.Message): Promise<void> {}

  public static async getReward(msg: TelegramBot.Message): Promise<void> {}

  public static async stakeLP(msg: TelegramBot.Message): Promise<void> {}

  public static async unstakeLp(msg: TelegramBot.Message): Promise<void> {}

  public static async getLpReward(msg: TelegramBot.Message): Promise<void> {}

  public static async swap(msg: TelegramBot.Message): Promise<void> {}
}
