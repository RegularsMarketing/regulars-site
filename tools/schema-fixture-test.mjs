// Renders src/_includes/components/schema.njk against a RESTAURANT fixture,
// using the real filters from eleventy.config.js. Reads no repo config and
// writes nothing, so it never touches content/site.yaml.
//
// WHY THIS EXISTS: Regulars' own site.yaml is a marketing agency, so a normal
// build never exercises the restaurant half of the include: Restaurant type,
// PostalAddress, geo, openingHoursSpecification, servesCuisine, hasMenu, and
// the Menu / MenuSection / MenuItem nodes are all dead code in this repo and
// only wake up on a client copy. This fixture exercises them here.
//
// It also renders a config string containing a literal </script> and both
// quote characters, proving the dump + escape path cannot break out of the
// script element or corrupt a value.
//
// Run:  npm run check:schema:fixture
//       npm run check:schema:fixture -- --print   (dumps the whole graph)
//
// CAVEAT: `nunjucks` is not a declared dependency of this repo. It resolves
// because Eleventy depends on it and npm hoists it. If a future Eleventy drops
// or nests nunjucks this test breaks while the site keeps building. The fix is
// `npm i -D nunjucks`, deliberately not done here so the lockfile stays as the
// deploy pipeline expects.
import nunjucks from "nunjucks";
import configure from "../eleventy.config.js";

const filters = {};
const noop = () => {};
configure({
  addFilter: (n, f) => (filters[n] = f),
  addPassthroughCopy: noop,
  addWatchTarget: noop,
});

const env = new nunjucks.Environment(
  new nunjucks.FileSystemLoader(new URL("../src/_includes", import.meta.url).pathname),
  { autoescape: true }
);
for (const [n, f] of Object.entries(filters)) env.addFilter(n, f);

const site = {
  business: {
    name: "Bella Sera Trattoria",
    tagline: "Hand-rolled pasta, six blocks from home.",
    url: "https://bellaseratrattoria.com",
    lang: "en",
  },
  images: { logo_mark: "/assets/logo-mark.webp", hero_logo: "/assets/hero.webp" },
  nav: { links: [{ label: "Menu", url: "/services/" }] },
  contact: {
    email: "eat@bellaseratrattoria.com",
    phone: "(717) 555-0142",
    phone_e164: "+17175550142",
    address: "119 Market St, Harrisburg, PA 17101",
    address_parts: {
      street: "119 Market St",
      locality: "Harrisburg",
      region: "PA",
      postal_code: "17101",
      country: "US",
    },
    geo: { lat: 40.2603, lng: -76.8828 },
    social: [
      { label: "Instagram", url: "https://instagram.com/bellasera" },
      { label: "Facebook", url: "https://facebook.com/bellasera" },
    ],
    hours: [{ days: "Mon – Fri", hours: "5:00pm – 10:00pm" }],
    hours_machine: [
      { days: ["Tuesday", "Wednesday", "Thursday"], opens: "17:00", closes: "21:00" },
      { days: ["Friday", "Saturday"], opens: "17:00", closes: "22:00" },
      { days: ["Sunday", "Monday"], closed: true },
    ],
  },
  seo: {
    schema: {
      type: "Restaurant",
      description: "A twelve-table trattoria in downtown Harrisburg.",
      serves_cuisine: ["Italian", "Mediterranean"],
      price_range: "$$",
      currency: "USD",
      accepts_reservations: "https://bellaseratrattoria.com/reservations/",
      menu_url: "/services/",
      menu_name: "Dinner Menu",
      images: ["/assets/room.webp", "https://cdn.example.com/pasta.jpg"],
      area_served: "Harrisburg, PA",
    },
  },
  menu_items: [
    {
      title: "Cacio e Pepe",
      short: "Pecorino, black pepper, nothing else.",
      description: "Tonnarelli, aged pecorino romano, cracked black pepper.",
      category: "Pasta",
      price: "$21",
      price_value: 21,
    },
    {
      title: "Chef's \"famous\" tiramisu </script><b>x</b>",
      description: "Mascarpone, espresso, cocoa. It's the one.",
      category: "Dolci",
    },
  ],
  pages: {
    menu: { seo_title: "Menu | Bella Sera", seo_description: "Our dinner menu." },
  },
};

const out = env.render("components/schema.njk", {
  site,
  page: { url: "/services/" },
  pageKey: "menu",
  title: "Menu",
  description: "Our dinner menu.",
});

const m = out.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
if (!m) {
  console.error("FAIL: no ld+json emitted. Raw output:\n" + out.slice(0, 800));
  process.exit(1);
}

const raw = m[1];
const graph = JSON.parse(raw)["@graph"];
const node = (t) => graph.find((n) => n["@type"] === t);
const biz = node("Restaurant");
const menu = node("Menu");

const checks = [
  ["script element cannot be closed early", !/<\/script>/.test(raw)],
  ["business typed Restaurant", !!biz],
  ["apostrophes and quotes survive intact",
    menu.hasMenuSection[1].hasMenuItem[0].name.includes('"famous"')],
  ["address is a PostalAddress", biz.address["@type"] === "PostalAddress"],
  ["geo present", biz.geo.latitude === 40.2603],
  ["3 opening-hours rules", biz.openingHoursSpecification.length === 3],
  ["closed day is 00:00/00:00",
    biz.openingHoursSpecification[2].opens === "00:00" &&
      biz.openingHoursSpecification[2].closes === "00:00"],
  ["servesCuisine present", biz.servesCuisine.length === 2],
  ["priceRange present", biz.priceRange === "$$"],
  ["acceptsReservations present", !!biz.acceptsReservations],
  ["hasMenu points at the Menu node", biz.hasMenu === menu["@id"]],
  ["e164 phone preferred", biz.telephone === "+17175550142"],
  ["relative image absolutised",
    biz.image[0] === "https://bellaseratrattoria.com/assets/room.webp"],
  ["absolute image left alone", biz.image[1] === "https://cdn.example.com/pasta.jpg"],
  ["sameAs from contact.social", biz.sameAs.length === 2],
  ["menu grouped into sections", menu.hasMenuSection.length === 2],
  ["numeric price becomes an Offer",
    menu.hasMenuSection[0].hasMenuItem[0].offers.price === 21],
  ["item without price_value has no Offer",
    menu.hasMenuSection[1].hasMenuItem[0].offers === undefined],
  ["breadcrumb uses the nav label",
    node("BreadcrumbList").itemListElement[1].name === "Menu"],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log((ok ? "  ok  " : "  x   ") + label);
  if (!ok) failed++;
}
if (process.argv.includes("--print")) console.log(JSON.stringify(JSON.parse(raw), null, 2));
if (failed) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}
console.log("\nRestaurant fixture passed.");
