import { useContext, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";

const isXXL = (size) => {
  if (!size) return false;
  const s = String(size).toUpperCase();
  return s.startsWith("XXL");
};

const effectivePrice = (product) => {
  const base = Number(product?.price) || 0;
  const disc = Number(product?.discount) || 0;
  return disc > 0 ? Math.max(0, base - (base * disc) / 100) : base;
};

/**
 * Props
 * - deliveryFee: number (required for checkout pages)
 * - destinationLabel: string (optional)
 * - items: optional [{ productId, size, quantity }]
 * - subtotalOverride: optional number (if you pre-calc subtotal elsewhere)
 */
const CartTotal = ({
  deliveryFee,
  destinationLabel,
  items,
  subtotalOverride,
}) => {
  const location = useLocation();
  const onCartPage = location.pathname === "/cart";

  const { products = [] } = useContext(ShopContext);

  // Fallback to localStorage if items prop is not provided
  const activeItems = useMemo(() => {
    if (Array.isArray(items)) return items;
    try {
      const raw = localStorage.getItem("checkoutItems");
      const parsed = JSON.parse(raw || "[]");
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((it) => ({
          productId: String(it.productId || it._id || it.id || ""),
          size: it.size ?? null,
          quantity: Math.max(1, Number(it.quantity) || 1),
        }))
        .filter((it) => it.productId);
    } catch {
      return [];
    }
  }, [items]);

  const productMap = useMemo(() => {
    const m = new Map();
    for (const p of products) m.set(String(p._id), p);
    return m;
  }, [products]);

  // Calculate subtotal/savings/surcharge if we have line items & products
  const calc = useMemo(() => {
    // If a trusted subtotal is explicitly passed, use it and skip extra lines
    if (Number.isFinite(Number(subtotalOverride))) {
      const sub = Number(subtotalOverride);
      return {
        subtotal: sub,
        savings: 0,
        xxlSurcharge: 0,
        computed: true,
        overrideUsed: true,
      };
    }

    let subtotal = 0;
    let savings = 0;
    let xxlSurcharge = 0;

    for (const it of activeItems) {
      const p = productMap.get(String(it.productId));
      if (!p) continue;

      const base = Number(p.price) || 0;
      const disc = Number(p.discount) || 0;
      const final = effectivePrice(p);

      // savings from discount (doesn't include XXL add-on)
      if (disc > 0) {
        savings += (base - final) * it.quantity;
      }

      const perUnitXXL = isXXL(it.size) ? 50 : 0;
      if (perUnitXXL) xxlSurcharge += perUnitXXL * it.quantity;

      subtotal += (final + perUnitXXL) * it.quantity;
    }

    return {
      subtotal,
      savings,
      xxlSurcharge,
      computed: true,
      overrideUsed: false,
    };
  }, [activeItems, productMap, subtotalOverride]);

  const feeToUse = Number.isFinite(Number(deliveryFee))
    ? Number(deliveryFee)
    : 0;
  const effectiveFee = onCartPage ? 0 : feeToUse;
  const total = calc.subtotal === 0 ? 0 : calc.subtotal + effectiveFee;

  const formatBDT = (val) =>
    (Number(val) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="w-full">
      <div className="text-2xl">
        <Title text1={"TOTAL"} />
      </div>

      <div className="flex flex-col gap-2 mt-2 text-sm">
        <div className="flex justify-between">
          <p className="text-lg font-medium">Sub Total</p>
          <p className="text-lg font-medium">
            &#2547; {formatBDT(calc.subtotal)}
          </p>
        </div>

        {/* XXL surcharge line only when we computed it (not when overriding) and it's > 0 */}
        {!calc.overrideUsed && calc.xxlSurcharge > 0 && (
          <div className="flex items-center justify-between -mt-1">
            <span className="text-xs text-gray-500">
              Includes <strong>XXL Size Surcharge</strong>
            </span>
            <span className="text-xs text-gray-600">
              &#2547; {formatBDT(calc.xxlSurcharge)}
            </span>
          </div>
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

        {/* Savings only when we computed them locally */}
        {!calc.overrideUsed && calc.savings > 0 && (
          <>
            <hr />
            <div className="flex justify-between text-green-700">
              <p className="text-sm font-medium">You Saved</p>
              <p className="text-sm font-semibold">
                &#2547; {formatBDT(calc.savings)}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CartTotal;
