const fs = require('fs');
const path = require('path');

const cleanupOnce = async ({ uploadsDir, ttlMs, logger, allowPrefixes }) => {
  const now = Date.now();
  let deleted = 0;
  let scanned = 0;

  let entries;
  try {
    entries = await fs.promises.readdir(uploadsDir, { withFileTypes: true });
  } catch (e) {
    if (logger?.warn) logger.warn(`Uploads cleanup skipped: cannot read dir ${uploadsDir}`);
    return { scanned: 0, deleted: 0 };
  }

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    scanned++;
    const name = entry.name;
    const allowed = allowPrefixes.some((p) => name.startsWith(p));
    if (!allowed) continue;

    const fullPath = path.join(uploadsDir, name);
    try {
      const stat = await fs.promises.stat(fullPath);
      const age = now - stat.mtimeMs;
      if (age <= ttlMs) continue;
      await fs.promises.unlink(fullPath);
      deleted++;
    } catch (e) {
      if (logger?.warn) logger.warn(`Uploads cleanup failed for ${name}`);
    }
  }

  if (deleted > 0 && logger?.info) {
    logger.info(`Uploads cleanup deleted ${deleted} files (scanned ${scanned})`);
  }

  return { scanned, deleted };
};

const startUploadsCleanup = ({ ttlMs = 60 * 60 * 1000, intervalMs = 15 * 60 * 1000, logger } = {}) => {
  const uploadsDir = path.join(__dirname, '../../uploads');
  const allowPrefixes = ['compressed-', 'images-', 'sanitized-'];

  cleanupOnce({ uploadsDir, ttlMs, logger, allowPrefixes });
  const timer = setInterval(() => {
    cleanupOnce({ uploadsDir, ttlMs, logger, allowPrefixes });
  }, intervalMs);
  if (timer.unref) timer.unref();

  return () => clearInterval(timer);
};

module.exports = {
  startUploadsCleanup,
};
