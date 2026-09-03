import path from 'node:path';
import { lstat, realpath } from 'node:fs/promises';

export async function resolveScanTarget(inputPath) {
  if (typeof inputPath !== 'string' || inputPath.trim() === '') {
    throw new TypeError('scan target path must be a non-empty string');
  }

  const requested = path.resolve(inputPath);
  let stats;
  try {
    stats = await lstat(requested);
  } catch (error) {
    if (error?.code === 'ENOENT') {
      throw new Error(`Scan target does not exist: ${requested}`);
    }
    throw error;
  }

  if (stats.isSymbolicLink()) {
    throw new Error(`Scan target must be a directory, not a symbolic link: ${requested}`);
  }
  if (!stats.isDirectory()) {
    throw new Error(`Scan target must be a directory: ${requested}`);
  }

  return realpath(requested);
}
