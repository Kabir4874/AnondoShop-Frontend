import axios from "axios";
import { useContext, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import CartTotal from "../components/CartTotal";
import Title from "../components/Title";
import { ShopContext } from "../context/ShopContext";
import { trackEvent } from "../lib/tracking";

const BD_PHONE_REGEX = /^(?:\+?88)?01[3-9]\d{8}$/;

// compute unit price (discounted + XXL surcharge)
const unitPrice = (product, size, effectivePriceFn, isXXL) => {
  const base = effectivePriceFn(product);
  return base + (isXXL(size) ? 50 : 0);
};

const PlaceOrder = () => {
  const [method, setMethod] = useState("cod"); // "cod" | "bkash"

  const {
    navigate,
    backendUrl,
    setToken,
    products,
    user, // { name, phone }
    address: savedAddress,
    effectivePrice,
    isXXL,
  } = useContext(ShopContext);

  // ---- checkout items (from localStorage) ----
  const [items, setItems] = useState([]); // [{ productId, size, quantity }]
  useEffect(() => {
    try {
      const raw = localStorage.getItem("checkoutItems");
      const parsed = Array.isArray(JSON.parse(raw || "[]"))
        ? JSON.parse(raw || "[]")
        : [];
      // sanitize
      const clean = parsed
        .map((it) => ({
          productId: String(it.productId || it._id || it.id || ""),
          size: it.size ?? null,
          quantity: Math.max(1, Number(it.quantity) || 1),
        }))
        .filter((it) => it.productId);
      setItems(clean);
    } catch {
      setItems([]);
    }
  }, []);

  const incQty = (idx) => {
    setItems((prev) =>
      prev.map((it, i) =>
        i === idx ? { ...it, quantity: it.quantity + 1 } : it
      )
    );
  };
  const decQty = (idx) => {
    setItems((prev) =>
      prev
        .map((it, i) =>
          i === idx ? { ...it, quantity: Math.max(1, it.quantity - 1) } : it
        )
        .filter(Boolean)
    );
  };
  const removeItem = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // ---- delivery area selector (replaces address-based fee) ----
  const [deliveryArea, setDeliveryArea] = useState("inside"); // "inside" | "outside" | "gazipur" | "ashulia"

  const DELIVERY_MAP = {
    inside: { fee: 80, label: "Inside Dhaka City" },
    outside: { fee: 150, label: "Outside Dhaka City" },
    gazipur: { fee: 120, label: "Gazipur" },
    ashulia: { fee: 120, label: "Ashulia" },
  };

  const deliveryFee = DELIVERY_MAP[deliveryArea]?.fee ?? 80;
  const deliveryLabel =
    DELIVERY_MAP[deliveryArea]?.label ?? "Inside Dhaka City";

  // ---- address form (minimal) ----
  const [formAddress, setFormAddress] = useState({
    recipientName: "",
    phone: "",
    addressLine1: "",
    district: "",
  });
  useEffect(() => {
    if (savedAddress) {
      setFormAddress({
        recipientName: savedAddress.recipientName || "",
        phone: savedAddress.phone || "",
        addressLine1: savedAddress.addressLine1 || "",
        district: savedAddress.district || "",
      });
    }
  }, [savedAddress]);

  const onChangeAddress = (e) => {
    const { name, value } = e.target;
    setFormAddress((d) => ({ ...d, [name]: value }));
  };

  const validateAddress = (addr) => {
    const { recipientName, phone, addressLine1, district } = addr || {};
    if (!recipientName || !phone || !addressLine1 || !district) {
      toast.error("All address fields are required.");
      return false;
    }
    if (!BD_PHONE_REGEX.test(phone)) {
      toast.error("Invalid Bangladesh phone number.");
      return false;
    }
    return true;
  };

  // ---- price calculations ----
  const enriched = useMemo(() => {
    // join items with product info
    const map = new Map(products.map((p) => [String(p._id), p]));
    return items
      .map((it) => {
        const p = map.get(String(it.productId));
        if (!p) return null;
        const up = unitPrice(p, it.size, effectivePrice, isXXL);

        // first image (supports string or {url})
        let thumb = "";
        if (Array.isArray(p.image) && p.image.length) {
          const first = p.image[0];
          thumb = typeof first === "string" ? first : first?.url || "";
        }

        return {
          ...it,
          product: p,
          unit: up,
          line: up * it.quantity,
          thumb,
        };
      })
      .filter(Boolean);
  }, [items, products, effectivePrice, isXXL]);

  const subtotal = useMemo(
    () => enriched.reduce((acc, it) => acc + it.line, 0),
    [enriched]
  );

  // Persist checkout items as user edits quantities
  useEffect(() => {
    try {
      const payload = items.map((it) => ({
        productId: it.productId,
        size: it.size,
        quantity: it.quantity,
      }));
      localStorage.setItem("checkoutItems", JSON.stringify(payload));
    } catch {}
  }, [items]);

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (enriched.length === 0) {
      toast.error("No items to order.");
      return;
    }
    const addressToUse = { ...formAddress };
    if (!validateAddress(addressToUse)) return;

    const profileName = user?.name || addressToUse.recipientName;

    // minimal items for backend normalization: {_id, size, quantity}
    const payloadItems = enriched.map((it) => ({
      _id: it.productId,
      size: it.size,
      quantity: it.quantity,
    }));

    const deliveryOverride = {
      area: deliveryArea,
      fee: deliveryFee,
      label: deliveryLabel,
    };

    try {
      if (method === "cod") {
        const { data } = await axios.post(`${backendUrl}/api/order/place`, {
          phone: addressToUse.phone,
          name: profileName,
          items: payloadItems,
          address: addressToUse,
          deliveryOverride, // optional; backend may ignore
        });

        if (data?.success) {
          if (data.token) setToken(data.token);

          // tracking (best-effort)
          try {
            await trackEvent(backendUrl, {
              name: "Purchase",
              eventId: data.orderId,
              phone: addressToUse.phone,
              value: subtotal + deliveryFee,
              currency: "BDT",
              content_ids: payloadItems.map((i) => String(i._id)),
              content_name: data.orderId ? `Order #${data.orderId}` : "Order",
            });
          } catch {}

          localStorage.removeItem("checkoutItems");
          toast.success("Order placed successfully");
          navigate("/orders");
          return;
        }

        toast.error(data?.message || "Failed to place order");
      } else if (method === "bkash") {
        const { data } = await axios.post(
          `${backendUrl}/api/order/bkash/create`,
          {
            phone: addressToUse.phone,
            name: profileName,
            items: payloadItems,
            address: addressToUse,
            deliveryOverride,
          }
        );

        if (data?.success) {
          if (data.token) setToken(data.token);

          const redirectUrl =
            data?.url ||
            data?.redirectURL ||
            data?.redirectUrl ||
            data?.bkashURL ||
            data?.data?.bkashURL ||
            data?.data?.url ||
            data?.data?.redirectURL;

          if (redirectUrl) {
            // don't clear items until redirect success page if you prefer
            localStorage.removeItem("checkoutItems");
            window.location.replace(redirectUrl);
            return;
          } else {
            toast.error("bKash URL missing in response");
            return;
          }
        }

        toast.error(data?.message || "Failed to initialize bKash payment");
      }
    } catch (err) {
      console.error(err);
      toast.error(
        err?.response?.data?.message || err.message || "Something went wrong"
      );
    }
  };

  return (
    <form
      onSubmit={onSubmitHandler}
      className="flex flex-col justify-between gap-4 pt-5 sm:flex-row sm:pt-14 min-h-[80vh] border-t"
    >
      {/* Left: Items + Delivery area + Address */}
      <div className="flex w-full flex-col gap-6 sm:max-w-[560px]">
        {/* 1) Items list with qty controls */}
        <div>
          <div className="mb-3 text-xl sm:text-2xl">
            <Title text1={"YOUR"} text2={"ITEMS"} />
          </div>

          {enriched.length === 0 ? (
            <div className="rounded border p-4 text-sm text-gray-500">
              No items selected. Go back and choose a product.
            </div>
          ) : (
            <div className="space-y-3">
              {enriched.map((it, idx) => (
                <div
                  key={`${it.productId}-${it.size}-${idx}`}
                  className="flex items-center justify-between gap-3 rounded border p-3"
                >
                  {/* Thumbnail + info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded border bg-gray-50">
                      {it.thumb ? (
                        <img
                          src={it.thumb}
                          alt={it.product?.name || "Product"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-gray-100" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {it.product?.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Size: {it.size || "Default"}
                      </p>
                      <p className="text-xs text-gray-500">
                        Unit: ৳ {it.unit.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* qty + line + remove */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center rounded border">
                      <button
                        type="button"
                        onClick={() => decQty(idx)}
                        className="px-2 py-1 text-sm"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm">
                        {it.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => incQty(idx)}
                        className="px-2 py-1 text-sm"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    <div className="hidden text-sm text-gray-700 sm:block">
                      ৳ {it.line.toLocaleString()}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3) Address */}
        <div>
          <div className="mb-3 text-xl sm:text-2xl">
            <Title text1={"DELIVERY"} text2={"INFORMATION"} />
          </div>

          <div className="flex flex-col gap-3">
            {/* Name */}
            <label className="text-sm font-semibold text-gray-800">
              আপনার নাম লিখুন <span className="text-red-500">*</span>
            </label>
            <input
              required
              name="recipientName"
              value={formAddress.recipientName}
              onChange={onChangeAddress}
              className="w-full px-4 py-2 border border-gray-300 rounded"
              type="text"
              placeholder="সম্পূর্ণ নাম লিখুন"
            />

            {/* Phone */}
            <label className="text-sm font-semibold text-gray-800">
              আপনার মোবাইল নাম্বারটি লিখুন{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              required
              name="phone"
              value={formAddress.phone}
              onChange={onChangeAddress}
              className="w-full px-4 py-2 border border-gray-300 rounded"
              type="tel"
              inputMode="tel"
              placeholder="এগারো ডিজিটের সঠিক ফোন নাম্বারটি লিখুন"
            />

            {/* Address */}
            <label className="text-sm font-semibold text-gray-800">
              সম্পূর্ণ ঠিকানা <span className="text-red-500">*</span>
            </label>
            <input
              required
              name="addressLine1"
              value={formAddress.addressLine1}
              onChange={onChangeAddress}
              className="w-full px-4 py-2 border border-gray-300 rounded"
              type="text"
              placeholder="হাউজ নম্বর, রোড, উপজেলা, জেলা"
            />

            {/* District */}
            <label className="text-sm font-semibold text-gray-800">
              জেলা <span className="text-red-500">*</span>
            </label>
            <input
              required
              name="district"
              value={formAddress.district}
              onChange={onChangeAddress}
              className="w-full px-4 py-2 border border-gray-300 rounded"
              type="text"
              placeholder="জেলা লিখুন (যেমন: ঢাকা)"
            />
          </div>
        </div>

        {/* 2) Delivery area selection */}
        <div>
          <div className="mb-3 text-xl sm:text-2xl">
            <Title text1={"DELIVERY"} text2={"AREA"} />
          </div>
          <div className="rounded border p-4 text-sm text-gray-800 space-y-2">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="deliveryArea"
                  value="inside"
                  checked={deliveryArea === "inside"}
                  onChange={() => setDeliveryArea("inside")}
                  className="h-4 w-4"
                />
                Inside Dhaka City
              </span>
              <span>৳ 80.00</span>
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="deliveryArea"
                  value="outside"
                  checked={deliveryArea === "outside"}
                  onChange={() => setDeliveryArea("outside")}
                  className="h-4 w-4"
                />
                Outside Dhaka City
              </span>
              <span>৳ 150.00</span>
            </label>

            {/* New: Gazipur */}
            <label className="flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="deliveryArea"
                  value="gazipur"
                  checked={deliveryArea === "gazipur"}
                  onChange={() => setDeliveryArea("gazipur")}
                  className="h-4 w-4"
                />
                Gazipur
              </span>
              <span>৳ 120.00</span>
            </label>

            {/* New: Ashulia */}
            <label className="flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="deliveryArea"
                  value="ashulia"
                  checked={deliveryArea === "ashulia"}
                  onChange={() => setDeliveryArea("ashulia")}
                  className="h-4 w-4"
                />
                Ashulia
              </span>
              <span>৳ 120.00</span>
            </label>
          </div>
        </div>
      </div>

      {/* Right: Summary + Payment */}
      <div className="mt-8">
        <div className="mt-8 min-w-80">
          <CartTotal
            deliveryFee={deliveryFee}
            destinationLabel={deliveryLabel}
            subtotalOverride={subtotal}
          />
        </div>

        <div className="mt-12">
          <Title text1={"PAYMENT"} text2={"METHODS"} />

          <div className="flex flex-col gap-3 lg:flex-row">
            {/* bKash */}
            {/* <div
              onClick={() => setMethod("bkash")}
              className="flex items-center gap-3 p-2 px-3 border cursor-pointer"
            >
              <p
                className={`min-w-3.5 h-3.5 border rounded-full ${
                  method === "bkash" ? "bg-green-600" : ""
                }`}
              ></p>
              <img
                className="h-5 mx-4"
                src={
                  "https://freelogopng.com/images/all_img/1656227518bkash-logo-png.png"
                }
                alt="bKash"
              />
            </div> */}

            {/* COD */}
            <div
              onClick={() => setMethod("cod")}
              className="flex items-center gap-3 p-2 px-3 border cursor-pointer"
            >
              <p
                className={`min-w-3.5 h-3.5 border rounded-full ${
                  method === "cod" ? "bg-green-600" : ""
                }`}
              ></p>
              <p className="mx-4 text-sm font-medium text-gray-500">
                CASH ON DELIVERY
              </p>
            </div>
          </div>

          <div className="w-full mt-8 text-end">
            <button
              type="submit"
              className="px-16 py-3 text-sm text-white bg-black active:bg-gray-800"
            >
              PLACE ORDER
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;
