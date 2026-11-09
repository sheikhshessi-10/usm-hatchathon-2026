import test from 'node:test';
import assert from 'node:assert/strict';
import { buildInfo } from './write-build-info.mjs';
test('stamps the build environment commit instead of an earlier hardcoded source revision',()=>{
  const sha='a'.repeat(40); const info=buildInfo({VERCEL_GIT_COMMIT_SHA:sha,VERCEL_ENV:'production'},new Date('2026-11-08T00:00:00Z'));
  assert.equal(info.commit,sha);assert.equal(info.sourceCommit,sha);assert.equal(info.builtAt,'2026-11-08T00:00:00.000Z');
});
test('does not invent a local commit and rejects unidentified production builds',()=>{
 assert.equal(buildInfo({}).commit,null);
 assert.throws(()=>buildInfo({VERCEL_ENV:'production'}),/actual Git/);
 assert.throws(()=>buildInfo({VERCEL_ENV:'production',VERCEL_GIT_COMMIT_SHA:'not-a-sha'}),/actual Git/);
});
