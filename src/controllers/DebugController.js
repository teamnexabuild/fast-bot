import { Controller } from '../core/Controller.js';

/**
 * Debug-only controller: dumps the raw incoming Telegram Update as formatted
 * JSON, whatever it is (message, photo, callback_query, edited_message...).
 *
 * ⚠️ NOT FOR PRODUCTION:
 *  - No guard — anyone who can message the bot can trigger it.
 *  - Echoes back update internals (file_ids, full user objects, chat info)
 *    that you normally wouldn't want exposed.
 *  - Bypasses whatever your real handlers would normally do with the update.
 *
 * Useful for exactly one thing: figuring out the exact shape Telegram sends
 * for something (e.g. "what does update.message look like for a forwarded
 * voice note?") without digging through the Bot API docs.
 */
export class DebugController extends Controller {
  async handle(ctx) {
    const dump = JSON.stringify(ctx.update, null, 2);

    // Telegram caps message text at 4096 chars — truncate defensively so
    // large updates (e.g. ones with big inline keyboards) don't just fail to send.
    const MAX = 3900;
    const body = dump.length > MAX ? `${dump.slice(0, MAX)}\n...(truncated)` : dump;

    await ctx.replyHtml(`<pre>${escapeHtml(body)}</pre>`);
  }
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
