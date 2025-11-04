import axios from "axios";
import { Image as ImageIcon, Loader2 } from "lucide-react";
import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ShopContext } from "../context/ShopContext";

const CategoriesBar = () => {
  const { backendUrl } = useContext(ShopContext);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

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

  const onClickCategory = (cat) => {
    const value = cat?.name || cat?.slug || "";
    if (!value) return;
    navigate(`/collection?category=${encodeURIComponent(value)}`);
  };

  // Slightly larger skeleton count to fill a dense grid
  const skeletonCount = useMemo(() => 18, []);

  return (
    <section className="w-full bg-white">
      <div className="mx-auto w-full max-w-[1560px] px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between py-3">
          <h2 className="text-base sm:text-lg font-semibold tracking-tight">
            Shop by Category
          </h2>
        </div>

        {/* Content */}
        <div className="relative">
          {loading ? (
            <div
              className="
                grid gap-2
                grid-cols-3
                xs:grid-cols-4
                sm:grid-cols-6
                md:grid-cols-8
                lg:grid-cols-10
                xl:grid-cols-12
              "
            >
              {Array.from({ length: skeletonCount }).map((_, i) => (
                <div
                  key={`sk-${i}`}
                  className="rounded-xl border p-2 animate-pulse"
                >
                  <div className="h-20 w-full rounded-lg bg-gray-100" />
                  <div className="mt-2 h-3 w-20 rounded bg-gray-100" />
                </div>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="text-sm text-gray-500 py-6">
              No categories available.
            </div>
          ) : (
            <div
              className="
                grid gap-2
                grid-cols-3
                xs:grid-cols-4
                sm:grid-cols-6
                md:grid-cols-8
                lg:grid-cols-10
                xl:grid-cols-12
              "
            >
              {categories.map((cat) => {
                const img = cat?.image?.url;
                const label = cat?.name || cat?.slug || "Category";
                return (
                  <button
                    key={cat?._id || label}
                    onClick={() => onClickCategory(cat)}
                    className="group rounded-xl border p-2 text-left hover:shadow-sm active:scale-[0.99] transition"
                    aria-label={`Open ${label}`}
                  >
                    <div className="relative h-20 w-full overflow-hidden rounded-lg border bg-gradient-to-br from-gray-50 to-gray-100">
                      {img ? (
                        <img
                          src={img}
                          alt={label}
                          className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-400">
                          <ImageIcon className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div className="mt-2">
                      <span className="block text-xs font-medium text-center line-clamp-1">
                        {label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Loading footer (desktop) */}
          {loading && (
            <div className="mt-2 hidden items-center gap-2 text-xs text-gray-500 sm:flex">
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
