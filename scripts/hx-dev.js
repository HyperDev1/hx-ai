#!/usr/bin/env node

/**
 * hx-dev — Run HX from TypeScript source (staging / development mode).
 *
 * Spawns the src/loader.ts directly via --experimental-strip-types,
 * with HX_ENV=staging set so the runtime can distinguish this from
 * a production or local-build invocation.
 *
 * Usage: hx-dev [args...]
 */

import { spawn } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const srcLoaderPath = resolve(root, 'src', 'loader.ts')
const resolveTsPath = resolve(root, 'src', 'resources', 'extensions', 'hx', 'tests', 'resolve-ts.mjs')

const child = spawn(
  process.execPath,
  ['--disable-warning=ExperimentalWarning', '--import', resolveTsPath, '--experimental-strip-types', srcLoaderPath, ...process.argv.slice(2)],
  {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: {
      ...process.env,
      HX_ENV: 'staging',
    },
  },
)

child.on('error', (error) => {
  console.error(`[hx-dev] Failed to launch: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }
  process.exit(code ?? 0)
})
