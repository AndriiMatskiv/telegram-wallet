import TelegramBot from 'node-telegram-bot-api';
import { Account } from '../types';
import RuntimeStore from './RuntimeStore';
import crypto from 'crypto'; 

export interface LocalStore {
  accounts: Account[];
  currentAccountId?: number;
  currentNetworkId: number;
}

export default class LocalStoreService {
  private static bot: TelegramBot;

  public static init(bot: TelegramBot) {
    LocalStoreService.bot = bot;
  }

  public static async getStore(id: number, chatId: number): Promise<LocalStore> {
    const store = RuntimeStore.getStore(id);

    const message = await LocalStoreService.bot.editMessageReplyMarkup(
      { inline_keyboard: [[{ text: "Google", url: 'https://www.google.com'}]] }, {
      chat_id: chatId,
      message_id: store.msgId,
    }) as TelegramBot.Message;
    // ISSUE: no method getMessage so we do this trick
    await LocalStoreService.bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: store.msgId });

    const lines = message.text.split('\n');
    if (lines.length == 1) return null;

    const decipher = crypto.createDecipheriv(process.env.SECURITY_ALGORITHM, process.env.SECURITY_KEY, store.password);
    const decrypted = decipher.update(lines[1], "hex", "utf-8") + decipher.final("utf8");
  
    return JSON.parse(decrypted);
  }

  public static async updateStore(id: number, chatId: number, data: LocalStore): Promise<void> {
    const store = RuntimeStore.getStore(id);
    const cipher = crypto.createCipheriv(process.env.SECURITY_ALGORITHM, process.env.SECURITY_KEY, store.password);
    const encryptedString = cipher.update(JSON.stringify(data), "utf-8", "hex") + cipher.final("hex");
    const msg = `==== STORAGE DATA. DO NOT DELETE! ====\n${encryptedString}`;
    // ISSUE: actually work, but throws error 400. TODO: add/find issue on github
    try {
      await LocalStoreService.bot.editMessageText(msg, { 
        chat_id: chatId,
        message_id: store.msgId,
      });
    } finally {}
  }
}
