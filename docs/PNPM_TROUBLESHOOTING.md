# pnpm install troubleshooting (Windows)

This repo has repeatedly hit broken `pnpm install` runs on Windows. This doc
records the symptoms, the real root causes, and a reliable recovery procedure so
we don't lose hours rediscovering it.

## Environment that triggers this

- OS: Windows (with Windows Defender real-time protection ON)
- Package manager: `pnpm` (v10.x)
- `.npmrc`: `node-linker=hoisted` + `package-import-method=copy`
- Large/native packages in the tree: `react-native`, `expo-notifications`,
  `expo-local-authentication`, `@tailwindcss/oxide-*`, `better-sqlite3`.

The combination of `package-import-method=copy` (writes thousands of small
files) + Defender scanning each new file + Windows' inability to `rename` a temp
dir over an existing dir is what makes installs fragile here.

## Symptoms we have seen

- `ERR_PNPM_EPERM  EPERM: operation not permitted, rename '...\<pkg>_tmp_NNNNN' -> '...\<pkg>'`
- `ERR_PNPM_ENOENT  ENOENT: no such file or directory, scandir '...\<pkg>_tmp_NNNNN\node_modules'`
- The failing package is **different almost every run** (expo-notifications,
  @tailwindcss/oxide-wasm32-wasi, resolve, @tanstack/zod-form-adapter, ...) — a
  tell-tale sign it's a transient file-lock / race, not a bad package.
- After failed/partial installs, **`react-native` silently disappears** from
  `node_modules` (and from `node_modules/.pnpm`). The app then can't build and
  `tsc` reports ~48 `Cannot find module 'react-native'` errors across files.
- `pnpm install` and `pnpm install --force` **disagree**: a plain install shows
  `Packages: -130` (removes them, including react-native), `--force` shows
  `Packages: +130` (re-adds them). Oscillating between the two never converges.

## Root causes

1. **Defender locks freshly-written files.** During the `copy` link step,
   Defender opens each new file to scan it; pnpm then tries to `rename` the temp
   dir into place and Windows returns EPERM/ENOENT because a handle is open.
2. **Windows can't rename over an existing directory.** Once a partial install
   has left `node_modules/<pkg>` in place, the next run creates `<pkg>_tmp_*` and
   tries to `rename` it over the existing `<pkg>` → EPERM. So re-running install
   on a half-populated tree keeps failing on whatever already exists.
3. **Plain `install` vs `--force` hoisting disagreement.** In the broken state,
   plain `pnpm install` treats ~130 peer-deduped packages (react-native among
   them) as extraneous and removes them; only `--force` materializes them. A
   plain install alone produces a tree that is **missing react-native**.

## DO — reliable recovery procedure

Run these in order. Steps 1–2 are the permanent fix; do them once.

1. **Add a Defender exclusion for the repo** (one-time, needs admin). Open
   PowerShell **as Administrator** (title bar must read
   "Administrator: Windows PowerShell") and run:
   ```powershell
   Add-MpPreference -ExclusionPath "C:\Users\admin\shareef-money"
   ```
   Optionally also pause Real-time protection while installing
   (Windows Security → Virus & threat protection → Manage settings →
   Real-time protection Off) and turn it back On afterwards.

2. **Install into a completely empty tree using `--force`.** This is the only
   combination that reliably produces a complete, consistent `node_modules`:
   ```powershell
   # stop anything holding node_modules handles
   Get-Process node | Stop-Process -Force
   # wipe the tree (with protection off this deletes cleanly)
   Remove-Item node_modules -Recurse -Force
   # one fresh install — use --force so peer-deduped packages (react-native) land
   pnpm install --force
   ```

3. **Verify the critical packages landed** before building:
   ```powershell
   foreach ($p in @("react-native","expo","expo-document-picker",
     "expo-notifications","react-native-reanimated","react-native-sortables")) {
     "$p : $(Test-Path "node_modules/$p/package.json")"
   }
   ```
   `react-native` MUST be `True`. If it's `False`, re-run step 2.

4. If a single `--force` still EPERMs near the end (transient lock on one
   package), just re-run `pnpm install --force` again — successfully-linked
   packages persist, so each pass finishes more. With Defender excluded it
   should complete in one pass.

## DON'T — things that cause or worsen the breakage

- **DON'T run a plain `pnpm install` to "fix" a working tree.** In this repo it
  strips out react-native (the `-130` behavior). Once the tree is good via
  `--force`, leave it. If you must change deps, edit `package.json`, then
  **wipe + `pnpm install --force`** (see below).
- **DON'T retry install repeatedly on a half-populated `node_modules`.** It
  keeps failing on whatever already exists (rename-over-existing). Wipe first.
- **DON'T add packages with `pnpm add` on the broken/half tree** and assume it
  worked — it can leave the tree inconsistent. Prefer: edit `package.json`,
  wipe `node_modules`, `pnpm install --force`.
- **DON'T trust an `exit 0` alone.** A "successful" plain install has shipped a
  tree missing react-native. Always run the verify step (step 3).
- **DON'T assume Defender is the only cause.** Even with protection off, a
  half-populated tree still fails on rename-over-existing. The empty-tree +
  `--force` step is what actually fixes it.

## Adding a new dependency (the safe recipe)

```powershell
# 1. edit apps/mobile/package.json to add the dep (pin a known-good version)
# 2. wipe + force install (updates lockfile + materializes everything)
Get-Process node | Stop-Process -Force
Remove-Item node_modules -Recurse -Force
pnpm install --force
# 3. verify the new dep + react-native are both present (step 3 above)
```

`expo install <pkg>` will pick the SDK-correct version but tends to fail the
link step here — if it does, note the version it printed, add it to
`package.json` manually, and use the wipe + `--force` recipe.

## Watch out for phantom (undeclared) dependencies

Some packages were imported in source but **never added to `package.json`**
(e.g. `react-native-sortables`, and at one point `expo-notifications`). They
survived as long as they happened to be in `node_modules`, but a clean wipe
removes them and the app breaks (e.g. category reorder screens). After any clean
reinstall, if `tsc` shows `Cannot find module '<x>'` for a package that the app
actually uses at runtime, that package is an undeclared dep — add it to
`package.json` properly and reinstall.
