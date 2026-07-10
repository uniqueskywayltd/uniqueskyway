import { render } from "@react-email/components";
import { notFound } from "next/navigation";
import Link from "next/link";
import { emailPreviewRegistry } from "@/emails/preview-registry";

export const metadata = {
  title: "Email previews — Unique Sky Way",
  robots: "noindex, nofollow",
};

async function renderAll() {
  return Promise.all(
    emailPreviewRegistry.map(async (entry) => ({
      ...entry,
      html: await render(entry.element),
    })),
  );
}

export default async function EmailPreviewPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const previews = await renderAll();
  const categories = ["Account", "Security", "Financial", "Platform"] as const;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/95 px-6 py-5 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-amber-400">
              Development only
            </p>
            <h1 className="text-2xl font-semibold text-white">Email template previews</h1>
            <p className="mt-1 text-sm text-slate-400">
              {previews.length} templates · dark header & footer · fintech layout
            </p>
          </div>
          <nav className="flex flex-wrap gap-2 text-sm">
            {categories.map((cat) => (
              <a
                key={cat}
                href={`#${cat.toLowerCase()}`}
                className="rounded-full border border-white/10 px-3 py-1 text-slate-300 hover:border-white/20 hover:text-white"
              >
                {cat}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-16 px-6 py-10">
        {categories.map((category) => {
          const items = previews.filter((p) => p.category === category);
          if (items.length === 0) return null;

          return (
            <section key={category} id={category.toLowerCase()}>
              <h2 className="mb-6 text-lg font-semibold text-white">{category}</h2>
              <div className="grid gap-10">
                {items.map((preview) => (
                  <article
                    key={preview.id}
                    className="overflow-hidden rounded-xl border border-white/10 bg-slate-900/50"
                  >
                    <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
                      <div>
                        <h3 className="font-medium text-white">{preview.label}</h3>
                        <p className="text-xs text-slate-500">{preview.id}</p>
                      </div>
                      <Link
                        href={`/dev/emails/${preview.id}`}
                        className="text-xs text-amber-400 hover:text-amber-300"
                        target="_blank"
                      >
                        Open full screen
                      </Link>
                    </div>
                    <iframe
                      title={preview.label}
                      srcDoc={preview.html}
                      className="h-[720px] w-full bg-slate-950"
                      sandbox="allow-same-origin"
                    />
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
