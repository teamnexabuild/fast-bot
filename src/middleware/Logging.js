/**
 * Global middleware: logs every incoming update. Registered in src/index.js
 * via `app.router.use(Logging)`.
 */
export async function Logging(ctx, next) {
  const kind = ctx.callbackQuery ? 'callback_query' : ctx.message ? 'message' : 'update';
  console.log(`[fast-bot] ${kind} from ${ctx.from?.id ?? 'unknown'}: ${ctx.text || ctx.callbackQuery?.data || ''}`);
  await next();
}
