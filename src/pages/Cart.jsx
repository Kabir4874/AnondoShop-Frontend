import { useContext, useEffect, useMemo, useState } from "react";
import { assets } from "../assets/assets";
import CartTotal from "../components/CartTotal";
import Title from "../components/Title";
import { ShopContext } from "../context/ShopContext";

const isXXL = (size) => {
  if (!size) return false;
  const s = String(size).toUpperCase();
  return s.startsWith("XXL");
};

const Cart = () => {
  const {
    products = [],
    cartItems,
    updateQuantity,
    moveCartItemSize, // <— use the atomic mover from context
    navigate,
  } = useContext(ShopContext);

  const [cartData, setCartData] = useState([]);

  // Build a flat list from cartItems { [productId]: { [size]: qty } }
  useEffect(() => {
    if (products.length > 0) {
      const tempData = [];
      for (const productId in cartItems) {
        for (const size in cartItems[productId]) {
          const qty = cartItems[productId][size];
          if (qty > 0) {
            tempData.push({
              _id: productId,
              size,
              quantity: qty,
            });
          }
        }
      }
      setCartData(tempData);
    } else {
      setCartData([]);
    }
  }, [cartItems, products]);

  const isCartEmpty = cartData.length === 0;

  const formatBDT = (val) =>
    (Number(val) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const getImageUrl = (imgArr) => {
    if (!Array.isArray(imgArr) || imgArr.length === 0) return "";
    const first = imgArr[0];
    return typeof first === "string" ? first : first?.url || "";
  };

  const getFinalPrice = (price, discount) => {
    const p = Number(price) || 0;
    const d = Number(discount) || 0;
    if (!d) return p;
    return Math.max(0, p - (p * d) / 100);
  };

  // Build a quick lookup map for products by id
  const productMap = useMemo(() => {
    const map = new Map();
    for (const p of products) map.set(p._id, p);
    return map;
  }, [products]);

  // size change handler — purely delegates to context
  const handleSizeChange = (productId, oldSize, newSize) => {
    if (!newSize || newSize === oldSize) return;
    moveCartItemSize(productId, oldSize, newSize);
  };

  return (
    <div className="border-t pt-14">
      <div className="mb-3 text-2xl">
        <Title text1={"YOUR"} text2={"CART"} />
      </div>

      {/* Empty cart state */}
      {isCartEmpty && (
        <div className="my-10 text-center text-gray-600">
          <p className="mb-4">Your cart is empty.</p>
          <button
            onClick={() => navigate("/collection")}
            className="px-6 py-3 text-sm text-white bg-black active:bg-gray-700"
          >
            BROWSE COLLECTION
          </button>
        </div>
      )}

      {/* Cart rows */}
      {!isCartEmpty && (
        <div>
          {cartData.map((item, index) => {
            const productData = productMap.get(item._id);
            if (!productData) {
              // If product not found (deleted/unavailable), show a removable row
              return (
                <div
                  key={`${index}-missing`}
                  className="grid grid-cols-[4fr_0.5fr_0.5fr] items-center gap-4 border-t border-b py-4 text-gray-700 sm:grid-cols-[4fr_2fr_0.5fr] opacity-70"
                >
                  <div className="flex items-start gap-6">
                    <div className="w-16 bg-gray-100 sm:w-20" />
                    <div>
                      <p className="text-sm font-medium sm:text-lg">
                        Product unavailable
                      </p>
                      <div className="mt-2 flex items-center gap-5">
                        <p className="text-gray-500">—</p>
                        <p className="px-2 border bg-slate-50 sm:px-3 sm:py-1">
                          {item.size}
                        </p>
                      </div>
                    </div>
                  </div>
                  <input
                    className="max-w-10 px-1 py-1 border bg-gray-100 sm:max-w-20 sm:px-2"
                    type="number"
                    min={1}
                    value={item.quantity}
                    disabled
                    readOnly
                  />
                  <img
                    onClick={() => updateQuantity(item._id, item.size, 0)}
                    className="w-4 cursor-pointer sm:w-5"
                    src={assets.bin_icon}
                    alt="Remove"
                    title="Remove from cart"
                  />
                </div>
              );
            }

            const imgUrl = getImageUrl(productData.image);
            const price = Number(productData.price) || 0;
            const discount = Number(productData.discount) || 0;
            const finalPrice = getFinalPrice(price, discount);

            // Build size options = union of product sizes + current size
            const productSizes = Array.isArray(productData.sizes)
              ? productData.sizes
              : [];
            const uniqueSizes = Array.from(
              new Set([...(productSizes || []), item.size].filter(Boolean))
            );

            const showXXLNote = isXXL(item.size);
            const xxlLineTotal = showXXLNote
              ? 50 * Number(item.quantity || 0)
              : 0;

            return (
              <div
                key={`${item._id}-${item.size}-${index}`}
                className="grid grid-cols-[4fr_0.5fr_0.5fr] items-center gap-4 border-t border-b py-4 text-gray-700 sm:grid-cols-[4fr_2fr_0.5fr]"
              >
                <div className="flex items-start gap-6">
                  {imgUrl ? (
                    <img
                      className="w-16 object-cover sm:w-20"
                      src={imgUrl}
                      alt={productData.name}
                    />
                  ) : (
                    <div className="w-16 bg-gray-100 sm:w-20" />
                  )}

                  <div>
                    <p className="text-sm font-medium sm:text-lg">
                      {productData.name}
                    </p>

                    {/* Price + Size */}
                    <div className="mt-2 flex flex-wrap items-center gap-3 sm:gap-5">
                      {/* Price (with discount handling) */}
                      {discount > 0 ? (
                        <div className="flex items-baseline gap-2">
                          <span className="text-gray-400 line-through">
                            &#2547; {formatBDT(price)}
                          </span>
                          <span className="font-semibold">
                            &#2547; {formatBDT(finalPrice)}
                          </span>
                          <span className="text-xs font-semibold text-green-700">
                            -{discount}%
                          </span>
                        </div>
                      ) : (
                        <p>&#2547; {formatBDT(price)}</p>
                      )}

                      {/* Size selector */}
                      <label className="inline-flex items-center gap-2">
                        <span className="text-xs text-gray-500">Size</span>
                        <select
                          value={item.size}
                          onChange={(e) =>
                            handleSizeChange(
                              item._id,
                              item.size,
                              e.target.value
                            )
                          }
                          className="rounded border px-2 py-1 text-sm"
                          title="Change size"
                        >
                          {uniqueSizes.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    {/* XXL surcharge note (informational) */}
                    {showXXLNote && (
                      <p className="mt-1 text-xs text-amber-700">
                        XXL surcharge: &#2547; 50 × {item.quantity} = &#2547;{" "}
                        {formatBDT(xxlLineTotal)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Quantity */}
                <input
                  onChange={(e) => {
                    const v = e.target.value;
                    const n = parseInt(v, 10);
                    if (!Number.isNaN(n) && n >= 1) {
                      updateQuantity(item._id, item.size, n);
                    }
                  }}
                  className="max-w-10 px-1 py-1 border sm:max-w-20 sm:px-2"
                  type="number"
                  min={1}
                  value={item.quantity}
                />

                {/* Remove */}
                <img
                  onClick={() => updateQuantity(item._id, item.size, 0)}
                  className="w-4 cursor-pointer sm:w-5"
                  src={assets.bin_icon}
                  alt="Remove"
                  title="Remove from cart"
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Totals + Checkout */}
      <div className="my-20 flex justify-end">
        <div className="w-full sm:w-[450px]">
          {/* On /cart, CartTotal will hide shipping fee automatically */}
          <CartTotal />
          <div className="w-full text-end">
            <button
              onClick={() => navigate("/place-order")}
              className={`my-8 px-8 py-3 text-sm text-white bg-black active:bg-gray-700 ${
                isCartEmpty ? "cursor-not-allowed opacity-50" : ""
              }`}
              disabled={isCartEmpty}
            >
              PROCEED TO CHECKOUT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
