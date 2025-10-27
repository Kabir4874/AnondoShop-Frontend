import axios from "axios";
import { useContext, useEffect, useMemo, useState } from "react";
import { ShopContext } from "../context/ShopContext";

const HeadlinesTicker = () => {
  const { backendUrl } = useContext(ShopContext);
  const [headlines, setHeadlines] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchHeadlines = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          activeOnly: "1",
          page: "1",
          limit: "50",
        });
        const { data } = await axios.get(
          `${backendUrl}/api/content/headlines?${params.toString()}`
        );
        if (data?.success && Array.isArray(data.headlines)) {
          const texts = data.headlines
            .map((h) => String(h?.text || "").trim())
            .filter(Boolean);
          setHeadlines(texts);
        } else {
          setHeadlines([]);
        }
      } catch {
        setHeadlines([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHeadlines();
  }, [backendUrl]);

  // Build one logical sequence (no leading/trailing separator)
  const seq = useMemo(() => {
    return headlines.map((t, i) => (
      <div key={`h1-${i}`} className="inline-flex items-center">
        <span className="text-[12px] sm:text-sm text-white/90">{t}</span>
        {i !== headlines.length - 1 && (
          <span
            aria-hidden="true"
            className="mx-4 text-white/70 text-[12px] sm:text-sm"
          >
            •
          </span>
        )}
      </div>
    ));
  }, [headlines]);

  // Duplicate the sequence for the seamless loop and add a separator between the two sequences
  const loopContent = useMemo(() => {
    if (seq.length === 0) return null;
    return (
      <>
        <div className="inline-flex items-center">{seq}</div>
        {/* separator between the two repeated sequences so the join also has a centered dot */}
        <span
          aria-hidden="true"
          className="mx-4 text-white/70 text-[12px] sm:text-sm"
        >
          •
        </span>
        <div aria-hidden="true" className="inline-flex items-center">
          {seq}
        </div>
      </>
    );
  }, [seq]);

  if (loading) {
    return (
      <div className="w-full bg-slate-900 text-white">
        <div className="max-w-[1560px] mx-auto px-4 py-2 text-xs opacity-80">
          Loading headlines…
        </div>
      </div>
    );
  }

  if (!headlines.length) return null;

  return (
    <div className="w-full bg-slate-900 text-white select-none">
      <style>{`
        @keyframes tickerScroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .ticker__viewport {
          position: relative;
          overflow: hidden;
          -webkit-mask-image: linear-gradient(to right, transparent 0, black 48px, black calc(100% - 48px), transparent 100%);
                  mask-image: linear-gradient(to right, transparent 0, black 48px, black calc(100% - 48px), transparent 100%);
        }
        .ticker__track {
          display: inline-flex;
          white-space: nowrap;
          will-change: transform;
          animation: tickerScroll 18s linear infinite;
        }
        .ticker__track:hover { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) {
          .ticker__track { animation: none; }
        }
      `}</style>

      <div className="max-w-[1560px] mx-auto flex items-center gap-3 px-4 py-2">
        <span className="text-[11px] sm:text-xs font-semibold tracking-wider bg-white/10 px-2 py-0.5 rounded">
          HEADLINES
        </span>

        <div className="ticker__viewport flex-1" aria-label="Headlines ticker">
          <div className="ticker__track">{loopContent}</div>
        </div>
      </div>
    </div>
  );
};

export default HeadlinesTicker;
