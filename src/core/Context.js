/**
 * Context wraps a single Telegram Update plus everything a handler needs:
 * env bindings, the Telegram client, route params, and a `state` bag that
 * middleware/guards can use to pass data down the chain (e.g. an auth'd user).
 */
export class Context {
  constructor({ update, env, executionCtx, telegram, request = null }) {
    this.update = update;
    this.env = env;
    this.executionCtx = executionCtx;
    this.telegram = telegram;
    this.request = request;

    // Filled in by the router once a route is matched.
    this.route = null;      // matched route definition
    this.params = {};       // named/positional captures (e.g. command args, regex groups)
    this.state = {};         // free-form bag for middleware/guards

    this._handled = false;
  }

  // ---- Update shape helpers -------------------------------------------------

  get message() {
    return this.update.message || this.update.edited_message || null;
  }

  get callbackQuery() {
    return this.update.callback_query || null;
  }

  get chat() {
    return this.message?.chat || this.callbackQuery?.message?.chat || null;
  }

  get from() {
    return this.message?.from || this.callbackQuery?.from || null;
  }

  get text() {
    return this.message?.text || '';
  }

  /** True once some handler has produced a response, so the router can stop. */
  get handled() {
    return this._handled;
  }

  // ---- Reply helpers ----------------------------------------------------

  reply(text, extra = {}) {
    this._handled = true;
    return this.telegram.sendMessage(this.chat.id, text, extra);
  }

  replyHtml(text, extra = {}) {
    return this.reply(text, { parse_mode: 'HTML', ...extra });
  }

  replyMarkdown(text, extra = {}) {
    return this.reply(text, { parse_mode: 'MarkdownV2', ...extra });
  }

  answerCallback(text = '', extra = {}) {
    this._handled = true;
    if (!this.callbackQuery) return Promise.resolve();
    return this.telegram.answerCallbackQuery(this.callbackQuery.id, { text, ...extra });
  }

  editMessageText(text, extra = {}) {
    const messageId = this.callbackQuery?.message?.message_id || this.message?.message_id;
    return this.telegram.editMessageText(this.chat.id, messageId, text, extra);
  }
}
