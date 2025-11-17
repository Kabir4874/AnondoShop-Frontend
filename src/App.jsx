import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Route, Routes, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import FloatingWhatsAppButton from "./components/FloatingWhatsAppButton";
import Footer from "./components/Footer";
import HeadlinesTicker from "./components/HeadlinesTicker";
import NavBar from "./components/NavBar";
import SearchBar from "./components/SearchBar";
import { initMarketingPixels } from "./lib/tracking";

import About from "./pages/About";
import Collection from "./pages/Collection";
import Contact from "./pages/Contact";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Orders from "./pages/Orders";
import PaymentResult from "./pages/PaymentResult";
import PlaceOrder from "./pages/PlaceOrder";
import Product from "./pages/Product";
import Profile from "./pages/Profile";

export const backendUrl = import.meta.env.VITE_BACKEND_URL;

export const SITE_URL = "https://anondoshopbd.com";

const App = () => {
  const location = useLocation();

  useEffect(() => {
    initMarketingPixels(backendUrl);
  }, []);

  const canonicalUrl = `${SITE_URL}${location.pathname}${
    location.search || ""
  }`;

  return (
    <>
      <Helmet
        htmlAttributes={{ lang: "en" }}
        defaultTitle="AnondoShop | Find What Moves You"
        titleTemplate="AnondoShop | %s"
      >
        <title>AnondoShop | Find What Moves You</title>

        <meta
          name="description"
          content="AnondoShop is a Bangladeshi online marketplace to discover fashion, electronics, home essentials and more. Enjoy secure checkout with bKash and Cash on Delivery."
        />
        <meta
          name="keywords"
          content="AnondoShop, online shop Bangladesh, ecommerce BD, shopping, fashion, electronics, home essentials, bKash, cash on delivery, COD, online store"
        />
        <meta name="author" content="AnondoShop" />
        <meta name="robots" content="index,follow" />
        <meta name="theme-color" content="#ff5722" />

        {/* Canonical & social sharing */}
        <link rel="canonical" href={canonicalUrl} />

        <meta property="og:site_name" content="AnondoShop" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="AnondoShop | Find What Moves You" />
        <meta
          property="og:description"
          content="Shop easily at AnondoShop – discover products that match your lifestyle with fast delivery, bKash payments and Cash on Delivery in Bangladesh."
        />
        <meta
          property="og:image"
          content="https://cdn-icons-png.flaticon.com/512/625/625149.png"
        />
        <meta property="og:url" content={canonicalUrl} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="AnondoShop | Find What Moves You" />
        <meta
          name="twitter:description"
          content="Discover fashion, electronics and home essentials on AnondoShop with secure checkout and smooth shopping."
        />
        <meta
          name="twitter:image"
          content="https://cdn-icons-png.flaticon.com/512/625/625149.png"
        />
      </Helmet>

      <div className="px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]">
        <ToastContainer />
        <NavBar />
        <HeadlinesTicker />
        <SearchBar />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/collection" element={<Collection />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/product/:productId" element={<Product />} />
          <Route path="/login" element={<Login />} />
          <Route path="/place-order" element={<PlaceOrder />} />
          <Route path="/payment-result" element={<PaymentResult />} />
          <Route path="/orders" element={<Orders />} />
        </Routes>

        <Footer />
        <FloatingWhatsAppButton />
      </div>
    </>
  );
};

export default App;
