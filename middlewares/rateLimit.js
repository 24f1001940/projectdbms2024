const hits = new Map();

module.exports = function rateLimit({ windowMs = 15 * 60 * 1000, max = 30, keyPrefix = 'default' } = {}) {
  return (req, res, next) => {
    const key = `${keyPrefix}:${req.ip || req.connection?.remoteAddress || 'unknown'}`;
    const now = Date.now();
    const record = hits.get(key);

    if (!record || record.expiresAt <= now) {
      hits.set(key, { count: 1, expiresAt: now + windowMs });
      return next();
    }

    if (record.count >= max) {
      const retryAfter = Math.ceil((record.expiresAt - now) / 1000);
      return res.status(429).json({ message: 'Too many requests. Please try again later.', retryAfter });
    }

    record.count += 1;
    next();
  };
};