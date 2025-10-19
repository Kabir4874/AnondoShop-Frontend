import { useContext, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";

const isXXL = (size) => {
  if (!size) return false;
  const s = String(size).toUpperCase();
  return s.startsWith("XXL"); // covers "XXL-46" and any XXL prefix
};

const CartTotal = ({ deliveryFee, destinationLabel }) => {
  const location = useLocation();
  const onCartPage = location.pathname === "/cart";

  const {
    products = [],
    cartItems = {},
    delivery_fee: fallbackFee = 0,
  } = useContext(ShopContext);

  // Only used on non-/cart pages
  const feeToUse = Number.isFinite(Number(deliveryFee))
    ? Number(deliveryFee)
    : Number(fallbackFee || 0);

  const formatBDT = (val) =>
    (Number(val) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const productMap = useMemo(() => {
    const m = new Map();
    for (const p of products) m.set(p._id, p);
    return m;
  }, [products]);

  const { subtotal, savings, xxlSurcharge } = useMemo(() => {
    let sub = 0;
    let save = 0;
    let surcharge = 0;

    for (const productId in cartItems) {
      const product = productMap.get(productId);
      if (!product) continue;

      const basePrice = Number(product.price) || 0;
      const discount = Number(product.discount) || 0;
      const finalPrice =
        discount > 0
          ? Math.max(0, basePrice - (basePrice * discount) / 100)
          : basePrice;

      const sizes = cartItems[productId] || {};
      for (const sizeKey in sizes) {
        const qty = Number(sizes[sizeKey]) || 0;
        if (qty <= 0) continue;

        // Product line total
        sub += finalPrice * qty;

        // Savings from discount
        if (discount > 0) {
          save += (basePrice - finalPrice) * qty;
        }

        // XXL surcharge: ৳50 per XXL item
        if (isXXL(sizeKey)) {
          surcharge += 50 * qty;
        }
      }
    }

    // Add surcharge into subtotal so it reflects in total
    sub += surcharge;

    return { subtotal: sub, savings: save, xxlSurcharge: surcharge };
  }, [cartItems, productMap]);

  // Hide shipping on /cart: don't show the row and don't include it in total
  const effectiveFee = onCartPage ? 0 : feeToUse;
  const total = subtotal === 0 ? 0 : subtotal + effectiveFee;

  return (
    <div className="w-full">
      <div className="text-2xl">
        <Title text1={"CART"} text2={"TOTAL"} />
      </div>

      <div className="flex flex-col gap-2 mt-2 text-sm">
        <div className="flex justify-between">
          <p className="text-lg font-medium">Sub Total</p>
          <p className="text-lg font-medium">&#2547; {formatBDT(subtotal)}</p>
        </div>

        {/* XXL surcharge details (shown as info line when > 0) */}
        {xxlSurcharge > 0 && (
          <>
            <div className="flex items-center justify-between -mt-1">
              <span className="text-xs text-gray-500">
                Includes <strong>XXL Size Surcharge</strong>
              </span>
              <span className="text-xs text-gray-600">
                &#2547; {formatBDT(xxlSurcharge)}
              </span>
            </div>
          </>
        )}

        {!onCartPage && (
          <>
            <hr />
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <p className="text-lg font-medium">Shipping Fee</p>
                {destinationLabel ? (
                  <span className="text-xs text-gray-500">
                    Based on destination: {destinationLabel}
                  </span>
                ) : null}
              </div>
              <p className="text-lg font-medium">
                &#2547; {formatBDT(feeToUse)}
              </p>
            </div>
          </>
        )}

        <hr />

        <div className="flex justify-between">
          <p className="text-2xl font-semibold">Total Amount</p>
          <p className="text-2xl font-semibold">&#2547; {formatBDT(total)}</p>
        </div>

        {onCartPage && (
          <p className="mt-1 text-xs text-gray-500">
            Shipping will be calculated at checkout.
          </p>
        )}

        {savings > 0 && (
          <>
            <hr />
            <div className="flex justify-between text-green-700">
              <p className="text-sm font-medium">You Saved</p>
              <p className="text-sm font-semibold">
                &#2547; {formatBDT(savings)}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CartTotal;
