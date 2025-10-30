import axios from "axios";
import { createContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export const ShopContext = createContext();

const BD_PHONE_REGEX = /^(?:\+?88)?01[3-9]\d{8}$/;

const ShopContextProvider = (props) => {
  // ----- UI / Search -----
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // ----- Auth / Routing -----
  const [token, setToken] = useState("");
  const navigate = useNavigate();

  // ----- Config -----
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const currency = "&#2547;";

  // ----- Products / Cart (local only) -----
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState({}); // { [productId]: { [size]: qty } }

  // ----- Profile / Address (phone-only) -----
  const [user, setUser] = useState({ name: "", phone: "" });
  const [address, setAddress] = useState({
    recipientName: "",
    phone: "",
    addressLine1: "",
    district: "",
    postalCode: "",
  });

  // Loading flags for profile-related calls
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // Common headers (memoized)
  const authHeaders = useMemo(() => (token ? { token } : {}), [token]);

  // ===== Local helpers =====
  const isXXL = (size) => {
    if (!size) return false;
    const s = String(size).toUpperCase();
    return s.startsWith("XXL");
  };

  const effectivePrice = (item) => {
    const base = Number(item?.price) || 0;
    const disc = Number(item?.discount) || 0;
    if (disc > 0) return Math.max(0, base - (base * disc) / 100);
    return base;
  };

  // ----- LocalStorage: load cart on mount -----
  useEffect(() => {
    try {
      const stored = localStorage.getItem("cartItems");
      if (stored) setCartItems(JSON.parse(stored));
    } catch {}
  }, []);

  // ----- LocalStorage: persist cart on change -----
  useEffect(() => {
    try {
      localStorage.setItem("cartItems", JSON.stringify(cartItems));
    } catch {}
  }, [cartItems]);

  // ----- Products -----
  const getProductsData = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/product/list");
      if (data.success) {
        setProducts(data.products || []);
      } else {
        toast.error(data.message || "Failed to load products");
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message || "Failed to load products");
    }
  };

  useEffect(() => {
    getProductsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----- Cart (LOCAL ONLY) -----
  const addToCart = (itemId, size) => {
    if (!size) {
      toast.error("Please Select a Size");
      return;
    }
    setCartItems((prev) => {
      const next = structuredClone(prev || {});
      if (!next[itemId]) next[itemId] = {};
      next[itemId][size] = (next[itemId][size] || 0) + 1;
      return next;
    });
    toast.success("Item Added To The Cart");
  };

  const updateQuantity = (itemId, size, quantity) => {
    setCartItems((prev) => {
      const next = structuredClone(prev || {});
      if (!next[itemId]) next[itemId] = {};
      next[itemId][size] = Math.max(0, Number(quantity) || 0);

      // Clean up empty sizes / products
      if (next[itemId][size] === 0) {
        delete next[itemId][size];
        if (Object.keys(next[itemId]).length === 0) delete next[itemId];
        toast.success("Item Removed From The Cart");
      }
      return next;
    });
  };

  /** Move quantity from one size to another atomically (local) */
  const moveCartItemSize = (itemId, fromSize, toSize) => {
    if (!itemId || !fromSize || !toSize || fromSize === toSize) return;

    setCartItems((prev) => {
      const next = structuredClone(prev || {});
      const product = next[itemId] || {};
      const fromQty = Number(product[fromSize] || 0);
      const toQty = Number(product[toSize] || 0);

      if (fromQty <= 0) return next;

      if (!next[itemId]) next[itemId] = {};
      next[itemId][toSize] = toQty + fromQty;
      delete next[itemId][fromSize];

      if (Object.keys(next[itemId]).length === 0) delete next[itemId];
      return next;
    });
  };

  const getCartCount = () => {
    let total = 0;
    for (const pid in cartItems) {
      const sizes = cartItems[pid];
      for (const s in sizes) {
        const q = Number(sizes[s]) || 0;
        if (q > 0) total += q;
      }
    }
    return total;
  };

  /** Local estimate: discount-applied price + XXL surcharge (+50/item) */
  const getCartAmount = () => {
    let totalAmount = 0;
    for (const pid in cartItems) {
      const itemInfo = products.find((p) => p._id === pid);
      for (const size in cartItems[pid]) {
        const qty = Number(cartItems[pid][size]) || 0;
        if (qty > 0) {
          const unit = effectivePrice(itemInfo);
          const xxlFee = isXXL(size) ? 50 : 0;
          totalAmount += (unit + xxlFee) * qty;
        }
      }
    }
    return totalAmount;
  };

  // Helper: fully clear local cart
  const clearCart = () => {
    try {
      setCartItems({});
      localStorage.removeItem("cartItems");
    } catch {}
  };

  // ----- Token bootstrap -----
  useEffect(() => {
    const stored = localStorage.getItem("token");
    if (!token && stored) {
      setToken(stored);
    }
  }, [token]);

  // Helper to persist token
  const setTokenAndPersist = (tk) => {
    setToken(tk);
    if (tk) {
      localStorage.setItem("token", tk);
      fetchUserProfile(tk); // prefetch profile
    } else {
      localStorage.removeItem("token");
      setUser({ name: "", phone: "" });
      setAddress({
        recipientName: "",
        phone: "",
        addressLine1: "",
        district: "",
        postalCode: "",
      });
      setCartItems({});
      localStorage.removeItem("cartItems");
    }
  };

  // ----- USER PROFILE API CALLS -----
  const fetchUserProfile = async (tk = token) => {
    if (!tk) return;
    setIsProfileLoading(true);
    try {
      const res = await axios.get(backendUrl + "/api/user/profile", {
        headers: { token: tk },
      });
      if (res?.data?.success) {
        const u = res.data.user || {};
        setUser({ name: u.name || "", phone: u.phone || "" });

        const addr = u.address || {};
        setAddress({
          recipientName: addr.recipientName || "",
          phone: addr.phone || "",
          addressLine1: addr.addressLine1 || "",
          district: addr.district || "",
          postalCode: addr.postalCode || "",
        });
      } else {
        toast.error(res?.data?.message || "Failed to load profile");
      }
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.message ||
          error.message ||
          "Failed to load profile"
      );
    } finally {
      setIsProfileLoading(false);
    }
  };

  const saveUserAddress = async (addr) => {
    if (!token) {
      toast.error("You must be logged in.");
      return;
    }

    const { recipientName, phone, addressLine1, district, postalCode } =
      addr || {};
    if (!recipientName || !phone || !addressLine1 || !district || !postalCode) {
      toast.error("All address fields are required.");
      return;
    }
    if (!BD_PHONE_REGEX.test(String(phone))) {
      toast.error("Invalid Bangladesh phone number.");
      return;
    }

    setIsSavingAddress(true);
    try {
      const res = await axios.post(
        backendUrl + "/api/user/address",
        { recipientName, phone, addressLine1, district, postalCode },
        { headers: authHeaders }
      );
      if (res?.data?.success) {
        setAddress({
          recipientName,
          phone,
          addressLine1,
          district,
          postalCode,
        });
        toast.success("Address saved successfully");
      } else {
        toast.error(res?.data?.message || "Failed to save address");
      }
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.message ||
          error.message ||
          "Failed to save address"
      );
    } finally {
      setIsSavingAddress(false);
    }
  };

  // Hydrate profile when token changes
  useEffect(() => {
    if (token) fetchUserProfile(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ====== CHECKOUT HELPERS (create account by phone implicitly) ======
  /**
   * Place COD order.
   * Backend will ensure/create user by phone and return { token, passwordSet, orderId }.
   */
  const placeOrderCOD = async ({ phone, name, items, shipTo }) => {
    try {
      if (!phone) {
        toast.error("Phone is required");
        return { success: false };
      }
      const addressPayload = shipTo || address;
      const { data } = await axios.post(backendUrl + "/api/order/place", {
        phone,
        name,
        items,
        address: addressPayload,
      });
      if (data?.success) {
        if (data.token) setTokenAndPersist(data.token);
        return {
          success: true,
          orderId: data.orderId,
          passwordSet: data.passwordSet,
        };
      }
      toast.error(data?.message || "Order failed");
      return { success: false };
    } catch (err) {
      console.error(err);
      toast.error(
        err?.response?.data?.message || err.message || "Order failed"
      );
      return { success: false };
    }
  };

  /**
   * Start SSLCommerz payment. Returns { url, orderId, token?, passwordSet? }.
   * Redirect the user to `url` if present.
   */
  const initiateSslPayment = async ({ phone, name, items, shipTo }) => {
    try {
      if (!phone) {
        toast.error("Phone is required");
        return { success: false };
      }
      const addressPayload = shipTo || address;
      const { data } = await axios.post(
        backendUrl + "/api/order/ssl/initiate",
        { phone, name, items, address: addressPayload }
      );
      if (data?.success) {
        if (data.token) setTokenAndPersist(data.token);
        return {
          success: true,
          url: data.url,
          orderId: data.orderId,
          passwordSet: data.passwordSet,
        };
      }
      toast.error(data?.message || "Payment init failed");
      return { success: false };
    } catch (err) {
      console.error(err);
      toast.error(
        err?.response?.data?.message || err.message || "Payment init failed"
      );
      return { success: false };
    }
  };

  /**
   * Start bKash Hosted payment. Returns { data, orderId, token?, passwordSet? }.
   * Redirect the user using `data.bkashURL` if the SDK provides it, or follow your frontend flow.
   */
  const createBkashPayment = async ({ phone, name, items, shipTo }) => {
    try {
      if (!phone) {
        toast.error("Phone is required");
        return { success: false };
      }
      const addressPayload = shipTo || address;
      const { data } = await axios.post(
        backendUrl + "/api/order/bkash/create",
        { phone, name, items, address: addressPayload }
      );
      if (data?.success) {
        if (data.token) setTokenAndPersist(data.token);
        return {
          success: true,
          orderId: data.orderId,
          data: data.data, // payload from bKash create
          passwordSet: data.passwordSet,
        };
      }
      toast.error(data?.message || "bKash init failed");
      return { success: false };
    } catch (err) {
      console.error(err);
      toast.error(
        err?.response?.data?.message || err.message || "bKash init failed"
      );
      return { success: false };
    }
  };

  // ----- Context value -----
  const value = {
    // config
    backendUrl,
    currency,

    // navigation
    navigate,

    // auth
    token,
    setToken: setTokenAndPersist,

    // search
    search,
    setSearch,
    showSearch,
    setShowSearch,

    // products / cart (LOCAL ONLY)
    products,
    cartItems,
    setCartItems,
    addToCart,
    updateQuantity,
    moveCartItemSize,
    getCartCount,
    getCartAmount,
    clearCart,

    // profile / address
    user,
    setUser,
    address,
    setAddress,

    fetchUserProfile,
    saveUserAddress,

    // loading flags
    isProfileLoading,
    isSavingAddress,

    // checkout
    placeOrderCOD,
    initiateSslPayment,
    createBkashPayment,
  };

  return (
    <ShopContext.Provider value={value}>{props.children}</ShopContext.Provider>
  );
};

export default ShopContextProvider;
