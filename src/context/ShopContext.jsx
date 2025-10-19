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
    const storedCartItems = JSON.parse(localStorage.getItem("cartItems"));
    if (storedCartItems) {
      setCartItems(storedCartItems);
    }
  }, []);

  // ----- LocalStorage: persist cart on change -----
  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  // ----- Products -----
  const getProductsData = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/product/list");
      if (response.data.success) {
        setProducts(response.data.products);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    getProductsData();
  }, []);

  // ----- Cart -----
  const addToCart = async (itemId, size) => {
    if (!size) {
      toast.error("Please Select a Size");
      return;
    } else {
      toast.success("Item Added To The Cart");
    }

    const cartData = structuredClone(cartItems);

    if (cartData[itemId]) {
      cartData[itemId][size] = (cartData[itemId][size] || 0) + 1;
    } else {
      cartData[itemId] = { [size]: 1 };
    }

    setCartItems(cartData);

    if (token) {
      try {
        await axios.post(
          backendUrl + "/api/cart/add",
          { itemId, size },
          { headers: authHeaders }
        );
      } catch (error) {
        console.log(error);
        toast.error(error.message);
      }
    }
  };

  const updateQuantity = async (itemId, size, quantity) => {
    if (quantity === 0) {
      toast.success("Item Removed From The Cart");
    }

    const cartData = structuredClone(cartItems);
    cartData[itemId][size] = quantity;
    setCartItems(cartData);

    if (token) {
      try {
        await axios.post(
          backendUrl + "/api/cart/update",
          { itemId, size, quantity },
          { headers: authHeaders }
        );
      } catch (error) {
        console.log(error);
        toast.error(error.message);
      }
    }
  };

  const getCartCount = () => {
    let totalCount = 0;
    for (const pid in cartItems) {
      for (const size in cartItems[pid]) {
        try {
          if (cartItems[pid][size] > 0) {
            totalCount += cartItems[pid][size];
          }
        } catch {
          // ignore
        }
      }
    }
    return totalCount;
  };

  const getCartAmount = () => {
    let totalAmount = 0;
    for (const pid in cartItems) {
      const itemInfo = products.find((product) => product._id === pid);
      for (const size in cartItems[pid]) {
        try {
          if (cartItems[pid][size] > 0) {
            totalAmount += (itemInfo?.price || 0) * cartItems[pid][size];
          }
        } catch {
          // ignore
        }
      }
    }
    return totalAmount;
  };

  const getUserCart = async (tk) => {
    try {
      const response = await axios.post(
        backendUrl + "/api/cart/get",
        {},
        { headers: { token: tk } }
      );
      if (response.data.success) {
        setCartItems(response.data.cartData);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  // Helper: fully clear local cart + try to sync with server
  const clearCart = async () => {
    try {
      setCartItems({});
      localStorage.removeItem("cartItems");
      if (token) {
        // Server should already clear cart after successful payment (sslSuccess),
        // but we fetch to ensure client stays in sync.
        await getUserCart(token);
      }
    } catch {
      // ignore
    }
  };

  // Optional public method to re-fetch cart
  const refreshUserCart = async () => {
    if (token) await getUserCart(token);
  };

  // ----- Token bootstrap (load from localStorage and fetch cart/profile) -----
  useEffect(() => {
    const stored = localStorage.getItem("token");
    if (!token && stored) {
      setToken(stored);
      getUserCart(stored);
    }
  }, [token]);

  // Optional helper to set token + persist
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

  // GET /api/user/profile
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

  // PUT /api/user/profile  { name, email }
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

  // POST /api/user/address  { recipientName, phone, addressLine1, district, postalCode }
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
