"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import type { GlobalSearchResults } from "@/lib/services/admin-search.service";

export function AdminGlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResults | null>(null);
  const [loading, setLoading] = useState(false);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (query.length < 2) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/hard/auth/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-semibold">Global Search</h1>
      <form onSubmit={search} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users, deposits, investments, ledger…"
            className="pl-10 bg-card border-input"
          />
        </div>
        <button type="submit" className={buttonVariants()} disabled={loading}>
          Search
        </button>
      </form>

      {results ? (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">{results.totalResults} results for &quot;{results.query}&quot;</p>
          {results.groups.map((group) => (
            <div key={group.type}>
              <h2 className="mb-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
                {group.label}
              </h2>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="flex items-center justify-between rounded-lg bg-card border border-border px-4 py-3 hover:border-primary/40"
                  >
                    <span className="font-medium">{item.title}</span>
                    <span className="text-sm text-muted-foreground">{item.subtitle}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
