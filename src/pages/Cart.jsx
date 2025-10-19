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
                  key={index}
                  className="grid py-4 text-gray-700 border-t border-b grid-cols-[4fr_0.5fr_0.5fr] sm:grid-cols-[4fr_2fr_0.5fr] items-center gap-4 opacity-70"
                >
                  <div className="flex items-start gap-6">
                    <div className="w-16 sm:w-20 bg-gray-100" />
                    <div>
                      <p className="text-sm font-medium sm:text-lg">
                        Product unavailable
                      </p>
                      <div className="flex items-center gap-5 mt-2">
                        <p className="text-gray-500">—</p>
                        <p className="px-2 border sm:px-3 sm:py-1 bg-slate-50">
                          {item.size}
                        </p>
                      </div>
                    </div>
                  </div>
                  <input
                    className="px-1 py-1 border max-w-10 sm:max-w-20 sm:px-2 bg-gray-100"
                    type="number"
                    min={1}
                    value={item.quantity}
                    disabled
                    readOnly
                  />
                  <img
                    onClick={() => updateQuantity(item._id, item.size, 0)}
                    className="w-4 mr-4 cursor-pointer sm:w-5"
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

            const showXXLNote = isXXL(item.size);
            const xxlLineTotal = showXXLNote
              ? 50 * Number(item.quantity || 0)
              : 0;

            return (
              <div
                key={index}
                className="grid py-4 text-gray-700 border-t border-b grid-cols-[4fr_0.5fr_0.5fr] sm:grid-cols-[4fr_2fr_0.5fr] items-center gap-4"
              >
                <div className="flex items-start gap-6">
                  {imgUrl ? (
                    <img
                      className="w-16 sm:w-20 object-cover"
                      src={imgUrl}
                      alt={productData.name}
                    />
                  ) : (
                    <div className="w-16 sm:w-20 bg-gray-100" />
                  )}

                  <div>
                    <p className="text-sm font-medium sm:text-lg">
                      {productData.name}
                    </p>

                    <div className="flex items-center gap-5 mt-2">
                      {/* Price (with discount handling) */}
                      {discount > 0 ? (
                        <div className="flex items-baseline gap-2">
                          <span className="line-through text-gray-400">
                            &#2547; {formatBDT(price)}
                          </span>
                          <span className="font-semibold">
                            &#2547; {formatBDT(finalPrice)}
                          </span>
                          <span className="text-xs text-green-700 font-semibold">
                            -{discount}%
                          </span>
                        </div>
                      ) : (
                        <p>&#2547; {formatBDT(price)}</p>
                      )}

                      {/* Size pill */}
                      <p className="px-2 border sm:px-3 sm:py-1 bg-slate-50">
                        {item.size}
                      </p>
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
                  className="px-1 py-1 border max-w-10 sm:max-w-20 sm:px-2"
                  type="number"
                  min={1}
                  value={item.quantity}
                />

                {/* Remove */}
                <img
                  onClick={() => updateQuantity(item._id, item.size, 0)}
                  className="w-4 mr-4 cursor-pointer sm:w-5"
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
      <div className="flex justify-end my-20">
        <div className="w-full sm:w-[450px]">
          {/* On /cart, CartTotal will hide shipping fee automatically */}
          <CartTotal />
          <div className="w-full text-end">
            <button
              onClick={() => navigate("/place-order")}
              className={`px-8 py-3 my-8 text-sm text-white bg-black active:bg-gray-700 ${
                isCartEmpty ? "opacity-50 cursor-not-allowed" : ""
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
