/**
 * Fluent builders for Telegram reply_markup payloads, so you don't have to
 * hand-write the { inline_keyboard: [[...]] } arrays yourself.
 *
 *   const kb = InlineKeyboard.make()
 *     .text('👍 Like', 'like:42')
 *     .text('👎 Dislike', 'dislike:42')
 *     .row()
 *     .url('Read more', 'https://example.com');
 *
 *   await ctx.reply('Post title', { reply_markup: kb.build() });
 *   // or: await ctx.reply('Post title', kb.toReplyMarkup());
 */
export class InlineKeyboard {
  constructor() {
    this.rows = [[]];
  }

  static make() {
    return new InlineKeyboard();
  }

  get current() {
    return this.rows[this.rows.length - 1];
  }

  /** Button that fires a callback_query with the given data (max 64 bytes, Telegram's limit). */
  text(text, callbackData) {
    this.current.push({ text, callback_data: callbackData });
    return this;
  }

  /** Button that opens a URL instead of firing a callback_query. */
  url(text, url) {
    this.current.push({ text, url });
    return this;
  }

  /** Button that switches to inline mode in another chat, prefilled with `query`. */
  switchInline(text, query = '') {
    this.current.push({ text, switch_inline_query: query });
    return this;
  }

  /** Start a new row of buttons. */
  row() {
    this.rows.push([]);
    return this;
  }

  build() {
    return { inline_keyboard: this.rows.filter((row) => row.length) };
  }

  toReplyMarkup() {
    return { reply_markup: this.build() };
  }
}

/**
 * Regular (non-inline) reply keyboard — the buttons that replace the user's
 * text input, as opposed to buttons attached to a specific message.
 *
 *   const kb = ReplyKeyboard.make({ oneTime: true })
 *     .text('📍 Share location').row()
 *     .text('Cancel');
 *
 *   await ctx.reply('Choose an option', kb.toReplyMarkup());
 *   // later: await ctx.reply('Done', ReplyKeyboard.remove());
 */
export class ReplyKeyboard {
  constructor(opts = {}) {
    this.rows = [[]];
    this.opts = opts; // { resize, oneTime, selective }
  }

  static make(opts) {
    return new ReplyKeyboard(opts);
  }

  get current() {
    return this.rows[this.rows.length - 1];
  }

  text(text) {
    this.current.push({ text });
    return this;
  }

  requestContact(text) {
    this.current.push({ text, request_contact: true });
    return this;
  }

  requestLocation(text) {
    this.current.push({ text, request_location: true });
    return this;
  }

  row() {
    this.rows.push([]);
    return this;
  }

  build() {
    return {
      keyboard: this.rows.filter((row) => row.length),
      resize_keyboard: this.opts.resize ?? true,
      one_time_keyboard: this.opts.oneTime ?? false,
      selective: this.opts.selective ?? false,
    };
  }

  toReplyMarkup() {
    return { reply_markup: this.build() };
  }

  static remove() {
    return { reply_markup: { remove_keyboard: true } };
  }
}
