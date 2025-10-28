import axios from "axios";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import Title from "../components/Title";
import { ShopContext } from "../context/ShopContext";

const STATUS_OPTIONS = [
  "All",
  "Order Placed",
  "Pending",
  "Packing",
  "Shipped",
  "Out for delivery",
  "Delivered",
  "Canceled",
];

const Orders = () => {
  const { backendUrl, token, currency } = useContext(ShopContext);
  const [orderData, setOrderData] = useState([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState("All");

  // Tracking modal state
  const [trackOpen, setTrackOpen] = useState(false);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState("");
  const [trackOrder, setTrackOrder] = useState(null); // sanitized order object from API
  const overlayRef = useRef(null);

  const formatBDT = (num) =>
    (Number(num) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  /** Build a quick lookup from productId -> best image we’ve seen */
  const productImageMap = useMemo(() => {
    const map = new Map();
    for (const it of orderData) {
      const img = it?.image;
      if (!img) continue;
      const pick = (arrOrStr) => {
        if (Array.isArray(arrOrStr) && arrOrStr.length > 0) {
          const first = arrOrStr[0];
          if (typeof first === "string") return first;
          if (first && typeof first === "object") {
            return (
              first.url ||
              first.secure_url ||
              first.path ||
              first.src ||
              first.location ||
              ""
            );
          }
        } else if (typeof arrOrStr === "string") {
          return arrOrStr;
        }
        return "";
      };
      const chosen = pick(img);
      const pid = String(it?.productId || it?._id || it?.id || "").trim();
      if (pid && chosen && !map.has(pid)) {
        map.set(pid, chosen);
      }
    }
    return map;
  }, [orderData]);

  /** Normalize relative/partial URLs into absolute URLs against backend */
  const toAbsoluteUrl = (url) => {
    if (!url) return "";
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith("//")) return `${window.location.protocol}${url}`;
    const base = String(backendUrl || "").replace(/\/$/, "");
    if (url.startsWith("/")) return `${base}${url}`;
    return `${base}/${url.replace(/^\.?\//, "")}`;
  };

  const getItemImage = (item) => {
    // 1) Try image field on the item
    const pickFrom = (img) => {
      if (Array.isArray(img) && img.length > 0) {
        const first = img[0];
        if (typeof first === "string") return first;
        if (first && typeof first === "object") {
          return (
            first.url ||
            first.secure_url ||
            first.path ||
            first.src ||
            first.location ||
            ""
          );
        }
      } else if (typeof img === "string") {
        return img;
      }
      return "";
    };

    let src = pickFrom(item?.image);

    // 2) Some payloads might use `images`
    if (!src) src = pickFrom(item?.images);

    // 3) Fallback: look up by productId in our memoized map from userOrders
    if (!src) {
      const pid = String(item?.productId || item?._id || item?.id || "").trim();
      if (pid && productImageMap.has(pid)) {
        src = productImageMap.get(pid);
      }
    }

    // 4) Final: make absolute if needed
    return toAbsoluteUrl(src);
  };

  const deriveUnitPrice = (item) => {
    const unit = item?.unitFinal ?? item?.price ?? 0;
    return Number(unit) || 0;
  };

  const toDateLabel = (d) => {
    if (!d) return "-";
    try {
      const dt = new Date(d);
      return dt.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "-";
    }
  };

  const toShortDate = (iso) => {
    if (!iso) return "-";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    } catch {
      return "-";
    }
  };

  const loadOrderData = async () => {
    try {
      if (!token) return;

      const response = await axios.post(
        `${backendUrl}/api/order/userorders`,
        {},
        { headers: { token } }
      );

      const orders = response?.data?.orders || [];

      const allItems = [];
      for (const order of orders) {
        const items = Array.isArray(order?.items) ? order.items : [];
        for (const item of items) {
          allItems.push({
            ...item,
            // Carry order-level fields down so we can track by order later:
            orderId: order?._id, // << important for tracking
            status: order?.status,
            payment: order?.payment,
            paymentMethod: order?.paymentMethod,
            date: order?.date,
            amount: order?.amount,
            address: order?.address,
          });
        }
      }

      setOrderData(allItems);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadOrderData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // --- Tracking modal handlers ---
  const openTrackModal = async (orderId) => {
    if (!orderId || !token) return;
    setTrackOpen(true);
    setTrackLoading(true);
    setTrackError("");
    setTrackOrder(null);

    try {
      const { data } = await axios.get(
        `${backendUrl}/api/order/track/${orderId}`,
        { headers: { token } }
      );
      if (data?.success && data?.order) {
        setTrackOrder(data.order);
      } else {
        setTrackError(data?.message || "Unable to load tracking details.");
      }
    } catch (err) {
      console.error(err);
      setTrackError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to fetch tracking."
      );
    } finally {
      setTrackLoading(false);
    }
  };

  const closeTrackModal = () => {
    setTrackOpen(false);
    setTrackError("");
    setTrackOrder(null);
  };

  const onOverlayClick = (e) => {
    if (e.target === overlayRef.current) closeTrackModal();
  };

  useEffect(() => {
    const onEsc = (e) => {
      if (e.key === "Escape") closeTrackModal();
    };
    if (trackOpen) document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [trackOpen]);

  // Timeline rendering helpers (includes your new "Pending" & "Packing")
  const TL_STEPS = [
    "order placed",
    "paid",
    "pending",
    "packing",
    "shipped",
    "out for delivery",
    "delivered",
  ];

  const stepIndex = (currentStep) => {
    const key = String(currentStep || "").toLowerCase();
    const idx = TL_STEPS.findIndex((s) => key.includes(s));
    return Math.max(0, idx);
  };

  const filteredOrders = useMemo(() => {
    if (statusFilter === "All") return orderData;
    const key = statusFilter.toLowerCase();
    return orderData.filter((i) =>
      String(i?.status || "")
        .toLowerCase()
        .includes(key)
    );
  }, [orderData, statusFilter]);

  return (
    <div className="pt-16 border-t">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="text-2xl">
          <Title text1={"YOUR"} text2={"ORDERS"} />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600">Filter by status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-md bg-white text-sm"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-2 text-xs text-gray-500">
        Showing <span className="font-medium">{filteredOrders.length}</span>{" "}
        item{filteredOrders.length !== 1 ? "s" : ""}{" "}
        {statusFilter !== "All" ? (
          <>
            with status <span className="font-medium">{statusFilter}</span>
          </>
        ) : null}
      </div>

      <div>
        {filteredOrders.map((item, index) => {
          const unitPrice = deriveUnitPrice(item);
          const qty = Number(item?.quantity) || 0;
          const lineTotal = Number(item?.lineSubtotal ?? unitPrice * qty) || 0;

          const dateLabel = item?.date ? toDateLabel(item.date) : "-";
          const imgUrl = getItemImage(item);
          const orderId = item?.orderId;

          const isDelivered = String(item?.status)
            .toLowerCase()
            .includes("delivered");

          return (
            <div
              key={`${orderId || item?._id || index}-${index}`}
              className="flex flex-col gap-4 py-4 text-gray-700 border-t border-b md:flex-row md:items-center md:justify-between"
            >
              {/* Left: Item snapshot */}
              <div className="flex items-start gap-6 text-sm">
                {imgUrl ? (
                  <img
                    className="w-16 sm:w-20 object-cover rounded"
                    src={imgUrl}
                    alt={item?.name || "Photo"}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-16 sm:w-20 bg-gray-100 rounded" />
                )}

                <div>
                  <p className="font-medium sm:text-base">
                    {item?.name || "—"}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 mt-1 text-base text-gray-700">
                    {/* Unit price */}
                    <p className="text-lg">
                      {currency} {formatBDT(unitPrice)}
                    </p>

                    {/* Quantity */}
                    <p>
                      Quantity: <span className="font-medium">{qty}</span>
                    </p>

                    {/* Size */}
                    {item?.size ? (
                      <p>
                        Size: <span className="font-medium">{item.size}</span>
                      </p>
                    ) : null}

                    {/* Line total */}
                    <p className="text-gray-600 text-sm">
                      Line Total: {currency} {formatBDT(lineTotal)}
                    </p>
                  </div>

                  {/* Date & Payment */}
                  <p className="mt-1">
                    Date:&nbsp;
                    <span className="text-gray-400">{dateLabel}</span>
                  </p>
                  <p className="mt-1">
                    Payment:&nbsp;
                    <span className="text-gray-400">
                      {item?.paymentMethod || "—"}
                    </span>
                  </p>
                </div>
              </div>

              {/* Right: Status + action */}
              <div className="flex items-center gap-4 md:gap-6">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isDelivered ? "bg-green-500" : "bg-amber-500"
                    }`}
                  />
                  <p className="text-sm md:text-base">{item?.status || "—"}</p>
                </div>

                <button
                  onClick={() => openTrackModal(orderId)}
                  className="px-4 py-2 text-sm font-medium border rounded-md hover:bg-gray-50 active:scale-[0.99] transition"
                  title="Track this order"
                  disabled={!orderId}
                >
                  TRACK ORDER
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tracking Modal */}
      {trackOpen && (
        <div
          ref={overlayRef}
          onClick={onOverlayClick}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
        >
          <div className="w-full sm:max-w-3xl bg-white rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden animate-[slideUp_0.2s_ease-out]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold">
                  Order Tracking
                </h3>
                {trackOrder?.orderId ? (
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                    Order ID:&nbsp;
                    <span className="font-mono">{trackOrder.orderId}</span>
                  </p>
                ) : null}
              </div>
              <button
                onClick={closeTrackModal}
                className="h-9 w-9 grid place-items-center rounded-full hover:bg-gray-100"
                aria-label="Close"
                title="Close"
              >
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>

            {/* Body */}
            <div className="px-5 sm:px-6 py-5 sm:py-6 max-h-[80vh] overflow-y-auto">
              {trackLoading ? (
                <div className="py-16 text-center">
                  <div className="mx-auto h-8 w-8 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
                  <p className="text-gray-600 mt-3">
                    Loading tracking details…
                  </p>
                </div>
              ) : trackError ? (
                <div className="p-4 border rounded-md bg-red-50 border-red-200 text-red-700">
                  {trackError}
                </div>
              ) : trackOrder ? (
                <div className="space-y-6">
                  {/* Status + Progress */}
                  <section>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-600">Current Status</p>
                      <p className="font-medium capitalize">
                        {trackOrder.status || "—"}
                      </p>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(0, trackOrder?.progress?.progressPct || 0)
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Step: {trackOrder?.progress?.step || "—"} •{" "}
                      {Math.round(trackOrder?.progress?.progressPct || 0)}%
                    </p>
                  </section>

                  {/* Timeline */}
                  <section>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-600">Timeline</p>
                      <p className="text-xs text-gray-500">
                        Placed on {toDateLabel(trackOrder?.date)}
                      </p>
                    </div>

                    <ol className="relative border-l border-gray-200 ml-3">
                      {TL_STEPS.map((label, idx) => {
                        const currentIdx = stepIndex(
                          trackOrder?.progress?.step
                        );
                        const reached = idx <= currentIdx;
                        return (
                          <li key={label} className="ml-4 mb-5">
                            <div
                              className={`absolute -left-1.5 top-1.5 h-3 w-3 rounded-full ${
                                reached ? "bg-emerald-500" : "bg-gray-300"
                              }`}
                            />
                            <p
                              className={`capitalize ${
                                reached ? "text-gray-900" : "text-gray-400"
                              }`}
                            >
                              {label}
                            </p>
                          </li>
                        );
                      })}
                    </ol>
                  </section>

                  {/* ETA & Address */}
                  <section className="grid sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border bg-gray-50">
                      <p className="text-sm text-gray-600 mb-1">ETA Window</p>
                      <p className="font-medium">
                        {toShortDate(trackOrder?.eta?.etaFromISO)} —{" "}
                        {toShortDate(trackOrder?.eta?.etaToISO)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Area: {trackOrder?.eta?.areaLabel || "—"}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border bg-gray-50">
                      <p className="text-sm text-gray-600 mb-1">Shipping To</p>
                      <p className="font-medium">
                        {trackOrder?.address?.recipientName || "—"}
                      </p>
                      <p className="text-sm text-gray-700">
                        {trackOrder?.address?.addressLine1 || "—"}
                      </p>
                      <p className="text-sm text-gray-700">
                        {trackOrder?.address?.district || "—"}{" "}
                        {trackOrder?.address?.postalCode
                          ? `- ${trackOrder.address.postalCode}`
                          : ""}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {trackOrder?.address?.phone || "—"}
                      </p>
                    </div>
                  </section>

                  {/* Items */}
                  <section>
                    <p className="text-sm text-gray-600 mb-3">Items</p>
                    <div className="space-y-3">
                      {(trackOrder?.items || []).map((it, i) => {
                        const unit = Number(it?.unitFinal ?? 0);
                        const qty = Number(it?.quantity ?? 0);
                        const sub = Number(it?.lineSubtotal ?? unit * qty) || 0;
                        const imgUrl = getItemImage(it);
                        return (
                          <div
                            key={`${it?.productId}-${i}`}
                            className="flex items-center justify-between gap-4 p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              {imgUrl ? (
                                <img
                                  src={imgUrl}
                                  alt={it?.name || "Item"}
                                  className="h-12 w-12 rounded object-cover"
                                  loading="lazy"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="h-12 w-12 rounded bg-gray-100" />
                              )}
                              <div>
                                <p className="font-medium">{it?.name || "—"}</p>
                                <p className="text-xs text-gray-500">
                                  Qty: {qty}
                                  {it?.size ? ` • Size: ${it.size}` : ""}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm">৳ {formatBDT(unit)}</p>
                              <p className="text-xs text-gray-500">
                                Subtotal: ৳ {formatBDT(sub)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  {/* Summary */}
                  <section className="flex items-center justify-between p-4 rounded-xl border">
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="text-lg font-semibold">
                      ৳ {formatBDT(trackOrder?.amount || 0)}
                    </p>
                  </section>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => {
                        if (trackOrder?.orderId) {
                          openTrackModal(trackOrder.orderId); // refresh the same order
                        }
                      }}
                      className="px-4 py-2 text-sm font-medium border rounded-md hover:bg-gray-50"
                    >
                      Refresh
                    </button>
                    <button
                      onClick={closeTrackModal}
                      className="px-4 py-2 text-sm font-medium rounded-md bg-gray-900 text-white hover:bg-black"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-gray-600">No tracking data.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
