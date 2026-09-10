// Patch @clerk/nextjs for Next.js 16 / React 19 / Node 24 compatibility
const fs = require('fs');
const path = require('path');

function patchFile(filePath, transforms) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  for (const { search, replace } of transforms) {
    if (content.includes(search)) {
      content = content.replace(search, replace);
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[patch-clerk] Patched ${filePath}`);
  }
}

const cjsUtils = path.join(__dirname, '..', 'node_modules', '@clerk', 'nextjs', 'dist', 'cjs', 'app-router', 'server', 'utils.js');
const esmUtils = path.join(__dirname, '..', 'node_modules', '@clerk', 'nextjs', 'dist', 'esm', 'app-router', 'server', 'utils.js');
const cjsProvider = path.join(__dirname, '..', 'node_modules', '@clerk', 'nextjs', 'dist', 'cjs', 'app-router', 'server', 'ClerkProvider.js');
const esmProvider = path.join(__dirname, '..', 'node_modules', '@clerk', 'nextjs', 'dist', 'esm', 'app-router', 'server', 'ClerkProvider.js');

// Support Next 16 async headers & workUnitAsyncStorage
const targetBuildRequestLike = `const buildRequestLike = () => {
  try {
    let h;
    try {
      const { workUnitAsyncStorage } = require("next/dist/server/app-render/work-unit-async-storage.external");
      const store = workUnitAsyncStorage && workUnitAsyncStorage.getStore();
      if (store && store.headers) {
        h = store.headers;
      }
    } catch {}
    if (!h) {
      const { headers } = require("next/headers");
      h = headers();
    }
    const cleanHeaders = new Headers();
    if (h && typeof h.forEach === "function") {
      h.forEach((v, k) => {
        if (typeof k === "string" && typeof v === "string") cleanHeaders.set(k, v);
      });
    } else if (h && typeof h.entries === "function") {
      for (const [k, v] of h.entries()) {
        if (typeof k === "string" && typeof v === "string") cleanHeaders.set(k, v);
      }
    } else if (h && typeof h === "object") {
      for (const [k, v] of Object.entries(h)) {
        if (typeof k === "string" && typeof v === "string") cleanHeaders.set(k, v);
      }
    }
    return new`;

patchFile(cjsUtils, [
  {
    search: `const buildRequestLike = () => {\n  try {\n    const { headers } = require("next/headers");\n    const h = headers();\n    return new import_server.NextRequest("https://placeholder.com", { headers: h });`,
    replace: `${targetBuildRequestLike} import_server.NextRequest("https://placeholder.com", { headers: cleanHeaders });`
  }
]);

patchFile(esmUtils, [
  {
    search: `const buildRequestLike = () => {\n  try {\n    const { headers } = require("next/headers");\n    const h = headers();\n    return new NextRequest("https://placeholder.com", { headers: h });`,
    replace: `${targetBuildRequestLike} NextRequest("https://placeholder.com", { headers: cleanHeaders });`
  }
]);

patchFile(cjsProvider, [
  {
    search: `const cspHeader = (0, import_headers.headers)().get("Content-Security-Policy");`,
    replace: `let cspHeader;
  try {
    const { workUnitAsyncStorage } = require("next/dist/server/app-render/work-unit-async-storage.external");
    const store = workUnitAsyncStorage && workUnitAsyncStorage.getStore();
    if (store && store.headers) {
      cspHeader = store.headers.get("Content-Security-Policy");
    }
  } catch {}`
  }
]);

patchFile(esmProvider, [
  {
    search: `const cspHeader = headers().get("Content-Security-Policy");`,
    replace: `let cspHeader;
  try {
    const { workUnitAsyncStorage } = require("next/dist/server/app-render/work-unit-async-storage.external");
    const store = workUnitAsyncStorage && workUnitAsyncStorage.getStore();
    if (store && store.headers) {
      cspHeader = store.headers.get("Content-Security-Policy");
    }
  } catch {}`
  }
]);

// Patch server-actions.js: cookies() returns a Promise in Next.js 16
const esmServerActions = path.join(__dirname, '..', 'node_modules', '@clerk', 'nextjs', 'dist', 'esm', 'app-router', 'server-actions.js');
patchFile(esmServerActions, [
  {
    search: `return cookies().delete(`,
    replace: `return (await cookies()).delete(`
  }
]);
