import axios from "axios";
import {
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ShopContext } from "../context/ShopContext";

const CategoriesBar = () => {
  const { backendUrl } = useContext(ShopContext);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const scrollerRef = useRef(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        active: "true",
        limit: "100",
        sort: "name",
      });
      const { data } = await axios.get(
        `${backendUrl}/api/category?${params.toString()}`
      );
      if (data?.success && Array.isArray(data?.categories)) {
        setCategories(data.categories);
      } else {
        toast.error(data?.message || "Failed to load categories");
      }
    } catch (err) {
      console.error(err);
      toast.error(
        err?.response?.data?.message ||
          err.message ||
          "Failed to load categories"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendUrl]);

  const hasScroll = useMemo(() => {
    const el = scrollerRef.current;
    if (!el) return false;
    return el.scrollWidth > el.clientWidth + 8;
  }, [categories, loading]);

  const scrollBy = (delta) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: "smooth" });
  };

  const onClickCategory = (cat) => {
    const value = cat?.name || cat?.slug || "";
    if (!value) return;
    navigate(`/collection?category=${encodeURIComponent(value)}`);
  };

  return (
    <section className="w-full bg-white">
      <div className="mx-auto w-full max-w-[1560px] px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between py-4">
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight">
            Shop by Category
          </h2>

          {/* Scroll buttons (hidden on small screens unless overflow exists) */}
          {hasScroll && (
            <div className="hidden sm:flex items-center gap-2">
              <button
                type="button"
                aria-label="Scroll left"
                onClick={() => scrollBy(-320)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border hover:bg-gray-50 active:scale-[0.98] transition"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Scroll right"
                onClick={() => scrollBy(320)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border hover:bg-gray-50 active:scale-[0.98] transition"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="relative">
          {/* Mobile gradient edges */}
          <div className="pointer-events-none absolute left-0 top-0 h-full w-6 bg-gradient-to-r from-white to-transparent sm:hidden" />
          <div className="pointer-events-none absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-white to-transparent sm:hidden" />

          <div
            ref={scrollerRef}
            className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar"
            style={{ scrollSnapType: "x proximity" }}
          >
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={`sk-${i}`}
                  className="min-w-[140px] max-w-[140px] shrink-0 rounded-2xl border p-3 animate-pulse"
                  style={{ scrollSnapAlign: "start" }}
                >
                  <div className="h-24 w-full rounded-xl bg-gray-100" />
                  <div className="mt-3 h-4 w-24 rounded bg-gray-100" />
                </div>
              ))
            ) : categories.length === 0 ? (
              <div className="text-sm text-gray-500 py-6">
                No categories available.
              </div>
            ) : (
              categories.map((cat) => {
                const img = cat?.image?.url;
                const label = cat?.name || cat?.slug || "Category";
                return (
                  <button
                    key={cat?._id || label}
                    onClick={() => onClickCategory(cat)}
                    className="group min-w-[160px] max-w-[160px] shrink-0 rounded-2xl border p-3 text-left hover:shadow-md active:scale-[0.99] transition"
                    style={{ scrollSnapAlign: "start" }}
                    aria-label={`Open ${label}`}
                  >
                    <div className="relative h-28 w-full overflow-hidden rounded-xl border bg-gradient-to-br from-gray-50 to-gray-100">
                      {img ? (
                        <img
                          src={img}
                          alt={label}
                          className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-400">
                          <ImageIcon className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="mt-3">
                      <span className="text-sm font-medium text-center line-clamp-1">
                        {label}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Loading footer (desktop) */}
          {loading && (
            <div className="mt-3 hidden items-center gap-2 text-xs text-gray-500 sm:flex">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading categories…
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default CategoriesBar;
