import TelegramBot from 'node-telegram-bot-api';

export const RemoveButtons = { reply_markup: { remove_keyboard: true }};

export const generateMarkup = (buttonsText: string[]) => {
  return {
    remove_keyboard: false,
    keyboard: buttonsText.map((text) => [{ text }]),
    callback_data: '4',
  }
}

export const getIds = (msg: TelegramBot.Message) => ({ userId: msg.from.id, chatId: msg.chat.id, msgId: msg.message_id });
