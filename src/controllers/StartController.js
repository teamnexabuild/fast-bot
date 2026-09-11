import { Controller } from '../core/Controller.js';

export class StartController extends Controller {
  async handle(ctx) {
    const name = ctx.from?.first_name || 'there';
    await ctx.reply(
      `Hi ${name}! 👋\n\nThis is fast-bot — a Laravel-inspired mini framework for Telegram bots on Cloudflare Workers.\n\nTry /help.`
    );
  }
}
