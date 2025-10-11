import { useContext, useEffect, useMemo, useState } from "react";
import { assets } from "../assets/assets";
import ProductItem from "../components/ProductItem";
import Title from "../components/Title";
import { ShopContext } from "../context/ShopContext";

const Collection = () => {
  const { products = [], search, showSearch } = useContext(ShopContext);

  const [showFilter, setShowFilter] = useState(false);
  const [filterProducts, setFilterProducts] = useState([]);
  const [category, setCategory] = useState([]);
  const [subCategory, setSubCategory] = useState([]);
  const [sortType, setSortType] = useState("relevant");

  const toggleCategory = (e) => {
    const val = e.target.value;
    setCategory((prev) =>
      prev.includes(val) ? prev.filter((item) => item !== val) : [...prev, val]
    );
  };

  const toggleSubCategory = (e) => {
    const val = e.target.value;
    setSubCategory((prev) =>
      prev.includes(val) ? prev.filter((item) => item !== val) : [...prev, val]
    );
  };

  const applyFilter = () => {
    let productsCopy = products.slice();

    if (showSearch && search) {
      const q = search.toLowerCase();
      productsCopy = productsCopy.filter((item) =>
        item.name.toLowerCase().includes(q)
      );
    }

    if (category.length > 0) {
      productsCopy = productsCopy.filter((item) =>
        category.includes(item.category)
      );
    }

    if (subCategory.length > 0) {
      productsCopy = productsCopy.filter((item) =>
        subCategory.includes(item.subCategory)
      );
    }

    setFilterProducts(productsCopy);
  };

  const sortProduct = () => {
    const fpCopy = filterProducts.slice();
    switch (sortType) {
      case "low-high":
        setFilterProducts(fpCopy.sort((a, b) => a.price - b.price));
        break;
      case "high-low":
        setFilterProducts(fpCopy.sort((a, b) => b.price - a.price));
        break;
      default:
        applyFilter();
        break;
    }
  };

  const clearFilters = () => {
    setCategory([]);
    setSubCategory([]);
  };

  const totalResults = useMemo(() => filterProducts.length, [filterProducts]);

  useEffect(() => {
    applyFilter();
  }, [category, subCategory, search, showSearch, products]);

  useEffect(() => {
    sortProduct();
  }, [sortType]);

  return (
    <div className="mx-auto w-full max-w-[1560px] px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 border-t">
      <div className="flex flex-col sm:flex-row sm:gap-10 gap-4">
        {/* Filter Column */}
        <aside className="w-full sm:min-w-60 sm:w-60">
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

          {/* Category Filters */}
          <div
            id="mobile-filters"
            className={`${
              showFilter ? "block" : "hidden"
            } sm:block mt-2 sm:mt-6 border border-gray-300 rounded-md py-3 pl-5`}
          >
            <p className="mb-3 text-sm font-medium">CATEGORIES</p>
            <div className="flex flex-col gap-2 text-sm font-light text-gray-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  className="w-3 h-3"
                  type="checkbox"
                  value="Men"
                  onChange={toggleCategory}
                  checked={category.includes("Men")}
                />
                Men
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  className="w-3 h-3"
                  type="checkbox"
                  value="Women"
                  onChange={toggleCategory}
                  checked={category.includes("Women")}
                />
                Women
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  className="w-3 h-3"
                  type="checkbox"
                  value="Kids"
                  onChange={toggleCategory}
                  checked={category.includes("Kids")}
                />
                Kids
              </label>
            </div>
          </div>

          {/* Sub Category Filters */}
          <div
            className={`${
              showFilter ? "block" : "hidden"
            } sm:block my-4 sm:my-5 border border-gray-300 rounded-md py-3 pl-5`}
          >
            <p className="mb-3 text-sm font-medium">TYPES</p>
            <div className="flex flex-col gap-2 text-sm font-light text-gray-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  className="w-3 h-3"
                  type="checkbox"
                  value="Topwear"
                  onChange={toggleSubCategory}
                  checked={subCategory.includes("Topwear")}
                />
                Topwear
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  className="w-3 h-3"
                  type="checkbox"
                  value="Bottomwear"
                  onChange={toggleSubCategory}
                  checked={subCategory.includes("Bottomwear")}
                />
                Bottomwear
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  className="w-3 h-3"
                  type="checkbox"
                  value="Winterwear"
                  onChange={toggleSubCategory}
                  checked={subCategory.includes("Winterwear")}
                />
                Winterwear
              </label>
            </div>
          </div>

          {/* Clear Filters Button */}
          <button
            className={`${
              showFilter ? "inline-flex" : "hidden"
            } sm:inline-flex items-center justify-center px-4 py-2 mt-1 text-white bg-black rounded hover:bg-gray-900 w-full sm:w-auto`}
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
          {filterProducts.length === 0 ? (
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
              {filterProducts.map((item, index) => (
                <ProductItem
                  key={index}
                  id={item._id}
                  name={item.name}
                  image={item.image}
                  price={item.price}
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
