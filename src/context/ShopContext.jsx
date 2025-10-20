import axios from "axios";
import { createContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export const ShopContext = createContext();

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
  const delivery_fee = 150;

  // ----- Products / Cart -----
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState({});

  // ----- Profile / Address -----
  const [user, setUser] = useState({ name: "", email: "" });
  const [address, setAddress] = useState({
    recipientName: "",
    phone: "",
    addressLine1: "",
    district: "",
    postalCode: "",
  });

  // Loading flags for profile-related calls
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // Common headers (memoized)
  const authHeaders = useMemo(() => (token ? { token } : {}), [token]);

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
  }, []);

  // ----- Cart (functional, race-safe) -----
  const addToCart = async (itemId, size) => {
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

    if (token) {
      try {
        await axios.post(
          backendUrl + "/api/cart/add",
          { itemId, size },
          { headers: authHeaders }
        );
      } catch (error) {
        console.log(error);
        toast.error(error.message || "Failed to sync cart");
      }
    }
  };

  const updateQuantity = async (itemId, size, quantity) => {
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

    if (token) {
      try {
        await axios.post(
          backendUrl + "/api/cart/update",
          { itemId, size, quantity },
          { headers: authHeaders }
        );
      } catch (error) {
        console.log(error);
        toast.error(error.message || "Failed to sync cart");
      }
    }
  };

  /** Move quantity from one size to another atomically (local), then sync server */
  const moveCartItemSize = async (itemId, fromSize, toSize) => {
    if (!itemId || !fromSize || !toSize || fromSize === toSize) return;

    let newQtyForToSize = 0;
    let oldQtyForFromSize = 0;

    // 1) Atomic local move
    setCartItems((prev) => {
      const next = structuredClone(prev || {});
      const product = next[itemId] || {};
      const fromQty = Number(product[fromSize] || 0);
      const toQty = Number(product[toSize] || 0);

      oldQtyForFromSize = fromQty;
      newQtyForToSize = toQty + fromQty;

      if (!next[itemId]) next[itemId] = {};
      next[itemId][toSize] = newQtyForToSize;
      next[itemId][fromSize] = 0;

      // clean up
      delete next[itemId][fromSize];
      if (Object.keys(next[itemId]).length === 0) delete next[itemId];

      return next;
    });

    // 2) Server sync (merge to new size, then zero old size)
    if (token && oldQtyForFromSize > 0) {
      try {
        await axios.post(
          backendUrl + "/api/cart/update",
          { itemId, size: toSize, quantity: newQtyForToSize },
          { headers: authHeaders }
        );
        await axios.post(
          backendUrl + "/api/cart/update",
          { itemId, size: fromSize, quantity: 0 },
          { headers: authHeaders }
        );
      } catch (error) {
        console.log(error);
        toast.error(error.message || "Failed to sync size change");
      }
    }
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

  const getCartAmount = () => {
    let totalAmount = 0;
    for (const pid in cartItems) {
      const itemInfo = products.find((p) => p._id === pid);
      for (const size in cartItems[pid]) {
        const qty = Number(cartItems[pid][size]) || 0;
        if (qty > 0) {
          totalAmount += (itemInfo?.price || 0) * qty;
        }
      }
    }
    return totalAmount;
  };

  const getUserCart = async (tk) => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/cart/get",
        {},
        { headers: { token: tk } }
      );
      if (data.success && data.cartData) {
        setCartItems(data.cartData);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message || "Failed to fetch cart");
    }
  };

  // Helper: fully clear local cart + try to sync with server
  const clearCart = async () => {
    try {
      setCartItems({});
      localStorage.removeItem("cartItems");
      if (token) {
        await getUserCart(token);
      }
    } catch {}
  };

  // Optional public method to re-fetch cart
  const refreshUserCart = async () => {
    if (token) await getUserCart(token);
  };

  // ----- Token bootstrap -----
  useEffect(() => {
    const stored = localStorage.getItem("token");
    if (!token && stored) {
      setToken(stored);
      getUserCart(stored);
    }
  }, [token]);

  // Helper to persist token
  const setTokenAndPersist = (tk) => {
    setToken(tk);
    if (tk) {
      localStorage.setItem("token", tk);
      getUserCart(tk);
      fetchUserProfile(tk); // prefetch profile
    } else {
      localStorage.removeItem("token");
      setUser({ name: "", email: "" });
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
        setUser({ name: u.name || "", email: u.email || "" });

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

  const updateUserProfile = async ({ name, email }) => {
    if (!token) {
      toast.error("You must be logged in.");
      return;
    }
    if (!name || !email) {
      toast.error("Name and email are required.");
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await axios.put(
        backendUrl + "/api/user/profile",
        { name, email },
        { headers: authHeaders }
      );
      if (res?.data?.success) {
        setUser({ name, email });
        toast.success("Profile updated successfully");
      } else {
        toast.error(res?.data?.message || "Failed to update profile");
      }
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.message ||
          error.message ||
          "Failed to update profile"
      );
    } finally {
      setIsSavingProfile(false);
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

  // (Optional) Call once after token loads to hydrate profile
  useEffect(() => {
    if (token) fetchUserProfile(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ----- Context value -----
  const value = {
    // config
    backendUrl,
    currency,
    delivery_fee,

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

    // products / cart
    products,
    cartItems,
    setCartItems,
    addToCart,
    updateQuantity,
    moveCartItemSize, // <— expose atomic size mover
    getCartCount,
    getCartAmount,

    // CART helpers
    clearCart,
    refreshUserCart,

    // profile / address
    user,
    setUser,
    address,
    setAddress,

    fetchUserProfile,
    updateUserProfile,
    saveUserAddress,

    // loading flags
    isProfileLoading,
    isSavingProfile,
    isSavingAddress,
  };

  return (
    <ShopContext.Provider value={value}>{props.children}</ShopContext.Provider>
  );
};

export default ShopContextProvider;
