// Post-build check for the JSON-LD in components/schema.njk.
//
// WHY THIS EXISTS: a Nunjucks syntax error inside schema.njk does NOT fail the
// build. Eleventy swallows it, the include renders as an empty string, every
// page ships with no structured data, and `npm run build` still exits 0. That
// happened while the include was being written. A green build is not evidence
// that the schema shipped, so this asserts it separately.
//
// Run after a build:  node tools/check-schema.mjs
// Exits non-zero and prints every failure.
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const SITE = path.join(process.cwd(), "_site");

function htmlFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) return htmlFiles(full);
    return full.endsWith(".html") ? [full] : [];
  });
}

const failures = [];
const notes = [];

for (const file of htmlFiles(SITE)) {
  const rel = path.relative(SITE, file);
  const html = readFileSync(file, "utf8");
  const noindex = /<meta name="robots" content="noindex"/.test(html);
  const blocks = [
    ...html.matchAll(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g
    ),
  ];

  if (noindex) {
    if (blocks.length) failures.push(`${rel}: noindex page carries JSON-LD`);
    else notes.push(`${rel}: noindex, no JSON-LD (correct)`);
    continue;
  }

  if (blocks.length === 0) {
    failures.push(
      `${rel}: NO JSON-LD. Usually a Nunjucks syntax error in ` +
        `src/_includes/components/schema.njk. Reproduce the real error with ` +
        `node tools/schema-fixture-test.mjs`
    );
    continue;
  }
  if (blocks.length > 1) {
    failures.push(`${rel}: ${blocks.length} JSON-LD blocks; expected 1`);
  }

  let data;
  try {
    data = JSON.parse(blocks[0][1]);
  } catch (e) {
    failures.push(`${rel}: JSON-LD does not parse: ${e.message}`);
    continue;
  }

  const graph = data["@graph"] || [];
  const business = graph.find((n) => n["@id"] && n["@id"].endsWith("#business"));
  if (!business) {
    failures.push(`${rel}: graph has no business node`);
    continue;
  }
  if (!business.name) failures.push(`${rel}: business node has no name`);
  if (!business.address)
    failures.push(
      `${rel}: business node has no address. Google requires name + address ` +
        `for a local business result. Set contact.address or contact.address_parts.`
    );

  // Absolute-URL rule: JSON-LD image/logo/url must not be root-relative.
  for (const key of ["url", "logo"]) {
    if (typeof business[key] === "string" && business[key].startsWith("/"))
      failures.push(`${rel}: business.${key} is not an absolute URL`);
  }
  for (const img of [].concat(business.image || []))
    if (typeof img === "string" && img.startsWith("/"))
      failures.push(`${rel}: business.image entry is not an absolute URL`);

  // A trailing slash on business.url in site.yaml produces "https://x.com//"
  // in every @id and canonical. The rest of the template assumes no trailing
  // slash too, so catch it here rather than shipping split entity ids.
  const walk = (n) => {
    if (Array.isArray(n)) return n.forEach(walk);
    if (n && typeof n === "object") return Object.values(n).forEach(walk);
    if (typeof n === "string" && /^https?:\/\/[^/]+\/\//.test(n))
      failures.push(
        `${rel}: doubled slash in "${n}". business.url in site.yaml must ` +
          `have no trailing slash`
      );
  };
  walk(graph);
}

for (const n of notes) console.log("  ok  " + n);
if (failures.length) {
  console.error("\nJSON-LD check FAILED:\n");
  for (const f of failures) console.error("  x  " + f);
  process.exit(1);
}
console.log(`\nJSON-LD check passed across ${htmlFiles(SITE).length} pages.`);
