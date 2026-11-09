import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
export function buildInfo(env = process.env, now = new Date()) {
  const candidate = env.VERCEL_GIT_COMMIT_SHA || env.GITHUB_SHA || '';
  const commit = /^[a-f0-9]{40}$/i.test(candidate) ? candidate.toLowerCase() : null;
  if (env.VERCEL_ENV === 'production' && !commit) throw new Error('Production build requires an actual Git commit SHA');
  return { application: 'AVENLYTH', release: 'production-readiness-audit', commit, sourceCommit: commit,
    builtAt: now.toISOString(), environment: env.VERCEL_ENV || 'local',
    features: ['nurse', 'doctor', 'mother', 'reports', 'care-loops', 'protocols', 'expo'],
  };
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const output = fileURLToPath(new URL('../dist/build-info.json', import.meta.url));
  await mkdir(fileURLToPath(new URL('../dist/', import.meta.url)), {recursive: true});
  const info = buildInfo();
  await writeFile(output, JSON.stringify(info, null, 2) + '\n');
  console.log(`Build metadata: ${info.commit || 'local / unversioned'}`);
}
