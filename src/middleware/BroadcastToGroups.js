/**
 * Global middleware: automatically copies every matching incoming message
 * into the chats configured via BROADCAST_TARGETS (see src/core/Broadcaster.js),
 * on top of whatever normal reply the route sends back.
 *
 * OFF by default — not registered in src/index.js. If BROADCAST_TARGETS is
 * unset, this is a harmless no-op, so it's also safe to enable even before
 * you've configured any targets.
 *
 * Runs after next() so the user's own reply always goes out first — the
 * mirrored copy landing in the group a moment later doesn't matter.
 */
export async function BroadcastToGroups(ctx, next) {
  await next();
  await ctx.broadcaster.copyTo(ctx);
}
