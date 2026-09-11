import { Controller } from '../core/Controller.js';

export class EchoController extends Controller {
  async handle(ctx) {
    await ctx.reply(`You said: ${ctx.text}`);
  }
}
