/**
 * Minimal Telegram Bot API client.
 * Created per-request (Workers have no persistent module state between requests),
 * using the bot token pulled from env.
 */
export class Telegram {
  constructor(token) {
    if (!token) throw new Error('Telegram: missing bot token');
    this.token = token;
    this.base = `https://api.telegram.org/bot${token}`;
  }

  async call(method, payload = {}) {
    const res = await fetch(`${this.base}/${method}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!data.ok) {
      throw new Error(`Telegram API error [${method}]: ${data.description || res.status}`);
    }
    return data.result;
  }

  sendMessage(chatId, text, extra = {}) {
    return this.call('sendMessage', { chat_id: chatId, text, ...extra });
  }

  sendPhoto(chatId, photo, extra = {}) {
    return this.call('sendPhoto', { chat_id: chatId, photo, ...extra });
  }

  editMessageText(chatId, messageId, text, extra = {}) {
    return this.call('editMessageText', { chat_id: chatId, message_id: messageId, text, ...extra });
  }

  answerCallbackQuery(callbackQueryId, extra = {}) {
    return this.call('answerCallbackQuery', { callback_query_id: callbackQueryId, ...extra });
  }

  deleteMessage(chatId, messageId) {
    return this.call('deleteMessage', { chat_id: chatId, message_id: messageId });
  }

  setWebhook(url, extra = {}) {
    return this.call('setWebhook', { url, ...extra });
  }

  deleteWebhook(extra = {}) {
    return this.call('deleteWebhook', extra);
  }

  getWebhookInfo() {
    return this.call('getWebhookInfo');
  }
}
