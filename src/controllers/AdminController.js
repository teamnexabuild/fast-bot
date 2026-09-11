import { Controller } from '../core/Controller.js';

export class AdminController extends Controller {
  async handle(ctx) {
    await ctx.reply('Welcome, admin. This route is protected by AdminGuard.');
  }
}
