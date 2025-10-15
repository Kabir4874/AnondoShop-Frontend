import { useContext, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { assets } from "../assets/assets";
import { ShopContext } from "../context/ShopContext";

const NavBar = () => {
  const [visible, setVisible] = useState(false);
  const {
    setShowSearch,
    getCartCount,
    navigate,
    token,
    setToken,
    setCartItems,
  } = useContext(ShopContext);

  const logout = () => {
    navigate("/login");
    localStorage.removeItem("token");
    setToken("");
    setCartItems({});
  };

  // Spacer to prevent layout shift (navbar height ≈ 80px)
  const NAV_HEIGHT_PX = 80;

  return (
    <>
      {/* Spacer so content isn't hidden behind navbar */}
      <div style={{ height: NAV_HEIGHT_PX }} />

      {/* Fixed navbar, centered content, not full-width */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <div className="mx-auto w-[90%] max-w-[1560px] flex items-center justify-between py-5 font-medium">
          <Link to="/">
            <span className="prata-regular leading-relaxed !font-medium text-lg md:text-3xl">
              AnondoShop
            </span>
          </Link>

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

          <div className="flex items-center gap-6">
            <img
              onClick={() => setShowSearch(true)}
              src={assets.search_icon}
              className="w-5 cursor-pointer"
              alt="Search Products"
            />

            <div className="group relative">
              <img
                onClick={() => (token ? null : navigate("/login"))}
                src={assets.profile_icon}
                className="w-5 cursor-pointer"
                alt="Your Profile"
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

            <img
              onClick={() => setVisible(true)}
              src={assets.menu_icon}
              className="w-5 cursor-pointer sm:hidden"
              alt="Menu Icon"
            />
          </div>
        </div>

        {/* Sidebar menu for smaller screens */}
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
                alt="Dropdown"
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
    </>
  );
};

export default NavBar;
