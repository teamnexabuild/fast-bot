# fast-bot

A tiny Laravel-inspired framework for building Telegram bots on Cloudflare Workers — free tier friendly, zero external dependencies at runtime.

## Architecture

```
src/
  core/
    Application.js   # entry glue: turns fetch(request, env, ctx) into a routed Update
    Router.js         # matches Update -> route, runs middleware/guards/handler
    Kernel.js          # onion-style middleware compositor + guard runner
    Context.js         # per-update object: ctx.reply(), ctx.from, ctx.state, ...
    Telegram.js        # thin Bot API client (sendMessage, answerCallbackQuery, ...)
    Guard.js           # base class for auth-style pre-checks
    Controller.js      # optional base class for controllers
  config/app.js        # static, committable config
  routes/bot.js         # route definitions (the "routes/web.php")
  middleware/            # global or per-route middleware
  guards/                 # route guards (e.g. AdminGuard)
  controllers/            # route handlers (the "C" in MVC)
  models/                  # KV-backed data models (the "M" in MVC)
bin/artisan.js             # scaffolding CLI (make:controller, make:guard, ...)
stubs/                      # templates artisan fills in
```

## Request flow

```
Telegram -> POST / -> Application.handle()
  -> VerifyTelegramSecret (global middleware)
  -> Logging (global middleware)
  -> Router.resolve()          # match command / text / callback_query / media type
    -> route guards            # e.g. AdminGuard — 403-style short-circuit
    -> route middleware
      -> Controller#handle(ctx)
```

## Routing

```js
// src/routes/bot.js
router.command('start', [StartController, 'handle']);
router.command('admin', [AdminController, 'handle'], { guards: [AdminGuard] });
router.action(/^like:(\d+)$/, [LikeController, 'handle']); // callback_query.data
router.on('photo', [PhotoController, 'handle']);            // any message.photo
router.text([EchoController, 'handle']);                    // plain-text fallback
```

Handlers are either `(ctx) => {}` functions or `[ControllerClass, 'method']` tuples.

## Context cheatsheet

```js
ctx.reply('text')
ctx.replyHtml('<b>bold</b>')
ctx.answerCallback('toast text')
ctx.editMessageText('new text')
ctx.from            // Telegram user who sent the update
ctx.chat            // chat object
ctx.text             // message text
ctx.params           // command args / regex capture groups
ctx.state             // free-form bag for middleware/guards to stash data
ctx.env               // your Worker's bindings (secrets, KV, etc.)
```

## Dev tools (artisan)

```bash
node bin/artisan.js make:controller Payment
node bin/artisan.js make:middleware ThrottleRequests
node bin/artisan.js make:guard SubscriberGuard
node bin/artisan.js make:model Order
node bin/artisan.js route:list
```

Or via npm scripts: `npm run make:controller Payment`, etc.

## Setup & deploy

1. **Install deps & login**
   ```bash
   npm install
   npx wrangler login
   ```

2. **Set secrets**
   ```bash
   npx wrangler secret put BOT_TOKEN        # from @BotFather
   npx wrangler secret put TELEGRAM_SECRET  # any random string, for webhook verification
   ```
   For local dev, copy `.dev.vars.example` to `.dev.vars` and fill it in.

3. **Deploy**
   ```bash
   npm run deploy
   ```
   This prints your worker URL, e.g. `https://fast-bot.<you>.workers.dev`.

4. **Point Telegram at it** — visit this URL once in a browser (or `curl` it):
   ```
   https://fast-bot.<you>.workers.dev/setup
   ```
   This calls `setWebhook` for you, including the secret token if you set one.

5. **Talk to your bot** — `/start`, `/help`, send it text, tap the demo button.

## Adding persistence (optional)

`src/models/User.js` is a KV-backed example model. To use it:
```bash
npx wrangler kv namespace create USERS_KV
```
then uncomment/fill the `[[kv_namespaces]]` block in `wrangler.toml` with the printed id, and redeploy. Swap KV for [D1](https://developers.cloudflare.com/d1/) later if you need real queries/relations — same static-method shape on the model.

## Guards vs. Middleware

- **Guard** — a yes/no gate (`async handle(ctx) => boolean`). Denies with `ctx.reply(guard.message)` automatically. Use for authorization ("is this user an admin?").
- **Middleware** — wraps the handler (`async (ctx, next) => {}`), can run logic before *and* after, or skip `next()` entirely to short-circuit silently. Use for logging, rate limiting, request verification, injecting data into `ctx.state`.
