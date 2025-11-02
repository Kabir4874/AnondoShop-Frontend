import { useContext, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";

/**
 * ProductItem (NO CART)
 * - Only "Buy Now"
 * - Opens a quick size modal (light theme to match project)
 * - Selecting a size stores a single-item payload to localStorage("checkoutItems")
 *   and navigates to "/place-order"
 */
const ProductItem = ({
  id,
  image = [],
  name,
  price,
  discount = 0,
  sizes = [],
}) => {
  const { navigate } = useContext(ShopContext);
  const [open, setOpen] = useState(false);

  const firstImage =
    Array.isArray(image) && image.length
      ? typeof image[0] === "string"
        ? image[0]
        : image[0]?.url
      : "";

  const basePrice = Number(price) || 0;
  const finalBase = useMemo(() => {
    const d = Number(discount) || 0;
    return d > 0 ? Math.max(0, basePrice - (basePrice * d) / 100) : basePrice;
  }, [basePrice, discount]);

  const formatBDT = (val) =>
    (Number(val) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  const isXXL = (s) =>
    String(s || "")
      .toUpperCase()
      .startsWith("XXL");

  const onBuyNow = () => {
    if (!Array.isArray(sizes) || sizes.length === 0) {
      // No sizes; go directly
      const payload = [{ productId: id, size: null, quantity: 1 }];
      localStorage.setItem("checkoutItems", JSON.stringify(payload));
      navigate("/place-order");
      return;
    }
    setOpen(true);
  };

  const confirmSize = (size) => {
    const payload = [{ productId: id, size, quantity: 1 }];
    localStorage.setItem("checkoutItems", JSON.stringify(payload));
    setOpen(false);
    navigate("/place-order");
  };

  return (
    <>
      <div className="group relative flex h-full flex-col overflow-hidden rounded-lg border bg-white transition-shadow hover:shadow-md">
        {/* Media */}
        <Link to={`/product/${id}`} className="block">
          <div className="relative overflow-hidden">
            {firstImage ? (
              <img
                src={firstImage}
                alt={name || "Product"}
                className="w-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
              />
            ) : (
              <div className="w-full aspect-square bg-gray-100" />
            )}

            {Number(discount) > 0 && (
              <span className="absolute top-2 left-2 rounded-md bg-red-500 px-2 py-1 text-xs font-semibold text-white shadow-md">
                -{Number(discount)}%
              </span>
            )}
          </div>
        </Link>

        {/* Content */}
        <div className="flex grow flex-col p-3">
          <Link to={`/product/${id}`}>
            <p className="line-clamp-2 pb-1 pt-1 text-sm text-gray-800">
              {name}
            </p>
          </Link>

          {Number(discount) > 0 ? (
            <div className="text-sm">
              <span className="mr-2 line-through text-gray-400">
                &#2547; {formatBDT(basePrice)}
              </span>
              <span className="font-medium text-green-700">
                &#2547; {formatBDT(finalBase)}
              </span>
            </div>
          ) : (
            <p className="text-sm font-medium text-gray-900">
              &#2547; {formatBDT(basePrice)}
            </p>
          )}

          {/* Only Buy Now */}
          <div className="mt-auto pt-3">
            <button
              type="button"
              onClick={onBuyNow}
              className="inline-flex w-full items-center justify-center rounded-md bg-black px-3 py-2 text-sm font-medium text-white hover:bg-gray-900"
              title="Buy now"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>

      {/* Quick Size Modal (LIGHT THEME) */}
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          {/* Panel */}
          <div className="relative w-full sm:max-w-lg mx-2 sm:mx-auto rounded-t-lg sm:rounded-lg overflow-hidden bg-white text-gray-800 shadow-2xl">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <p className="text-sm font-semibold truncate">{name}</p>
              <button
                className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>

            {/* Size rows */}
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {(Array.isArray(sizes) ? sizes : []).map((sz) => {
                const xxlFee = isXXL(sz) ? 50 : 0;
                const rowPrice = finalBase + xxlFee;
                return (
                  <div
                    key={sz}
                    className="flex items-center justify-between gap-3 mb-2 rounded border border-gray-200 bg-white px-3 py-3 hover:bg-gray-50"
                  >
                    <div className="text-sm text-gray-800">{sz}</div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-gray-700">
                        ৳ {formatBDT(rowPrice)}
                      </div>
                      <button
                        onClick={() => confirmSize(sz)}
                        className="whitespace-nowrap rounded bg-black px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-900"
                        title="Order Now"
                      >
                        Order Now
                      </button>
                    </div>
                  </div>
                );
              })}
              {/* No sizes fallback */}
              {(!sizes || sizes.length === 0) && (
                <div className="px-3 py-4 text-sm text-gray-600">
                  Size not required for this item.
                </div>
              )}
            </div>

            {/* Footer spacer for small screens */}
            <div className="h-2" />
          </div>
        </div>
      )}
    </>
  );
};

export default ProductItem;
