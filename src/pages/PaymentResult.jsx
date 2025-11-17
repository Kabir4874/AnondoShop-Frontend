import axios from "axios";
import {
  AlertTriangle,
  CheckCircle2,
  Home,
  MessageCircle,
  Phone,
  ShoppingBag,
  XCircle,
} from "lucide-react";
import { useContext, useEffect, useMemo, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation } from "react-router-dom";
import { backendUrl, SITE_URL } from "../App";
import { ShopContext } from "../context/ShopContext";
import { trackEvent } from "../lib/tracking";

const PaymentResult = () => {
  const { clearCart, refreshUserCart, token, address } =
    useContext(ShopContext);
  const { search } = useLocation();

  const params = useMemo(() => new URLSearchParams(search), [search]);
  const status = params.get("status"); // success | failed | cancelled | error | cod/placed
  const orderId = params.get("orderId");
  const paymentParam = params.get("payment"); // cod | ssl | bkash | etc.
  const canonicalUrl = `${SITE_URL}/payment-result`;
  const pageTitle = isSuccess
    ? isCOD
      ? "Order Placed Successfully | AnondoShop"
      : "Payment Successful | AnondoShop"
    : status === "failed"
    ? "Payment Failed | AnondoShop"
    : status === "cancelled"
    ? "Payment Cancelled | AnondoShop"
    : "Payment Status | AnondoShop";

  const metaDescription = isSuccess
    ? "Your order has been placed successfully on AnondoShop. We will confirm your order soon and prepare it for delivery."
    : status === "failed"
    ? "Your payment could not be completed. Please try again or choose Cash on Delivery at AnondoShop."
    : status === "cancelled"
    ? "You cancelled the payment process. You can return to AnondoShop and try again later."
    : "Check the status of your payment and order on AnondoShop.";

  const isCOD =
    (paymentParam && paymentParam.toLowerCase() === "cod") ||
    status === "cod" ||
    status === "placed";
  const isSuccess = status === "success" || isCOD;

  // Prevent duplicate tracking on StrictMode
  const firedRef = useRef(false);

  useEffect(() => {
    if (!isSuccess || firedRef.current) return;
    firedRef.current = true;

    (async () => {
      try {
        await clearCart?.();
        await refreshUserCart?.();

        let orderData = null;
        if (token && orderId) {
          const { data } = await axios.get(
            `${backendUrl}/api/order/userorders`,
            {
              headers: { token },
            }
          );
          if (data?.success && Array.isArray(data.orders)) {
            orderData =
              data.orders.find((o) => String(o._id) === orderId) || null;
          }
        }

        await trackEvent(backendUrl, {
          name: "Purchase",
          eventId: orderId || undefined,
          phone: address?.phone || undefined,
          value: orderData?.amount ?? undefined,
          currency: "BDT",
          content_ids: Array.isArray(orderData?.items)
            ? orderData.items.map((it) =>
                String(it.productId || it._id || it.id || "").trim()
              )
            : undefined,
          content_name: orderId ? `Order #${orderId}` : undefined,
        });
      } catch {
        /* ignore tracking errors */
      }
    })();
  }, [isSuccess, orderId, token, address?.phone, clearCart, refreshUserCart]);

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={canonicalUrl} />

        {/* Open Graph */}
        <meta property="og:site_name" content="AnondoShop" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta
          property="og:image"
          content="https://cdn-icons-png.flaticon.com/512/625/625149.png"
        />
        <meta property="og:url" content={canonicalUrl} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={metaDescription} />
        <meta
          name="twitter:image"
          content="https://cdn-icons-png.flaticon.com/512/625/625149.png"
        />
      </Helmet>
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* SUCCESS (Online or COD) */}
        {isSuccess && (
          <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-6 sm:px-8 sm:py-8 flex items-start gap-4">
              <div className="shrink-0">
                <div className="h-12 w-12 grid place-items-center rounded-full bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-semibold">
                  {isCOD ? "Order" : "Payment"} Successful 🎉
                </h1>
                {orderId && (
                  <p className="mt-1 text-gray-600">Order ID: {orderId}</p>
                )}

                {/* Bangla Confirmation */}
                <div className="mt-5 p-4 sm:p-5 rounded-xl border bg-emerald-50/60">
                  <p className="text-emerald-900 font-semibold">
                    ✅ ধন্যবাদ! আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে।
                  </p>
                  <p className="mt-2 text-emerald-900">
                    আমরা খুব শীঘ্রই আপনার অর্ডারটি কনফার্ম করে ডেলিভারির জন্য
                    প্রস্তুত করবো। আমাদের টিম এখন সেটি প্রস্তুত করছে।
                  </p>
                  <p className="mt-2 text-emerald-900">
                    💌 আপনাকে খুব শীঘ্রই একটি কল বা মেসেজের মাধ্যমে কনফার্মেশন
                    করা হবে।
                  </p>
                  <p className="mt-3 text-emerald-900 font-medium">
                    🌟 আমাদের কাস্টমার পরিবারে আপনাকে স্বাগতম! আপনার ভালো লাগাই
                    আমাদের প্রেরণা
                  </p>
                  <div className="mt-4 text-emerald-900">
                    <p className="font-medium flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" /> কোনো প্রশ্ন থাকলে
                      যোগাযোগ করুন:
                    </p>
                    <ul className="mt-2 space-y-2 text-sm">
                      <li className="flex flex-wrap items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <a
                          href="tel:01876694376"
                          className="underline underline-offset-2"
                        >
                          01876694376
                        </a>
                      </li>
                      <li>
                        WhatsApp:{" "}
                        <a
                          href="https://wa.me/8801876694376"
                          className="text-emerald-700 underline underline-offset-2"
                          target="_blank"
                          rel="noreferrer"
                        >
                          https://wa.me/8801876694376
                        </a>
                      </li>
                      <li>
                        Messenger:{" "}
                        <a
                          href="https://m.me/129067706947076?source=qr_link_share"
                          className="text-emerald-700 underline underline-offset-2"
                          target="_blank"
                          rel="noreferrer"
                        >
                          https://m.me/129067706947076?source=qr_link_share
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* CTAs */}
                <div className="mt-6 flex flex-wrap gap-3">
                  {/* UPDATED: go to /payment-result (keeps query) */}
                  <Link
                    to={"/orders"}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-black text-white hover:bg-gray-900"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    View Orders
                  </Link>
                  <Link
                    to="/collection"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border hover:bg-gray-50"
                  >
                    <Home className="w-4 h-4" />
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FAILED */}
        {status === "failed" && !isCOD && (
          <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-8 sm:px-8 flex items-start gap-4">
              <div className="shrink-0">
                <div className="h-12 w-12 grid place-items-center rounded-full bg-rose-50 text-rose-600">
                  <XCircle className="w-7 h-7" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-semibold">Payment Failed</h1>
                <p className="mt-2 text-gray-600">
                  Please try again or choose Cash on Delivery.
                </p>
                <div className="mt-6">
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-black text-white hover:bg-gray-900"
                  >
                    <Home className="w-4 h-4" />
                    Go Home
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CANCELLED */}
        {status === "cancelled" && !isCOD && (
          <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-8 sm:px-8 flex items-start gap-4">
              <div className="shrink-0">
                <div className="h-12 w-12 grid place-items-center rounded-full bg-amber-50 text-amber-600">
                  <AlertTriangle className="w-7 h-7" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-semibold">Payment Cancelled</h1>
                <p className="mt-2 text-gray-600">
                  You cancelled the payment. You can try again later.
                </p>
                <div className="mt-6">
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-black text-white hover:bg-gray-900"
                  >
                    <Home className="w-4 h-4" />
                    Go Home
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* GENERIC ERROR */}
        {(!status || status === "error") && !isCOD && !isSuccess && (
          <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-8 sm:px-8 flex items-start gap-4">
              <div className="shrink-0">
                <div className="h-12 w-12 grid place-items-center rounded-full bg-gray-100 text-gray-600">
                  <AlertTriangle className="w-7 h-7" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-semibold">Something went wrong</h1>
                <div className="mt-6">
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border hover:bg-gray-50"
                  >
                    <Home className="w-4 h-4" />
                    Go Home
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default PaymentResult;
