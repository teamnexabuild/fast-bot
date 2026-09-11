/**
 * Base class for Guards (auth-style pre-checks run before a handler).
 * Extend this and implement `handle(ctx)` returning true/false.
 * Set `this.message` to customize the denial reply.
 */
export class Guard {
  message = 'You are not allowed to do that.';

  // eslint-disable-next-line no-unused-vars
  async handle(ctx) {
    return true;
  }
}
