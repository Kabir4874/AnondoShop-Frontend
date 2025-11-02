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

  // ----- Products -----
  const [products, setProducts] = useState([]);

  // ----- Profile / Address (phone-only) -----
  const [user, setUser] = useState({ name: "", phone: "" });
  const [address, setAddress] = useState({
    recipientName: "",
    phone: "",
    addressLine1: "",
    district: "",
    postalCode: "",
  });

  // Loading flags
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  const authHeaders = useMemo(() => (token ? { token } : {}), [token]);

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

  // ----- Token bootstrap -----
  useEffect(() => {
    const stored = localStorage.getItem("token");
    if (!token && stored) setToken(stored);
  }, [token]);

  const setTokenAndPersist = (tk) => {
    setToken(tk);
    if (tk) {
      localStorage.setItem("token", tk);
      fetchUserProfile(tk);
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
      localStorage.removeItem("checkoutItems");
    }
  };

  // ----- USER PROFILE -----
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

  useEffect(() => {
    if (token) fetchUserProfile(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ====== CHECKOUT HELPERS (account by phone) ======
  const placeOrderCOD = async ({
    phone,
    name,
    items,
    shipTo,
    deliveryOverride,
  }) => {
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
        deliveryOverride, // optional for backend; safe to send
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

  const initiateSslPayment = async ({
    phone,
    name,
    items,
    shipTo,
    deliveryOverride,
  }) => {
    try {
      if (!phone) {
        toast.error("Phone is required");
        return { success: false };
      }
      const addressPayload = shipTo || address;
      const { data } = await axios.post(
        backendUrl + "/api/order/ssl/initiate",
        {
          phone,
          name,
          items,
          address: addressPayload,
          deliveryOverride,
        }
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

  const createBkashPayment = async ({
    phone,
    name,
    items,
    shipTo,
    deliveryOverride,
  }) => {
    try {
      if (!phone) {
        toast.error("Phone is required");
        return { success: false };
      }
      const addressPayload = shipTo || address;
      const { data } = await axios.post(
        backendUrl + "/api/order/bkash/create",
        {
          phone,
          name,
          items,
          address: addressPayload,
          deliveryOverride,
        }
      );
      if (data?.success) {
        if (data.token) setTokenAndPersist(data.token);
        return {
          success: true,
          orderId: data.orderId,
          data: data.data,
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

  // ===== Small utils for pricing on the client (used by PlaceOrder) =====
  const isXXL = (size) =>
    String(size || "")
      .toUpperCase()
      .startsWith("XXL");
  const effectivePrice = (product) => {
    const base = Number(product?.price) || 0;
    const disc = Number(product?.discount) || 0;
    return disc > 0 ? Math.max(0, base - (base * disc) / 100) : base;
  };
  const getProductById = (id) =>
    products.find((p) => String(p._id) === String(id));

  // ===== No-cart placeholders (so other components don't break) =====
  const getCartCount = () => 0;
  const setCartItems = () => {};

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

    // products / utils
    products,
    getProductById,
    effectivePrice,
    isXXL,

    // stubs for compatibility
    getCartCount,
    setCartItems,

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
