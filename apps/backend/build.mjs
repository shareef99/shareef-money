import { build } from "esbuild";
import { cpSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Produces a self-contained dist/ that `node` can run on any platform (Render,
// Fly, a VM, a container, AWS, …) without tsx or pnpm-workspace resolution at
// runtime. The workspace packages (@shareef-money/*) export raw .ts, so we
// INLINE them into the bundle; everything in node_modules stays external and is
// installed normally from package.json.
const root = dirname(fileURLToPath(import.meta.url));
const outdir = resolve(root, "dist");

const externalizeNodeModules = {
  name: "externalize-node-modules",
  setup(b) {
    b.onResolve({ filter: /.*/ }, (args) => {
      if (args.kind === "entry-point") return undefined;
      const p = args.path;
      // Inline our own source (relative paths + workspace packages); externalize
      // every third-party bare import so node resolves it from node_modules.
      if (p.startsWith(".") || p.startsWith("/") || p.startsWith("@shareef-money/")) {
        return undefined;
      }
      return { path: p, external: true };
    });
  },
};

rmSync(outdir, { recursive: true, force: true });

await build({
  entryPoints: [resolve(root, "src/index.ts"), resolve(root, "src/migrate.ts")],
  outdir,
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  plugins: [externalizeNodeModules],
});

// Drizzle migration SQL must ship next to the bundle (migrate.ts resolves
// ./drizzle relative to dist/).
cpSync(resolve(root, "../../packages/db/drizzle"), resolve(outdir, "drizzle"), {
  recursive: true,
});

console.log("Built dist/index.js, dist/migrate.js and dist/drizzle");
