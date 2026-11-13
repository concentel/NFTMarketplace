import type { NextConfig } from "next";
import { readFileSync } from "node:fs";
import { networkInterfaces } from "node:os";

/* On a deployment without SESSION_SECRET, the build generates one
   (scripts/setup.mjs → .data/deploy-secret) and it is built into the server code
   here, so every server and the proxy share it. Never in git. */
function deploySecret(): string | undefined {
  if (process.env.SESSION_SECRET) return undefined;
  try {
    return readFileSync(".data/deploy-secret", "utf8").trim() || undefined;
  } catch {
    return undefined;
  }
}

const generated = deploySecret();

/* `next dev` only serves its dev resources (the hot-reload socket /_next/hmr and
   the dev chunks) to pages opened at localhost. Opening the site at 127.0.0.1 or at
   this machine's network address (the "Network:" line next dev prints) otherwise
   fails the socket handshake and logs "WebSocket connection … failed" in the browser
   console on every load. Allow this machine's own addresses, plus any extra hosts
   listed in DEV_ORIGINS (comma-separated). Development only: next build ignores it. */
function devOrigins(): string[] {
  const own = Object.values(networkInterfaces())
    .flat()
    .filter((i) => i && i.family === "IPv4")
    .map((i) => i!.address);
  const extra = (process.env.DEV_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return [...new Set(["127.0.0.1", ...own, ...extra])];
}

const nextConfig: NextConfig = {
  /* Database drivers must stay outside the bundle: pg is native,
     PGlite ships WebAssembly. */
  serverExternalPackages: ["@electric-sql/pglite", "pg"],

  allowedDevOrigins: devOrigins(),

  ...(generated ? { env: { DEPLOY_SESSION_SECRET: generated } } : {}),

  /* Files read at run time must ship with the server code on serverless hosts:
     originals for the image routes, and the demo database the build prepared. */
  outputFileTracingIncludes: {
    "/**": ["./.data/deploy-db.tar.gz"],
    "/api/media/[id]": ["./public/assets/nft/**/*", "./private/nft/**/*"],
    "/api/media/creator/[slug]": ["./public/assets/creators/**/*", "./private/creators/**/*"],
    "/api/health": ["./public/assets/nft/catalog.csv", "./private/nft/catalog.csv"],
  },
};

export default nextConfig;
