#!/usr/bin/env node

/**
 * hx-local — Run HX from the local dist/ build output.
 *
 * Points directly at dist/loader.js with HX_ENV=local so the runtime
 * knows this is a locally-built version (not npm-published production).
 *
 * Usage: hx-local [args...]
 */

import { spawn } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const distLoaderPath = resolve(root, 'dist', 'loader.js')

const child = spawn(
  process.execPath,
  [distLoaderPath, ...process.argv.slice(2)],
  {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: {
      ...process.env,
      HX_ENV: 'local',
    },
  },
)

child.on('error', (error) => {
  console.error(`[hx-local] Failed to launch: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }
  process.exit(code ?? 0)
})
