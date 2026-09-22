export class StatusEffectSystem {
  static apply(target, type, duration = 2500, power = 1) {
    target.statuses ||= new Map();
    target.statuses.set(type, { until: performance.now() + duration, power });
    if (type === 'Ice') target.speedMultiplier = 0.65;
    if (type === 'Lightning') target.stunnedUntil = performance.now() + Math.min(duration, 350);
  }
  static update(target) {
    if (!target.statuses) return;
    const now = performance.now();
    for (const [type, info] of target.statuses) {
      if (now >= info.until) {
        target.statuses.delete(type);
        if (type === 'Ice') target.speedMultiplier = 1;
      }
    }
  }
}
