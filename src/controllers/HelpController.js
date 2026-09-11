import { Controller } from '../core/Controller.js';

export class HelpController extends Controller {
  async handle(ctx) {
    await ctx.replyHtml(
      [
        '<b>Available commands</b>',
        '/start - welcome message',
        '/help - this message',
        '/admin - admin-only example (guarded)',
        '',
        'Send any text and I will echo it back.',
        'Tap the demo button below to see a callback_query route in action.',
      ].join('\n'),
      {
        reply_markup: {
          inline_keyboard: [[{ text: '👍 Like', callback_data: 'like:1' }]],
        },
      }
    );
  }
}
