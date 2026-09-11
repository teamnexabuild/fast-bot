/**
 * Global middleware: rejects updates that don't carry the secret token you
 * configured on the webhook (see Application#handleSetup and TELEGRAM_SECRET).
 * Cheap protection against randoms POSTing fake updates to your worker.
 *
 * NOTE: this can't reject with a custom HTTP status from inside the pipeline
 * since Telegram already got a 200 by the time middleware runs; instead it
 * just stops the chain so no handler executes.
 */
export async function VerifyTelegramSecret(ctx, next) {
  const expected = ctx.env.TELEGRAM_SECRET;
  if (!expected) return next(); // not configured, skip the check

  const header = ctx.request?.headers?.get?.('x-telegram-bot-api-secret-token');
  if (header !== expected) {
    console.warn('[fast-bot] rejected update: bad secret token');
    return; // stop the chain, don't call next()
  }

  await next();
}
