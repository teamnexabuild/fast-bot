import { StartController } from '../controllers/StartController.js';
import { HelpController } from '../controllers/HelpController.js';
import { AdminController } from '../controllers/AdminController.js';
import { EchoController } from '../controllers/EchoController.js';
import { LikeController } from '../controllers/LikeController.js';
import { AdminGuard } from '../guards/AdminGuard.js';

/**
 * Route definitions — the "routes/web.php" of this framework.
 * Called once at boot with the app's Router instance.
 */
export default function routes(router) {
  router.command('start', [StartController, 'handle']);
  router.command('help', [HelpController, 'handle']);

  // Guarded route: only users in ADMIN_IDS get through.
  router.command('admin', [AdminController, 'handle'], { guards: [AdminGuard] });

  // callback_query routing by data pattern, with capture groups in ctx.params.
  router.action(/^like:(\d+)$/, [LikeController, 'handle']);

  // Fallback for any plain text message that isn't a command.
  router.text([EchoController, 'handle']);
}
