import { compose, runGuards, GuardDenied } from './Kernel.js';

/**
 * Router matches an incoming Telegram Update against registered routes and
 * runs it through: global middleware -> route middleware -> route guards -> handler.
 *
 * Route kinds:
 *   router.command('start', handler, opts)         /start, /start@BotName args...
 *   router.text(handler, opts)                      any plain text message (fallback)
 *   router.on('photo', handler, opts)                any update containing update.message.photo, etc.
 *   router.action(/^like:(\d+)$/, handler, opts)      callback_query.data pattern match
 *   router.fallback(handler)                          nothing else matched
 *
 * `handler` is either a function `(ctx) => any` or a `[ControllerClass, 'method']` tuple.
 * `opts` = { middleware: [], guards: [] }
 */
export class Router {
  constructor() {
    this.globalMiddleware = [];
    this.commands = new Map();
    this.textHandlers = [];
    this.actionHandlers = [];
    this.typeHandlers = {}; // e.g. photo, document, sticker, voice...
    this.fallbackHandler = null;
  }

  use(middleware) {
    this.globalMiddleware.push(middleware);
    return this;
  }

  command(name, handler, opts = {}) {
    this.commands.set(name.replace(/^\//, ''), { handler, ...opts });
    return this;
  }

  text(handler, opts = {}) {
    this.textHandlers.push({ handler, ...opts });
    return this;
  }

  action(pattern, handler, opts = {}) {
    const regex = pattern instanceof RegExp ? pattern : new RegExp(`^${pattern}$`);
    this.actionHandlers.push({ regex, handler, ...opts });
    return this;
  }

  on(type, handler, opts = {}) {
    (this.typeHandlers[type] ||= []).push({ handler, ...opts });
    return this;
  }

  fallback(handler, opts = {}) {
    this.fallbackHandler = { handler, ...opts };
    return this;
  }

  /** Resolve which route matches this context. Returns { route, params } or null. */
  resolve(ctx) {
    const msg = ctx.message;
    const cq = ctx.callbackQuery;

    if (cq) {
      for (const route of this.actionHandlers) {
        const match = route.regex.exec(cq.data || '');
        if (match) return { route, params: match.slice(1) };
      }
    }

    if (msg) {
      if (msg.text?.startsWith('/')) {
        const [rawCmd, ...args] = msg.text.trim().split(/\s+/);
        const cmd = rawCmd.slice(1).split('@')[0]; // strip leading / and @BotName
        const route = this.commands.get(cmd);
        if (route) return { route, params: args };
      }

      for (const type of Object.keys(this.typeHandlers)) {
        if (msg[type] !== undefined) {
          // first matching handler for this media type wins
          return { route: this.typeHandlers[type][0], params: [] };
        }
      }

      if (msg.text) {
        for (const route of this.textHandlers) {
          return { route, params: [] };
        }
      }
    }

    if (this.fallbackHandler) return { route: this.fallbackHandler, params: [] };

    return null;
  }

  async dispatch(ctx) {
    const runPipeline = compose(this.globalMiddleware);

    return runPipeline(ctx, async () => {
      const matched = this.resolve(ctx);
      if (!matched) return; // nothing matched, silently ignore the update

      const { route, params } = matched;
      ctx.route = route;
      ctx.params = params;

      try {
        if (route.guards?.length) {
          await runGuards(route.guards, ctx);
        }

        const routePipeline = compose(route.middleware || []);
        await routePipeline(ctx, () => this.invoke(route.handler, ctx));
      } catch (err) {
        if (err instanceof GuardDenied) {
          await ctx.reply(err.message).catch(() => {});
          return;
        }
        throw err;
      }
    });
  }

  async invoke(handler, ctx) {
    if (Array.isArray(handler)) {
      const [ControllerClass, method = 'handle'] = handler;
      const controller = new ControllerClass(ctx);
      return controller[method](ctx);
    }
    return handler(ctx);
  }
}
