import { StartController } from '../controllers/StartController.js';
import { HelpController } from '../controllers/HelpController.js';
import { AdminController } from '../controllers/AdminController.js';
import { EchoController } from '../controllers/EchoController.js';
import { LikeController } from '../controllers/LikeController.js';
// import { DebugController } from '../controllers/DebugController.js';           // debug only, see below
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
 
  // --- Optional features, off by default -----------------------------------
 
  // ⚠️ DEBUG ONLY — uncomment one of these while developing to see exactly
  // what Telegram sends, then remove before shipping. Never leave enabled
  // in production: no guard by default, and it echoes raw update internals
  // back to whoever triggers it.
  //
  // Option A — trigger on demand with a command:
  // router.command('raw', [DebugController, 'handle'], { guards: [AdminGuard] });
  //
  // Option B — dump anything that falls through every route above. Since
  // /commands are already claimed and EchoController already claims all
  // plain text, this mainly catches things you haven't wired a handler for
  // yet: stickers, voice notes, channel posts, etc. Put it last in this
  // function so real routes always get first refusal.
  // router.fallback([DebugController, 'handle']);
}
