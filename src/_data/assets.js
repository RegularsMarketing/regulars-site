// Content-hashed URLs for the code assets (CSS/JS), exposed to templates as
// the global `assets`.
//
// WHY THIS EXISTS: src/_headers serves /assets/* with
//   Cache-Control: public, max-age=31536000, immutable
// `immutable` tells browsers "never revalidate — this URL's bytes will never
// change." That is only safe when the URL changes as the content does.
//
// Our code assets have stable filenames (styles.css, site.js, animations.js),
// so between 2026-07-13 and 2026-07-19 every CSS and JS change silently failed
// to reach any returning visitor — their browser had been told to hold the old
// copy for a year. Appending a short content hash fixes that: edit the file and
// the URL changes, so caches miss and fetch the new bytes.
//
// Images under /assets/ already have UUID filenames, so the immutable rule is
// correct for them and they are left alone.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

function v(relPath) {
  try {
    const buf = readFileSync(path.join(process.cwd(), relPath));
    return createHash("sha256").update(buf).digest("hex").slice(0, 10);
  } catch {
    // Missing file shouldn't break the build; fall back to a constant so the
    // page still renders (and the missing asset is obvious in the network tab).
    return "missing";
  }
}

export default function () {
  return {
    styles: `/assets/styles.css?v=${v("src/assets/styles.css")}`,
    animations: `/assets/animations.js?v=${v("src/assets/animations.js")}`,
    site: `/assets/site.js?v=${v("src/assets/site.js")}`,
    motion: `/assets/vendor/motion.js?v=${v("node_modules/motion/dist/motion.js")}`,
  };
}
