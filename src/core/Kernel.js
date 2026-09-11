/**
 * Onion-style middleware compositor, same shape as Koa/Laravel's pipeline.
 * Each middleware is `async (ctx, next) => { ...; await next(); ... }`.
 * Guards are simpler: `async (ctx) => boolean` — run before the handler,
 * short-circuiting the chain if any of them return false.
 */
export function compose(middleware = []) {
  return function run(ctx, finalHandler) {
    let index = -1;

    function dispatch(i) {
      if (i <= index) {
        return Promise.reject(new Error('next() called multiple times'));
      }
      index = i;

      const fn = i === middleware.length ? finalHandler : middleware[i];
      if (!fn) return Promise.resolve();

      try {
        return Promise.resolve(fn(ctx, () => dispatch(i + 1)));
      } catch (err) {
        return Promise.reject(err);
      }
    }

    return dispatch(0);
  };
}

/**
 * Runs guards in order. Returns true if all pass. A guard can either return
 * false/throw to deny — GuardDenied errors carry an optional user-facing message.
 */
export class GuardDenied extends Error {
  constructor(message = 'Access denied.') {
    super(message);
    this.name = 'GuardDenied';
  }
}

export async function runGuards(guards = [], ctx) {
  for (const GuardClass of guards) {
    const guard = typeof GuardClass === 'function' && GuardClass.prototype?.handle
      ? new GuardClass()
      : GuardClass; // allow passing an already-instantiated guard or plain function
    const allowed = typeof guard === 'function' ? await guard(ctx) : await guard.handle(ctx);
    if (!allowed) {
      const message = guard.message || 'You are not allowed to do that.';
      throw new GuardDenied(message);
    }
  }
  return true;
}
