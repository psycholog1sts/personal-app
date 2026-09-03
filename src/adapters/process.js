import { spawn } from 'node:child_process';

const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_MAX_OUTPUT_BYTES = 10 * 1024 * 1024;

export function runTool(command, args = [], options = {}) {
  if (typeof command !== 'string' || command.trim() === '') {
    throw new TypeError('command must be a non-empty string');
  }
  if (!Array.isArray(args) || args.some((arg) => typeof arg !== 'string')) {
    throw new TypeError('args must be an array of strings');
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxOutputBytes = options.maxOutputBytes ?? DEFAULT_MAX_OUTPUT_BYTES;

  return new Promise((resolve) => {
    let settled = false;
    let stdout = '';
    let stderr = '';
    let outputBytes = 0;
    let timedOut = false;
    let outputLimited = false;

    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env ?? process.env,
      shell: false,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };

    const append = (kind, chunk) => {
      const text = chunk.toString('utf8');
      outputBytes += Buffer.byteLength(text);
      if (outputBytes > maxOutputBytes) {
        outputLimited = true;
        child.kill('SIGKILL');
        return;
      }
      if (kind === 'stdout') stdout += text;
      else stderr += text;
    };

    child.stdout?.on('data', (chunk) => append('stdout', chunk));
    child.stderr?.on('data', (chunk) => append('stderr', chunk));

    child.on('error', (error) => {
      if (error?.code === 'ENOENT') {
        finish({ ok: false, code: null, missing: true, stdout: '', stderr: '' });
        return;
      }
      finish({ ok: false, code: null, missing: false, stdout, stderr: String(error?.message ?? error) });
    });

    child.on('close', (code, signal) => {
      const diagnostic = outputLimited
        ? 'tool output exceeded safety limit'
        : timedOut
          ? `tool timed out after ${timeoutMs}ms`
          : stderr;
      finish({
        ok: code === 0 && !timedOut && !outputLimited,
        code,
        missing: false,
        stdout,
        stderr: diagnostic,
        signal: signal ?? null,
        timedOut,
        outputLimited,
      });
    });

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, timeoutMs);
  });
}
