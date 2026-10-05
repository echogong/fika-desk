import fs from 'node:fs';
import { startBackend } from './backend';
import type { RunnerConfig } from './runtime-config';

const file = process.argv[2];
if (!file) throw new Error('缺少后台启动配置');
void startBackend(JSON.parse(fs.readFileSync(file, 'utf8')) as RunnerConfig).catch((error) => { console.error(error); process.exit(1); });
