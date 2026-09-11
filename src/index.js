import { Application } from './core/Application.js';
import { Logging } from './middleware/Logging.js';
import { VerifyTelegramSecret } from './middleware/VerifyTelegramSecret.js';
import config from './config/app.js';
import registerRoutes from './routes/bot.js';

const app = new Application(config);

// Global middleware, runs on every update, in order.
app.router.use(VerifyTelegramSecret);
app.router.use(Logging);

registerRoutes(app.router);

export default {
  async fetch(request, env, executionCtx) {
    return app.handle(request, env, executionCtx);
  },
};
