import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/** Existing deployments can keep their environment files while adopting the new name. */
export function appEnv(name: string, env: NodeJS.ProcessEnv = process.env): string | undefined {
  return env[`FIKA_DESK_${name}`] ?? env[`MULTIAGENT_${name}`];
}

/** Reuse existing data rather than opening an empty database after an upgrade. */
export function defaultDataDir(homeDirectory = os.homedir()): string {
  const current = path.join(homeDirectory, '.fika-desk');
  const previous = path.join(homeDirectory, '.multiagent-web');
  return fs.existsSync(current) || !fs.existsSync(previous) ? current : previous;
}

/** ACP histories refer to this provider ID; changing it can prevent native session resume. */
export const MODEL_PROVIDER_ID = 'multiagent';
