// Loads the single config file (content/site.yaml) and exposes it to every
// template as the global `site`. This is the ONLY file you edit to spin up a
// new client site (plus swapping the images in src/assets/).
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

export default function () {
  const file = path.join(process.cwd(), "content", "site.yaml");
  return yaml.load(fs.readFileSync(file, "utf8"));
}
