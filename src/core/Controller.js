/**
 * Optional base class for Controllers. Not required — a controller can be any
 * class with methods `(ctx) => any` — but extending this gives you `this.ctx`
 * wiring for free if you prefer instance methods over static ones.
 */
export class Controller {
  constructor(ctx) {
    this.ctx = ctx;
  }
}
