/**
 * Relays incoming messages to a fixed list of chats — typically group chats
 * where you've added the bot as an admin — in addition to whatever normal
 * reply ctx.reply() sends back to the requesting chat.
 *
 * Common use: a feedback/support bot that DMs the user a confirmation, but
 * also copies their message into a private staff group; or a moderation bot
 * that mirrors every photo/video submitted into a review channel.
 *
 * Configured entirely through one env var — BROADCAST_TARGETS — so no code
 * changes are needed to add/remove/re-filter target chats:
 *
 *   BROADCAST_TARGETS = "-1001111111111:photo,document; -1002222222222"
 *
 *   - Targets are separated by `;`
 *   - Each target is `chatId` or `chatId:type1,type2,...`
 *   - No type list = that target receives every message type
 *   - Type names match Telegram's message field names: text, photo, video,
 *     document, voice, audio, sticker, animation, video_note, location,
 *     contact, poll
 *
 * The bot must already be a member of each target chat with permission to
 * post (Telegram's API has no way to make a bot join a group — you invite
 * it manually once, same as any other member).
 */
export class Broadcaster {
  constructor(telegram, targets = []) {
    this.telegram = telegram;
    this.targets = targets; // [{ chatId, types: Set<string>|null }]
  }

  static fromEnv(telegram, env) {
    return new Broadcaster(telegram, parseTargets(env.BROADCAST_TARGETS));
  }

  matches(message, types) {
    if (!types) return true; // no filter configured for this target = everything goes
    if (types.has('text') && message.text && !message.text.startsWith('/')) return true;
    return MESSAGE_TYPES.some((type) => types.has(type) && message[type] !== undefined);
  }

  /** Copy the message (no "Forwarded from" tag) to every matching target. */
  copyTo(ctx, opts = {}) {
    return this.dispatch(ctx, 'copyMessage', opts);
  }

  /** Forward the message (keeps the "Forwarded from" tag) to every matching target. */
  forwardTo(ctx, opts = {}) {
    return this.dispatch(ctx, 'forwardMessage', opts);
  }

  async dispatch(ctx, method, { types: overrideTypes } = {}) {
    const message = ctx.message;
    if (!message || !this.targets.length) return [];

    const override = overrideTypes ? new Set(overrideTypes) : null;
    const results = [];

    for (const target of this.targets) {
      if (!this.matches(message, override || target.types)) continue;

      try {
        const result = await this.telegram.call(method, {
          chat_id: target.chatId,
          from_chat_id: message.chat.id,
          message_id: message.message_id,
        });
        results.push({ chatId: target.chatId, ok: true, result });
      } catch (err) {
        console.error(`Broadcast to ${target.chatId} failed:`, err.message);
        results.push({ chatId: target.chatId, ok: false, error: err.message });
      }
    }

    return results;
  }
}

const MESSAGE_TYPES = [
  'photo', 'video', 'document', 'voice', 'audio',
  'sticker', 'animation', 'video_note', 'location', 'contact', 'poll',
];

function parseTargets(raw = '') {
  return (raw || '')
    .split(';')
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const [chatId, typesPart] = chunk.split(':').map((s) => s.trim());
      const types = typesPart
        ? new Set(typesPart.split(',').map((t) => t.trim()).filter(Boolean))
        : null;
      return { chatId, types };
    });
}
