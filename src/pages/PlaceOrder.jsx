import axios from "axios";
import { useContext, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import CartTotal from "../components/CartTotal";
import Title from "../components/Title";
import { ShopContext } from "../context/ShopContext";
import { trackEvent } from "../lib/tracking";

const BD_PHONE_REGEX = /^(?:\+?88)?01[3-9]\d{8}$/;

function computeDeliveryFee(address) {
  if (!address) return { fee: 150, label: "Other" };
  const d = String(address.district || "")
    .toLowerCase()
    .trim();
  const line = String(address.addressLine1 || "").toLowerCase();

  if (d === "dhaka") return { fee: 80, label: "Dhaka" };
  if (d === "gazipur") return { fee: 120, label: "Gazipur" };

  const savarHit = d.includes("savar") || line.includes("savar");
  const ashuliaHit =
    d.includes("ashulia") ||
    d.includes("asulia") ||
    line.includes("ashulia") ||
    line.includes("asulia");

  if (savarHit || ashuliaHit) return { fee: 120, label: "Savar/Ashulia" };

  return { fee: 150, label: "Other" };
}

function calcCartSubtotal(products = [], cartItems = {}) {
  const map = new Map(products.map((p) => [p._id, p]));
  let sub = 0;
  for (const productId in cartItems) {
    const product = map.get(productId);
    if (!product) continue;
    const base = Number(product.price) || 0;
    const discount = Number(product.discount) || 0;
    const final =
      discount > 0 ? Math.max(0, base - (base * discount) / 100) : base;

    const sizes = cartItems[productId] || {};
    for (const sizeKey in sizes) {
      const qty = Number(sizes[sizeKey]) || 0;
      if (qty <= 0) continue;
      sub += final * qty;
    }
  }
  return sub;
}

const PlaceOrder = () => {
  // Default payment method (you can switch to "cod" if you prefer)
  const [method, setMethod] = useState("bkash"); // "cod" | "bkash"

  const {
    navigate,
    backendUrl,
    setToken, // store token from checkout response
    cartItems,
    setCartItems,
    products,
    user, // { name, phone } from context (may be empty for new users)
    address: savedAddress,
  } = useContext(ShopContext);

  // Form state (autofilled from saved address)
  const [formAddress, setFormAddress] = useState({
    recipientName: "",
    phone: "",
    addressLine1: "",
    district: "",
  });

  // Autofill whenever savedAddress changes (e.g., user loaded profile)
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

  const isAddressEmpty = (addr) =>
    !addr?.recipientName &&
    !addr?.phone &&
    !addr?.addressLine1 &&
    !addr?.district;

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

  const buildOrderItems = () => {
    const orderItems = [];
    for (const productId in cartItems) {
      for (const size in cartItems[productId]) {
        const qty = cartItems[productId][size];
        if (qty > 0) {
          const itemInfo = structuredClone(
            products.find((p) => p._id === productId)
          );
          if (itemInfo) {
            itemInfo.size = size;
            itemInfo.quantity = qty;
            orderItems.push(itemInfo);
          }
        }
      }
    }
    return orderItems;
  };

  // Dynamic delivery fee from the current address
  const { fee: deliveryFee, label: deliveryLabel } = useMemo(
    () => computeDeliveryFee(formAddress),
    [formAddress]
  );

  // Subtotal (discount-aware; backend will still re-check)
  const subtotal = useMemo(
    () => calcCartSubtotal(products, cartItems),
    [products, cartItems]
  );

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    const items = buildOrderItems();
    if (items.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }

    // Validate address
    const addressToUse = { ...formAddress };
    if (!validateAddress(addressToUse)) return;

    // Determine display name to save on user profile (fallback to recipient name)
    const profileName = user?.name || addressToUse.recipientName;

    try {
      if (method === "cod") {
        // COD — creates/ensures account by phone
        const { data } = await axios.post(`${backendUrl}/api/order/place`, {
          phone: addressToUse.phone,
          name: profileName,
          items,
          address: addressToUse,
        });

        if (data?.success) {
          // Save token returned from checkout (so user can set password later)
          if (data.token) setToken(data.token);

          // --- Optional: tracking (don’t block UX) ---
          try {
            await trackEvent(backendUrl, {
              name: "Purchase",
              eventId: data.orderId,
              phone: addressToUse.phone,
              value: subtotal + deliveryFee, // UI estimate; backend authoritative
              currency: "BDT",
              content_ids: items.map((i) => String(i._id || i.productId)),
              content_name: data.orderId ? `Order #${data.orderId}` : "Order",
            });
          } catch {}

          setCartItems({});
          toast.success("Order placed successfully");
          navigate("/orders");
          return;
        }

        toast.error(data?.message || "Failed to place order");
      } else if (method === "bkash") {
        // bKash Hosted — creates/ensures account by phone, returns payload with redirect URL
        const { data } = await axios.post(
          `${backendUrl}/api/order/bkash/create`,
          {
            phone: addressToUse.phone,
            name: profileName,
            items,
            address: addressToUse,
          }
        );

        if (data?.success) {
          if (data.token) setToken(data.token);

          // Try to find a usable redirect URL from various SDK shapes
          const redirectUrl =
            data?.url ||
            data?.redirectURL ||
            data?.redirectUrl ||
            data?.bkashURL ||
            data?.data?.bkashURL ||
            data?.data?.url ||
            data?.data?.redirectURL;

          if (redirectUrl) {
            window.location.replace(redirectUrl);
            return;
          } else {
            toast.error("bKash URL missing in response");
            return;
          }
        }

        toast.error(data?.message || "Failed to initialize bKash payment");
      }

      // else if (method === "sslcommerz") {
      //   const { data } = await axios.post(
      //     `${backendUrl}/api/order/ssl/initiate`,
      //     {
      //       phone: addressToUse.phone,
      //       name: profileName,
      //       items,
      //       address: addressToUse,
      //     }
      //   );
      //   if (data?.success && data?.url) {
      //     if (data.token) setToken(data.token);
      //     window.location.replace(data.url);
      //   } else {
      //     toast.error(data?.message || "Failed to initialize payment");
      //   }
      // }
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
      {/* Left Side — Delivery Info (BD minimal) */}
      <div className="flex flex-col w-full gap-4 sm:max-w-[480px]">
        <div className="my-3 text-xl sm:text-2xl">
          <Title text1={"DELIVERY"} text2={"INFORMATION"} />
        </div>

        <input
          required
          name="recipientName"
          value={formAddress.recipientName}
          onChange={onChangeAddress}
          className="w-full px-4 py-2 border border-gray-300 rounded"
          type="text"
          placeholder="Recipient Name"
        />

        <input
          required
          name="phone"
          value={formAddress.phone}
          onChange={onChangeAddress}
          className="w-full px-4 py-2 border border-gray-300 rounded"
          type="tel"
          inputMode="tel"
          placeholder="01XXXXXXXXX or +8801XXXXXXXXX"
        />

        <input
          required
          name="addressLine1"
          value={formAddress.addressLine1}
          onChange={onChangeAddress}
          className="w-full px-4 py-2 border border-gray-300 rounded"
          type="text"
          placeholder="House/Road/Village (e.g., Savar, Ashulia, etc.)"
        />

        <div className="flex gap-3">
          <input
            required
            name="district"
            value={formAddress.district}
            onChange={onChangeAddress}
            className="w-full px-4 py-2 border border-gray-300 rounded"
            type="text"
            placeholder="District (e.g., Dhaka / Gazipur)"
          />
        </div>
      </div>

      {/* Right Side — Summary + Payment */}
      <div className="mt-8">
        <div className="mt-8 min-w-80">
          {/* Pass dynamic delivery fee + label so summary matches the UI estimate;
              backend will still recompute the final amount. */}
          <CartTotal
            deliveryFee={deliveryFee}
            destinationLabel={deliveryLabel}
          />
        </div>

        <div className="mt-12">
          <Title text1={"PAYMENT"} text2={"METHODS"} />

          <div className="flex flex-col gap-3 lg:flex-row">
            {/* bKash */}
            <div
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
            </div>

            {/* SSLCommerz (optional) */}
            {/*
            <div
              onClick={() => setMethod("sslcommerz")}
              className="flex items-center gap-3 p-2 px-3 border cursor-pointer"
            >
              <p
                className={`min-w-3.5 h-3.5 border rounded-full ${
                  method === "sslcommerz" ? "bg-green-600" : ""
                }`}
              ></p>
              <img className="h-5 mx-4" src={assets.ssl_logo} alt="SSLCommerz" />
            </div>
            */}

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
