import axios from "axios";
import { useContext, useEffect, useMemo, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { backendUrl } from "../App";
import { ShopContext } from "../context/ShopContext";
import { trackEvent } from "../lib/tracking";

const PaymentResult = () => {
  const { clearCart, refreshUserCart, navigate, token, user, address } =
    useContext(ShopContext);
  const { search } = useLocation();

  const params = useMemo(() => new URLSearchParams(search), [search]);
  const status = params.get("status");
  const orderId = params.get("orderId");

  // Prevent duplicate firing on React StrictMode / re-renders
  const firedRef = useRef(false);

  useEffect(() => {
    if (status !== "success" || firedRef.current) return;

    firedRef.current = true;

    (async () => {
      try {
        // keep UI/cart in sync
        await clearCart();
        await refreshUserCart();

        // Try to fetch the latest orders and locate this order to get items/amount
        let orderData = null;
        if (token && orderId) {
          const { data } = await axios.get(
            `${backendUrl}/api/order/userorders`,
            { headers: { token } }
          );
          if (data?.success && Array.isArray(data.orders)) {
            orderData =
              data.orders.find((o) => String(o._id) === orderId) || null;
          }
        }

        // Build tracking payload
        const payload = {
          name: "Purchase",
          eventId: orderId || undefined,
          email: user?.email || undefined,
          phone: address?.phone || undefined,
          value: orderData?.amount ?? undefined,
          currency: "BDT",
          content_ids: Array.isArray(orderData?.items)
            ? orderData.items.map((it) =>
                String(it.productId || it._id || it.id || "").trim()
              )
            : undefined,
          content_name: orderId ? `Order #${orderId}` : undefined,
        };

        // Fire both client pixel(s) and server-side events
        await trackEvent(backendUrl, payload);
      } catch {
        // Silent failure: we don't block the page for tracking issues
      }
    })();
  }, [
    status,
    orderId,
    token,
    user?.email,
    address?.phone,
    clearCart,
    refreshUserCart,
  ]);

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
