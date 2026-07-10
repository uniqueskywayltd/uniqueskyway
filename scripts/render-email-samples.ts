/**
 * Renders all email templates to static HTML files for offline review.
 * Usage: npm run email:preview
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { render } from "@react-email/components";
import { emailPreviewRegistry } from "../src/emails/preview-registry";

const categories = ["Account", "Security", "Financial", "Platform"] as const;

async function main() {
  const outDir = path.join(process.cwd(), "email-previews");
  await mkdir(outDir, { recursive: true });

  const sections: string[] = [];

  for (const category of categories) {
    const items = emailPreviewRegistry.filter((e) => e.category === category);
    if (items.length === 0) continue;

    sections.push(`<section class="category" id="${category.toLowerCase()}">`);
    sections.push(`<h2>${category}</h2>`);
    sections.push(`<div class="grid">`);

    for (const entry of items) {
      const html = await render(entry.element);
      const filename = `${entry.id}.html`;
      await writeFile(path.join(outDir, filename), html, "utf8");
      sections.push(`
        <article class="card">
          <header>
            <div>
              <h3>${entry.label}</h3>
              <p class="id">${entry.id}</p>
            </div>
            <a href="./${filename}" target="_blank" rel="noopener">Open raw HTML</a>
          </header>
          <iframe title="${entry.label}" src="./${filename}" loading="lazy"></iframe>
        </article>`);
      console.log(`✓ ${filename}`);
    }

    sections.push(`</div></section>`);
  }

  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Unique Sky Way — Email previews</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #020617;
      color: #e2e8f0;
      padding: 32px 20px 64px;
    }
    .wrap { max-width: 1200px; margin: 0 auto; }
    h1 { font-size: 1.75rem; margin: 0 0 8px; }
    .sub { color: #94a3b8; margin: 0 0 28px; font-size: 0.95rem; }
    nav { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 40px; }
    nav a {
      color: #f8fafc;
      text-decoration: none;
      font-size: 0.8rem;
      padding: 6px 12px;
      border-radius: 999px;
      border: 1px solid rgba(148,163,184,0.2);
      background: rgba(15,23,42,0.8);
    }
    nav a:hover { border-color: #f59e0b; color: #f59e0b; }
    .category { margin-bottom: 48px; }
    .category h2 {
      font-size: 1.1rem;
      color: #f59e0b;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      margin: 0 0 16px;
    }
    .grid { display: grid; gap: 24px; }
    .card {
      border: 1px solid rgba(148,163,184,0.14);
      border-radius: 12px;
      overflow: hidden;
      background: #0f172a;
    }
    .card header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 16px;
      border-bottom: 1px solid rgba(148,163,184,0.12);
    }
    .card h3 { margin: 0; font-size: 0.95rem; }
    .card .id { margin: 4px 0 0; font-size: 0.75rem; color: #64748b; }
    .card header a { font-size: 0.75rem; color: #f59e0b; white-space: nowrap; }
    iframe {
      display: block;
      width: 100%;
      height: 720px;
      border: 0;
      background: #020617;
    }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>Unique Sky Way — Email previews</h1>
    <p class="sub">${emailPreviewRegistry.length} templates · dark logo header · dark footer · fintech layout</p>
    <nav>
      ${categories.map((c) => `<a href="#${c.toLowerCase()}">${c}</a>`).join("\n      ")}
    </nav>
    ${sections.join("\n")}
  </div>
</body>
</html>`;

  await writeFile(path.join(outDir, "index.html"), indexHtml, "utf8");
  console.log(`\n✓ Gallery: file://${path.join(outDir, "index.html")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
