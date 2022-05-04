import UserRepository from '../repositories/db/UserRepository';
import TelegramBot  from 'node-telegram-bot-api';
import RuntimeStore from '../repositories/RuntimeStore';
import { checkUserPassword, hashPassword } from '../utills/hash';
import { getIds } from '../utills/helpers';

export default class AuthService {
  private static bot: TelegramBot;

  public static init(bot: TelegramBot) {
    AuthService.bot = bot;
  }

  public static shouldRefersh(msg: TelegramBot.Message): boolean {
    const { userId, chatId } = getIds(msg);

    const shouldRefresh = RuntimeStore.shouldRefresh(userId);
    if (shouldRefresh) {
      AuthService.bot.sendMessage(chatId, 'Please login.');
      RuntimeStore.setAction(userId, 'password_input');
    }
    return shouldRefresh;
  }

  public static async validatePasswordAction(msg: TelegramBot.Message): Promise<void> {
    const { userId, chatId, msgId } = getIds(msg);

    const user = await UserRepository.getByTId(userId);
    const valid = await checkUserPassword(msg.text, user.password);
    await AuthService.bot.deleteMessage(chatId, msgId.toString());
    if (!valid) {
      await AuthService.bot.sendMessage(chatId, 'Invalid password, please try again...');
    } else {
      await AuthService.bot.sendMessage(chatId, 'Success Logined!');
      RuntimeStore.setStore(userId, msg.text, user.storageMessageId);
      RuntimeStore.removeAction(userId);
    }
  }

  public static async setPasswordAction(msg: TelegramBot.Message): Promise<void> {
    const { userId, chatId, msgId } = getIds(msg);
    await AuthService.bot.deleteMessage(chatId, msgId.toString());
    if (msg.text.length != 16) {
      await AuthService.bot.sendMessage(chatId, 'Invalid password length');
      return;
    }
    await AuthService.bot.sendMessage(chatId, 'Cool!');
    const storeMsg = await AuthService.bot.sendMessage(chatId, '==== STORAGE DATA. DO NOT DELETE! ====');
    await AuthService.bot.sendMessage(chatId, 'This is your encrypted storage, if you delete it, you will loose all accounts!\n');
    RuntimeStore.removeAction(userId);
    RuntimeStore.setStore(userId, msg.text, storeMsg.message_id);
    await UserRepository.create(userId, await hashPassword(msg.text), storeMsg.message_id);
  }

  public static async startup(msg: TelegramBot.Message): Promise<void> {
    const { userId, chatId } = getIds(msg);
    const user = await UserRepository.getByTId(userId);
    
    if (!user) {
      AuthService.bot.sendMessage(chatId, "Hello There! Let's create account.");
      AuthService.bot.sendMessage(chatId, "Please set local password, it should be 16 characters.", { });
      RuntimeStore.setAction(userId, 'password_setup');
    } else {
      AuthService.bot.sendMessage(chatId, 'Hello There! Please login.');
      RuntimeStore.setAction(userId, 'password_input');
    }
  }
}
