import { Router } from './Router.js';
import { Context } from './Context.js';
import { Telegram } from './Telegram.js';

/**
 * The Application ties together config + router and knows how to turn a raw
 * Cloudflare `fetch(request, env, ctx)` call into a routed bot Update.
 *
 * One Application instance is created once at module scope (cheap, stateless);
 * request-scoped things (env, the Telegram client) are created per request
 * inside `handle()`, since Workers give you fresh `env` bindings each call.
 */
export class Application {
  constructor(config = {}) {
    this.config = config;
    this.router = new Router();
  }

  async handle(request, env, executionCtx) {
    const url = new URL(request.url);

    // Convenience GET routes for setting up / inspecting the webhook without
    // needing curl — handy since this whole thing is meant to deploy free.
    if (request.method === 'GET' && url.pathname === '/') {
      return new Response('fast-bot is running.', { status: 200 });
    }

    if (request.method === 'GET' && url.pathname === '/setup') {
      return this.handleSetup(request, env, url);
    }

    if (request.method !== 'POST') {
      return new Response('Not found', { status: 404 });
    }

    // Optional shared-secret check, set via `wrangler secret put TELEGRAM_SECRET`
    // and passed to setWebhook's secret_token — verified in middleware, see
    // src/middleware/VerifyTelegramSecret.js. We don't enforce it here so it
    // stays opt-in and configurable like any other middleware.

    let update;
    try {
      update = await request.json();
    } catch {
      return new Response('Bad request', { status: 400 });
    }

    const telegram = new Telegram(env.BOT_TOKEN);
    const ctx = new Context({ update, env, executionCtx, telegram, request });

    try {
      await this.router.dispatch(ctx);
    } catch (err) {
      console.error('Unhandled error while dispatching update:', err);
      // Telegram only cares that we returned 200 — respond OK regardless so
      // it doesn't retry-storm us over an application bug.
    }

    return new Response('OK', { status: 200 });
  }

  async handleSetup(request, env, url) {
    if (!env.BOT_TOKEN) {
      return new Response('Missing BOT_TOKEN secret.', { status: 500 });
    }

    const telegram = new Telegram(env.BOT_TOKEN);
    const webhookUrl = `${url.origin}/`.replace(/\/$/, '') + '/';
    const extra = env.TELEGRAM_SECRET ? { secret_token: env.TELEGRAM_SECRET } : {};

    const result = await telegram.setWebhook(webhookUrl, extra);
    return new Response(JSON.stringify({ webhookUrl, result }, null, 2), {
      headers: { 'content-type': 'application/json' },
    });
  }
}
