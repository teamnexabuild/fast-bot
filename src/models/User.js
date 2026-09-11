/**
 * Example "Model" backed by Workers KV — the M in MVC here, minus a SQL layer
 * (Workers has none built in). Bind a KV namespace named USERS_KV in
 * wrangler.toml, then use like:
 *
 *   const user = await User.find(env, ctx.from.id);
 *   await User.save(env, ctx.from.id, { seenAt: Date.now() });
 *
 * Swap this out for D1 (Cloudflare's SQL database) later if you need
 * relations/queries — same static-method shape, different guts.
 */
export class User {
  static key(id) {
    return `user:${id}`;
  }

  static async find(env, id) {
    const raw = await env.USERS_KV?.get(this.key(id));
    return raw ? JSON.parse(raw) : null;
  }

  static async save(env, id, data) {
    const existing = (await this.find(env, id)) || {};
    const merged = { ...existing, ...data, id };
    await env.USERS_KV?.put(this.key(id), JSON.stringify(merged));
    return merged;
  }

  static async delete(env, id) {
    await env.USERS_KV?.delete(this.key(id));
  }
}
