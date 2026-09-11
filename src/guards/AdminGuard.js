import { Guard } from '../core/Guard.js';

/**
 * Example guard: only allows through users whose Telegram ID is listed in
 * the ADMIN_IDS env var (comma-separated numeric IDs).
 * Attach to a route with: { guards: [AdminGuard] }
 */
export class AdminGuard extends Guard {
  message = 'This command is for admins only.';

  async handle(ctx) {
    const ids = (ctx.env.ADMIN_IDS || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    return ids.includes(String(ctx.from?.id));
  }
}
