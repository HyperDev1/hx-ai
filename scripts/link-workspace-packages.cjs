#!/usr/bin/env node
/**
 * link-workspace-packages.cjs
 *
 * Creates node_modules/@hx/* symlinks pointing to packages/* directories.
 *
 * During development, npm workspaces creates these automatically. But in the
 * published tarball, workspace packages are shipped under packages/ (via the
 * "files" field) and the @hx/* imports in compiled code need node_modules/@hx/*
 * to resolve. This script bridges the gap.
 *
 * Runs as part of postinstall (before any ESM code that imports @hx/*).
 *
 * On Windows without Developer Mode or administrator rights, creating symlinks
 * (even NTFS junctions) can fail with EPERM. In that case we fall back to
 * cpSync (directory copy) which works universally.
 */
const { existsSync, mkdirSync, symlinkSync, cpSync, lstatSync, readlinkSync, unlinkSync } = require('fs')
const { resolve, join } = require('path')

const root = resolve(__dirname, '..')
const packagesDir = join(root, 'packages')
const nodeModulesGsd = join(root, 'node_modules', '@hx')

// Map directory names to package names
const packageMap = {
  'native': 'native',
  'pi-agent-core': 'pi-agent-core',
  'pi-ai': 'pi-ai',
  'pi-coding-agent': 'pi-coding-agent',
  'pi-tui': 'pi-tui',
}

// Ensure @hx scope directory exists
if (!existsSync(nodeModulesGsd)) {
  mkdirSync(nodeModulesGsd, { recursive: true })
}

let linked = 0
let copied = 0
for (const [dir, name] of Object.entries(packageMap)) {
  const source = join(packagesDir, dir)
  const target = join(nodeModulesGsd, name)

  if (!existsSync(source)) continue

  // Skip if already correctly linked or is a real directory (bundled).
  // Use lstatSync to detect broken symlinks (existsSync follows the link
  // and returns false when the target is missing, leaving the dangling
  // symlink in place and causing symlinkSync to fail with EEXIST).
  let targetStat = null
  try { targetStat = lstatSync(target) } catch { /* does not exist at all */ }

  if (targetStat) {
    if (targetStat.isSymbolicLink()) {
      const linkTarget = readlinkSync(target)
      if (resolve(join(nodeModulesGsd, linkTarget)) === source || linkTarget === source) {
        continue // Already correct
      }
      unlinkSync(target) // Wrong target (or broken), relink
    } else {
      continue // Real directory (e.g., copied or from bundleDependencies), don't touch
    }
  }

  let symlinkOk = false
  try {
    symlinkSync(source, target, 'junction') // junction works on Windows too
    symlinkOk = true
    linked++
  } catch {
    // Symlink failed — common on Windows without Developer Mode or admin rights.
    // Fall back to a directory copy so the package is still resolvable.
  }

  if (!symlinkOk) {
    try {
      cpSync(source, target, { recursive: true })
      copied++
    } catch {
      // Non-fatal — loader.ts will emit a clearer error if resolution still fails
    }
  }
}

if (linked > 0) process.stderr.write(`  Linked ${linked} workspace package${linked !== 1 ? 's' : ''}\n`)
if (copied > 0) process.stderr.write(`  Copied ${copied} workspace package${copied !== 1 ? 's' : ''} (symlinks unavailable)\n`)
