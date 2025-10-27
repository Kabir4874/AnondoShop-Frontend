import axios from "axios";
import { useContext, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { assets } from "../assets/assets";
import ProductItem from "../components/ProductItem";
import Title from "../components/Title";
import { ShopContext } from "../context/ShopContext";

const SIZE_OPTIONS = ["S-38", "M-40", "L-42", "XL-44", "XXL-46"];

const effectivePrice = (item) => {
  const price = Number(item?.price) || 0;
  const discount = Number(item?.discount) || 0;
  if (!price) return 0;
  if (!discount) return price;
  return Math.max(0, price - (price * discount) / 100);
};

const Collection = () => {
  const {
    products = [],
    search,
    showSearch,
    backendUrl,
  } = useContext(ShopContext);

  const [searchParams] = useSearchParams();
  const initialCategoryFromURL = (searchParams.get("category") || "").trim();

  const [showFilter, setShowFilter] = useState(false);

  // Dynamic categories (fetched)
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Filter state
  const [category, setCategory] = useState([]);
  const [subCategory, setSubCategory] = useState([]); // kept if you still use subCategory in products
  const [sizes, setSizes] = useState([]);
  const [bestSellerOnly, setBestSellerOnly] = useState(false);
  const [discountOnly, setDiscountOnly] = useState(false);
  const [sortType, setSortType] = useState("relevant");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  // Fetch categories (active only)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        // Your controller expects `active=true|false`
        const params = new URLSearchParams({
          active: "true",
          limit: "200",
          sort: "name",
        });
        const { data } = await axios.get(
          `${backendUrl}/api/category?${params.toString()}`
        );
        if (data?.success) {
          setCategoryOptions(
            Array.isArray(data.categories) ? data.categories : []
          );
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
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [backendUrl]);

  // Apply category from URL on mount & whenever it changes
  useEffect(() => {
    if (initialCategoryFromURL) {
      setCategory([initialCategoryFromURL]);
      // make filters visible on mobile to highlight the selection
      setShowFilter(true);
    }
  }, [initialCategoryFromURL]);

  const { globalMinPrice, globalMaxPrice } = useMemo(() => {
    if (!products || products.length === 0)
      return { globalMinPrice: 0, globalMaxPrice: 0 };
    let min = Infinity;
    let max = -Infinity;
    for (const p of products) {
      const price = Number(p?.price) || 0;
      if (price < min) min = price;
      if (price > max) max = price;
    }
    return {
      globalMinPrice: min === Infinity ? 0 : min,
      globalMaxPrice: max === -Infinity ? 0 : max,
    };
  }, [products]);

  const toggleValue = (val, setter) =>
    setter((prev) =>
      prev.includes(val) ? prev.filter((i) => i !== val) : [...prev, val]
    );

  const toggleCategory = (e) => toggleValue(e.target.value, setCategory);
  const toggleSize = (e) => toggleValue(e.target.value, setSizes);

  const clearFilters = () => {
    setCategory([]);
    setSubCategory([]);
    setSizes([]);
    setBestSellerOnly(false);
    setDiscountOnly(false);
    setPriceMin("");
    setPriceMax("");
    setSortType("relevant");
  };

  const filteredProducts = useMemo(() => {
    // annotate each with original index (for stable “relevant” order & tiebreakers)
    let list = (Array.isArray(products) ? products : []).map((p, idx) => ({
      __idx: idx,
      ...p,
    }));

    // Search
    if (showSearch && search) {
      const q = String(search).toLowerCase().trim();
      if (q) {
        list = list.filter((item) => {
          const name = String(item?.name || "").toLowerCase();
          const desc = String(item?.description || "").toLowerCase();
          const sub = String(item?.subCategory || "").toLowerCase();
          return name.includes(q) || desc.includes(q) || sub.includes(q);
        });
      }
    }

    // Category (dynamic)
    if (category.length > 0) {
      list = list.filter((item) => category.includes(item?.category));
    }

    // Sub-category (if you still use it)
    if (subCategory.length > 0) {
      list = list.filter((item) => subCategory.includes(item?.subCategory));
    }

    // Sizes
    if (sizes.length > 0) {
      list = list.filter((item) => {
        const itemSizes = Array.isArray(item?.sizes) ? item.sizes : [];
        return itemSizes.some((s) => sizes.includes(s));
      });
    }

    // Flags
    if (bestSellerOnly) {
      list = list.filter((item) => !!item?.bestSeller);
    }
    if (discountOnly) {
      list = list.filter((item) => Number(item?.discount) > 0);
    }

    // Price range
    const min = priceMin === "" ? -Infinity : Number(priceMin);
    const max = priceMax === "" ? Infinity : Number(priceMax);
    if (min !== -Infinity || max !== Infinity) {
      list = list.filter((item) => {
        const p = Number(item?.price) || 0;
        return p >= min && p <= max;
      });
    }

    // Sort (by *effective* price when applicable)
    if (sortType === "low-high" || sortType === "high-low") {
      list.sort((a, b) => {
        const pa = effectivePrice(a);
        const pb = effectivePrice(b);

        // main compare by price
        const diff = sortType === "low-high" ? pa - pb : pb - pa;
        if (diff !== 0) return diff;

        // secondary: by name (localeCompare)
        const na = String(a?.name || "");
        const nb = String(b?.name || "");
        const nameDiff = na.localeCompare(nb);
        if (nameDiff !== 0) return nameDiff;

        // final tiebreaker: original index (stable)
        return a.__idx - b.__idx;
      });
    }
    // "relevant": keep original order (by __idx)
    else if (sortType === "relevant") {
      list.sort((a, b) => a.__idx - b.__idx);
    }

    // strip helper before returning
    return list.map(({ __idx, ...rest }) => rest);
  }, [
    products,
    showSearch,
    search,
    category,
    subCategory,
    sizes,
    bestSellerOnly,
    discountOnly,
    priceMin,
    priceMax,
    sortType,
  ]);

  const totalResults = filteredProducts.length;

  return (
    <div className="mx-auto w-full max-w-[1560px] px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 border-top">
      <div className="flex flex-col sm:flex-row sm:gap-10 gap-4">
        {/* Filter Column */}
        <aside className="w-full sm:min-w-64 sm:w-64">
          <button
            type="button"
            onClick={() => setShowFilter((s) => !s)}
            className="sm:hidden flex items-center justify-between w-full py-3 px-4 rounded-md border text-left text-base font-medium"
            aria-expanded={showFilter}
            aria-controls="mobile-filters"
          >
            <span className="flex items-center gap-2">
              <img
                src={assets.filter_icon || assets.dropdown_icon}
                alt=""
                className="h-4 w-4"
              />
              FILTERS
            </span>
            <img
              className={`h-3 transition-transform ${
                showFilter ? "rotate-90" : ""
              }`}
              src={assets.dropdown_icon}
              alt="Toggle filters"
            />
          </button>

          {/* Categories (dynamic) */}
          <div
            id="mobile-filters"
            className={`${
              showFilter ? "block" : "hidden"
            } sm:block mt-2 sm:mt-6 border border-gray-300 rounded-md py-3 pl-5`}
          >
            <p className="mb-3 text-sm font-medium">CATEGORIES</p>

            {loadingCategories ? (
              <div className="text-xs text-gray-500 px-1 py-1">Loading…</div>
            ) : categoryOptions.length === 0 ? (
              <div className="text-xs text-gray-500 px-1 py-1">
                No categories found.
              </div>
            ) : (
              <div className="flex flex-col gap-2 text-sm font-light text-gray-700">
                {categoryOptions.map((opt) => {
                  const val = opt?.name || opt?.slug || "";
                  if (!val) return null;
                  return (
                    <label
                      key={opt._id || val}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        className="w-3 h-3"
                        type="checkbox"
                        value={val}
                        onChange={toggleCategory}
                        checked={category.includes(val)}
                      />
                      {val}
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sizes */}
          <div
            className={`${
              showFilter ? "block" : "hidden"
            } sm:block my-4 sm:my-5 border border-gray-300 rounded-md py-3 pl-5`}
          >
            <p className="mb-3 text-sm font-medium">SIZES</p>
            <div className="flex flex-wrap gap-2 text-sm font-light text-gray-700 pr-3">
              {SIZE_OPTIONS.map((opt) => (
                <label
                  key={opt}
                  className="inline-flex items-center gap-2 cursor-pointer border rounded px-2 py-1"
                >
                  <input
                    className="w-3 h-3"
                    type="checkbox"
                    value={opt}
                    onChange={toggleSize}
                    checked={sizes.includes(opt)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>

          {/* Price range */}
          <div
            className={`${
              showFilter ? "block" : "hidden"
            } sm:block my-4 sm:my-5 border border-gray-300 rounded-md py-3 pl-5 pr-5`}
          >
            <p className="mb-3 text-sm font-medium">PRICE RANGE (৳)</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                min="0"
                placeholder={String(globalMinPrice || 0)}
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                className="w-full max-w-24 px-2 py-1 border rounded"
                aria-label="Minimum price"
              />
              <span className="text-gray-500">—</span>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                placeholder={String(globalMaxPrice || 0)}
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                className="w-full max-w-24 px-2 py-1 border rounded"
                aria-label="Maximum price"
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Data range: ৳{globalMinPrice} – ৳{globalMaxPrice}
            </p>
          </div>

          {/* Flags */}
          <div
            className={`${
              showFilter ? "block" : "hidden"
            } sm:block my-4 sm:my-5 border border-gray-300 rounded-md py-3 pl-5`}
          >
            <p className="mb-3 text-sm font-medium">FILTER BY</p>
            <div className="flex flex-col gap-2 text-sm font-light text-gray-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  className="w-3 h-3"
                  type="checkbox"
                  checked={bestSellerOnly}
                  onChange={(e) => setBestSellerOnly(e.target.checked)}
                />
                Best Sellers only
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  className="w-3 h-3"
                  type="checkbox"
                  checked={discountOnly}
                  onChange={(e) => setDiscountOnly(e.target.checked)}
                />
                On discount
              </label>
            </div>
          </div>

          {/* Clear Filters Button */}
          <button
            className={`${
              showFilter ? "inline-flex" : "hidden"
            } sm:inline-flex items-center justify-center px-4 py-2 mt-1 text-white bg-black rounded hover:bg-gray-900 w/full sm:w-auto`.replace(
              "/",
              "-"
            )}
            onClick={clearFilters}
            type="button"
          >
            Clear Filters
          </button>
        </aside>

        {/* Products Column */}
        <section className="flex-1">
          {/* Header: Title + Sort */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex flex-col">
              <Title text1={"ALL"} text2={"COLLECTIONS"} />
              <span className="text-xs text-gray-500 mt-1">
                {totalResults} result{totalResults === 1 ? "" : "s"}
              </span>
              {category.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {category.map((c) => (
                    <span
                      key={c}
                      className="text-xs px-2 py-1 rounded-full border bg-white"
                      title="Active category filter"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Sort control */}
            <label className="inline-flex items-center gap-2 text-sm sm:text-base">
              <span className="text-gray-700">Sort</span>
              <select
                onChange={(e) => setSortType(e.target.value)}
                value={sortType}
                className="px-2 py-2 text-sm border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-300 w-full sm:w-auto"
                aria-label="Sort products"
              >
                <option value="relevant">Relevant</option>
                <option value="low-high">Price: Low to High</option>
                <option value="high-low">Price: High to Low</option>
              </select>
            </label>
          </div>

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <img
                src={assets.search_icon}
                alt=""
                className="mx-auto mb-3 h-6 w-6 opacity-60"
              />
              <p className="text-sm">No products match your filters.</p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 inline-flex items-center justify-center rounded bg-black px-4 py-2 text-white hover:bg-gray-900"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-6 gap-4">
              {filteredProducts.map((item) => (
                <ProductItem
                  key={item._id ?? `${item.name}-${item.price}`}
                  id={item._id}
                  name={item.name}
                  image={item.image}
                  price={item.price}
                  discount={item.discount || 0}
                  sizes={item.sizes}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Collection;
