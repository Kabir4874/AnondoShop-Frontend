import axios from "axios";
import {
  ChevronRight,
  Home as HomeIcon,
  List as ListIcon,
  Phone as PhoneIcon,
  ShoppingBag as ShoppingBagIcon,
  X,
} from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { ShopContext } from "../context/ShopContext";

const NavBar = () => {
  // Existing mobile hamburger sidebar (right side)
  const [visible, setVisible] = useState(false);

  // New: categories drawer (left side)
  const [catOpen, setCatOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(false);

  const {
    setShowSearch,
    getCartCount,
    token,
    setToken,
    setCartItems,
    backendUrl,
  } = useContext(ShopContext);

  const navigate = useNavigate();

  const logout = () => {
    navigate("/login");
    localStorage.removeItem("token");
    setToken("");
    setCartItems({});
  };

  // Spacer to prevent layout shift under the top navbar on desktop/tablet
  const NAV_HEIGHT_PX = 80;

  // Fetch categories when the drawer opens
  useEffect(() => {
    const fetchCats = async () => {
      if (!catOpen || categories.length > 0) return;
      try {
        setLoadingCats(true);
        const params = new URLSearchParams({
          active: "true",
          limit: "200",
          sort: "name",
        });
        const { data } = await axios.get(
          `${backendUrl}/api/category?${params.toString()}`
        );
        if (data?.success && Array.isArray(data.categories)) {
          setCategories(data.categories);
        } else {
          setCategories([]);
        }
      } catch {
        setCategories([]);
      } finally {
        setLoadingCats(false);
      }
    };
    fetchCats();
  }, [catOpen, categories.length, backendUrl]);

  const onCategoryClick = (cat) => {
    const val = cat?.name || cat?.slug || "";
    if (!val) return;
    setCatOpen(false);
    navigate(`/collection?category=${encodeURIComponent(val)}`);
  };

  return (
    <>
      {/* Desktop spacer only */}
      <div className="hidden sm:block" style={{ height: NAV_HEIGHT_PX }} />

      {/* ===== Fixed TOP NAVBAR (desktop unchanged; mobile has search/cart/menu as before) ===== */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white shadow-sm">
        <div className="mx-auto w-[90%] max-w-[1560px] flex items-center justify-between py-5 font-medium">
          <Link to="/">
            <span className="prata-regular leading-relaxed !font-medium text-lg md:text-3xl">
              AnondoShop
            </span>
          </Link>

          {/* Desktop menu (unchanged) */}
          <ul className="hidden gap-5 text-sm text-gray-700 sm:flex">
            <NavLink to="/" className="flex flex-col items-center gap-1">
              <p>HOME</p>
              <hr className="hidden h-[1.5px] w-2/4 border-none bg-gray-700" />
            </NavLink>
            <NavLink
              to="/collection"
              className="flex flex-col items-center gap-1"
            >
              <p>COLLECTION</p>
              <hr className="hidden h-[1.5px] w-2/4 border-none bg-gray-700" />
            </NavLink>
            <NavLink to="/about" className="flex flex-col items-center gap-1">
              <p>ABOUT</p>
              <hr className="hidden h-[1.5px] w-2/4 border-none bg-gray-700" />
            </NavLink>
            <NavLink to="/contact" className="flex flex-col items-center gap-1">
              <p>CONTACT</p>
              <hr className="hidden h-[1.5px] w-2/4 border-none bg-gray-700" />
            </NavLink>
          </ul>

          {/* Desktop actions (unchanged) */}
          <div className="hidden sm:flex items-center gap-6">
            <img
              onClick={() => setShowSearch(true)}
              src={assets.search_icon}
              className="w-5 cursor-pointer"
              alt="Search"
            />

            <div className="group relative">
              <img
                onClick={() => (token ? null : navigate("/login"))}
                src={assets.profile_icon}
                className="w-5 cursor-pointer"
                alt="Profile"
              />
              {token && (
                <div className="dropdown-menu absolute right-0 hidden pt-4 group-hover:block">
                  <div className="flex w-36 flex-col gap-2 rounded bg-slate-100 px-5 py-3 text-gray-500">
                    <p
                      onClick={() => navigate("/profile")}
                      className="cursor-pointer hover:text-black"
                    >
                      Profile
                    </p>
                    <p
                      onClick={() => navigate("/orders")}
                      className="cursor-pointer hover:text-black"
                    >
                      Orders
                    </p>
                    <p
                      onClick={logout}
                      className="cursor-pointer hover:text-black"
                    >
                      Logout
                    </p>
                  </div>
                </div>
              )}
            </div>

            <Link to="/cart" className="relative">
              <img src={assets.cart_icon} className="min-w-5 w-5" alt="Cart" />
              <p className="absolute right-[-5px] bottom-[-5px] aspect-square w-4 rounded-full bg-black text-center text-[8px] leading-4 text-white">
                {getCartCount()}
              </p>
            </Link>
          </div>

          {/* Mobile actions in top-right (unchanged): search / cart / hamburger */}
          <div className="flex items-center gap-5 sm:hidden">
            <img
              onClick={() => setShowSearch(true)}
              src={assets.search_icon}
              className="w-5 cursor-pointer"
              alt="Search"
            />
            <Link to="/cart" className="relative">
              <img src={assets.cart_icon} className="min-w-5 w-5" alt="Cart" />
              <p className="absolute right-[-5px] bottom-[-5px] aspect-square w-4 rounded-full bg-black text-center text-[8px] leading-4 text-white">
                {getCartCount()}
              </p>
            </Link>
            <img
              onClick={() => setVisible(true)}
              src={assets.menu_icon}
              className="w-5 cursor-pointer sm:hidden"
              alt="Menu"
            />
          </div>
        </div>

        {/* Existing right-side hamburger sidebar for mobile (kept as-is) */}
        <div
          className={`fixed inset-y-0 right-0 z-50 overflow-hidden bg-white transition-all ${
            visible ? "w-full" : "w-0"
          } sm:hidden`}
        >
          <div className="flex flex-col text-gray-600">
            <div
              onClick={() => setVisible(false)}
              className="flex cursor-pointer items-center gap-4 p-3"
            >
              <img
                src={assets.dropdown_icon}
                className="h-4 rotate-180"
                alt="Back"
              />
              <p>Back</p>
            </div>
            <NavLink
              onClick={() => setVisible(false)}
              className="border py-2 pl-6"
              to="/"
            >
              HOME
            </NavLink>
            <NavLink
              onClick={() => setVisible(false)}
              className="border py-2 pl-6"
              to="/collection"
            >
              COLLECTION
            </NavLink>
            <NavLink
              onClick={() => setVisible(false)}
              className="border py-2 pl-6"
              to="/about"
            >
              ABOUT
            </NavLink>
            <NavLink
              onClick={() => setVisible(false)}
              className="border py-2 pl-6"
              to="/contact"
            >
              CONTACT
            </NavLink>
          </div>
        </div>
      </div>

      {/* ===== MOBILE BOTTOM NAV — now includes Categories, Home, Collection, Offer, Contact ===== */}
      <nav className="fixed bottom-0 inset-x-0 z-50 sm:hidden bg-white border-t border-gray-200">
        <div className="mx-auto max-w-[1560px] w-full">
          <div className="grid grid-cols-4">
            {/* Categories (opens left drawer) */}
            <button
              type="button"
              onClick={() => setCatOpen(true)}
              className="flex flex-col items-center justify-center gap-1 py-2 text-[11px] text-gray-700"
            >
              <ListIcon size={20} />
              <span>CATEGORIES</span>
            </button>

            {/* Home */}
            <NavLink
              to="/"
              className="flex flex-col items-center justify-center gap-1 py-2 text-[11px] text-gray-700"
            >
              <HomeIcon size={20} />
              <span>HOME</span>
            </NavLink>

            {/* Collection */}
            <NavLink
              to="/collection"
              className="flex flex-col items-center justify-center gap-1 py-2 text-[11px] text-gray-700"
            >
              <ShoppingBagIcon size={20} />
              <span>COLLECTION</span>
            </NavLink>

            {/* Contact */}
            <NavLink
              to="/contact"
              className="flex flex-col items-center justify-center gap-1 py-2 text-[11px] text-gray-700"
            >
              <PhoneIcon size={20} />
              <span>CONTACT</span>
            </NavLink>
          </div>
        </div>
      </nav>

      {/* ===== LEFT CATEGORIES DRAWER (mobile) ===== */}
      <div
        className={`sm:hidden fixed inset-0 z-[60] ${
          catOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          onClick={() => setCatOpen(false)}
          className={`absolute inset-0 bg-black/40 transition-opacity ${
            catOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        {/* Panel */}
        <aside
          className={`absolute left-0 top-0 bottom-0 w-[85%] max-w-[360px] bg-white shadow-xl transition-transform ${
            catOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b">
            <h3 className="text-base font-semibold tracking-wide">
              ALL CATEGORIES
            </h3>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setCatOpen(false)}
              className="p-2 rounded hover:bg-gray-100 active:bg-gray-200"
            >
              <X size={18} />
            </button>
          </div>

          {/* List */}
          <div className="overflow-y-auto h-full">
            {loadingCats ? (
              <div className="px-4 py-3 text-sm text-gray-500">Loading…</div>
            ) : categories.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500">
                No categories found.
              </div>
            ) : (
              <ul className="divide-y">
                {categories.map((c) => {
                  const label = c?.name || c?.slug || "Category";
                  return (
                    <li key={c._id || label}>
                      <button
                        type="button"
                        onClick={() => onCategoryClick(c)}
                        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 active:bg-gray-100"
                      >
                        <span className="text-sm">{label}</span>
                        <ChevronRight size={16} className="text-gray-400" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>
      </div>

      {/* Bottom safe-area spacer to avoid content hidden behind bottom nav on mobile */}
      <div className="sm:hidden h-20" />
    </>
  );
};

export default NavBar;
