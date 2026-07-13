// Eleventy build configuration.
// Turns the templates in src/ + the single config file (content/site.yaml)
// into a plain static site in _site/. Deployed by Cloudflare Pages.
export default function (eleventyConfig) {
  // Convert **bold** in config copy to <strong>, HTML-escaping the rest.
  eleventyConfig.addFilter("mdBold", function (str) {
    if (str === undefined || str === null) return "";
    const esc = String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return esc.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  });

  // Group an array of objects by a key (used by the categorized menu grid).
  eleventyConfig.addFilter("groupBy", function (arr, key) {
    const out = {};
    (arr || []).forEach((item) => {
      const k = item[key];
      (out[k] = out[k] || []).push(item);
    });
    return out;
  });

  // Static assets copied through untouched.
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ admin: "admin" });
  eleventyConfig.addPassthroughCopy({ "src/robots.txt": "robots.txt" });
  eleventyConfig.addPassthroughCopy({ "src/_headers": "_headers" });

  // Rebuild when the config or content changes.
  eleventyConfig.addWatchTarget("content/");

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site",
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    templateFormats: ["njk", "html", "md"],
  };
}
