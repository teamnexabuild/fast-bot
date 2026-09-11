import { Controller } from '../core/Controller.js';

/**
 * Handles callback_query with data matching /^like:(\d+)$/ — see routes/bot.js.
 * ctx.params holds the regex capture groups, e.g. params[0] === the matched id.
 */
export class LikeController extends Controller {
  async handle(ctx) {
    const [id] = ctx.params;
    await ctx.answerCallback(`Liked post #${id}!`);
    await ctx.editMessageText(`✅ You liked post #${id}.`);
  }
}
