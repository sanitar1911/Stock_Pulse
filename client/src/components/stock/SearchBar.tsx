import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/i18n";

interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
}

interface Props {
  onSelect: (symbol: string) => void;
}

export default function SearchBar({ onSelect }: Props) {
  const t = useT();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const search = (q: string) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 1) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(data);
        setOpen(data.length > 0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const select = (symbol: string) => {
    setQuery(symbol);
    setOpen(false);
    onSelect(symbol);
  };

  return (
    <div ref={ref} className="relative w-full max-w-md" data-testid="search-container">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          data-testid="input-search"
          placeholder={t("search.placeholder")}
          value={query}
          onChange={(e) => search(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          className="pl-10 pr-8 bg-card border-border"
        />
        {query && (
          <button
            data-testid="button-clear-search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => { setQuery(""); setResults([]); setOpen(false); }}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-72 overflow-y-auto">
          {loading ? (
            <div className="p-3 text-sm text-muted-foreground">{t("loading")}</div>
          ) : (
            results.map((r) => (
              <button
                key={r.symbol}
                data-testid={`search-result-${r.symbol}`}
                className="w-full text-left px-4 py-2.5 hover:bg-muted/50 flex items-center justify-between transition-colors"
                onClick={() => select(r.symbol)}
              >
                <div>
                  <span className="font-semibold text-foreground">{r.symbol}</span>
                  <span className="ml-2 text-sm text-muted-foreground">{r.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">{r.exchange}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
