import { useContext, useMemo } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";

const CartTotal = () => {
  const {
    products = [],
    cartItems = {},
    delivery_fee = 0,
  } = useContext(ShopContext);

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

  const { subtotal, savings } = useMemo(() => {
    let sub = 0;
    let save = 0;
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

        sub += finalPrice * qty;

        if (discount > 0) {
          save += (basePrice - finalPrice) * qty;
        }
      }
    }
    return { subtotal: sub, savings: save };
  }, [cartItems, productMap]);

  const total = subtotal === 0 ? 0 : subtotal + Number(delivery_fee || 0);

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

        <hr />

        <div className="flex justify-between">
          <p className="text-lg font-medium">Shipping Fee</p>
          <p className="text-lg font-medium">
            &#2547; {formatBDT(delivery_fee)}
          </p>
        </div>

        <hr />

        <div className="flex justify-between">
          <p className="text-2xl font-semibold">Total Amount</p>
          <p className="text-2xl font-semibold">&#2547; {formatBDT(total)}</p>
        </div>

        {/* Uncomment if you want to show total savings */}
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
