import path from 'node:path';
import { lstat, readFile, readdir } from 'node:fs/promises';

import { resolveScanTarget } from '../core/target.js';
import { scanVirtualFiles } from './content-scan.js';

const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', 'build', '.next', '.turbo', 'coverage', '.cache']);
const TEXT_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.sql']);
const MAX_FILE_BYTES = 1024 * 1024;

function toRelative(root, filePath) {
  return path.relative(root, filePath).split(path.sep).join('/');
}

async function collectFiles(root) {
  const files = [];
  const stack = [root];

  while (stack.length > 0) {
    const current = stack.pop();
    const entries = await readdir(current, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) stack.push(fullPath);
        continue;
      }
      if (entry.isFile()) files.push(fullPath);
    }
  }

  return files;
}

async function readSmallTextFile(filePath) {
  const stats = await lstat(filePath);
  if (stats.size > MAX_FILE_BYTES) return null;
  return readFile(filePath, 'utf8');
}

export async function runNativeScan(inputRoot) {
  const root = await resolveScanTarget(inputRoot);
  const files = await collectFiles(root);
  const virtualFiles = [];

  for (const filePath of files) {
    const relative = toRelative(root, filePath);
    const name = path.basename(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const isSensitiveEnv = /^\.env(?:\..+)?$/i.test(name);
    const isSupportedText = TEXT_EXTENSIONS.has(ext);

    if (!isSensitiveEnv && !isSupportedText) continue;

    let text = '';
    if (isSupportedText) {
      try {
        const value = await readSmallTextFile(filePath);
        if (value === null) continue;
        text = value;
      } catch {
        continue;
      }
    }

    virtualFiles.push({ path: relative, text });
  }

  return scanVirtualFiles(virtualFiles);
}
