/**
 * Static app config. Anything that varies per-environment (tokens, secrets,
 * feature flags) belongs in wrangler.toml [vars] or `wrangler secret put`
 * instead — this file is for config you don't mind committing.
 */
export default {
  name: 'fast-bot',
};
