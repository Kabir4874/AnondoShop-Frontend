import { useContext, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";

const PaymentResult = () => {
  const { clearCart, refreshUserCart, navigate } = useContext(ShopContext);
  const { search } = useLocation();

  const params = useMemo(() => new URLSearchParams(search), [search]);
  const status = params.get("status");
  const orderId = params.get("orderId");

  useEffect(() => {
    if (status === "success") {
      (async () => {
        await clearCart();
        await refreshUserCart();
      })();
    }
  }, [status, clearCart, refreshUserCart]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {status === "success" && (
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Payment Successful 🎉</h1>
          {orderId && <p className="mt-2 text-gray-600">Order ID: {orderId}</p>}
          <div className="mt-6 flex gap-3 justify-center">
            <button
              onClick={() => navigate("/orders")}
              className="px-6 py-2 bg-black text-white"
            >
              View Orders
            </button>
            <Link to="/" className="px-6 py-2 border">
              Continue Shopping
            </Link>
          </div>
        </div>
      )}

      {status === "failed" && (
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Payment Failed</h1>
          <p className="mt-2 text-gray-600">Please try again or choose COD.</p>
          <div className="mt-6 flex gap-3 justify-center">
            <Link to="/cart" className="px-6 py-2 bg-black text-white">
              Return to Cart
            </Link>
          </div>
        </div>
      )}

      {status === "cancelled" && (
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Payment Cancelled</h1>
          <p className="mt-2 text-gray-600">You cancelled the payment.</p>
          <div className="mt-6 flex gap-3 justify-center">
            <Link to="/cart" className="px-6 py-2 bg-black text-white">
              Return to Cart
            </Link>
          </div>
        </div>
      )}

      {(!status || status === "error") && (
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <div className="mt-6 flex gap-3 justify-center">
            <Link to="/" className="px-6 py-2 border">
              Go Home
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentResult;
