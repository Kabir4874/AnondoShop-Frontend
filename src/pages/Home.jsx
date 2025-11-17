import { Helmet } from "react-helmet-async";
import { SITE_URL } from "../App";
import BestSeller from "../components/BestSeller";
import CategoriesBar from "../components/CategoriesBar";
import Hero from "../components/Hero";
import LatestCollection from "../components/LatestCollection";
import NewsLetterBox from "../components/NewsLetterBox";
import OurPolicy from "../components/OurPolicy";

const Home = () => {
  const canonicalUrl = SITE_URL;

  return (
    <>
      <Helmet>
        <title>AnondoShop | Find What Moves You</title>
        <meta
          name="description"
          content="Shop online at AnondoShop – discover fashion, lifestyle and daily essentials with secure bKash payment, Cash on Delivery and fast shipping across Bangladesh."
        />
        <link rel="canonical" href={canonicalUrl} />

        {/* Open Graph */}
        <meta property="og:site_name" content="AnondoShop" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="AnondoShop | Find What Moves You" />
        <meta
          property="og:description"
          content="Explore the latest collections, best sellers and exclusive offers at AnondoShop – your trusted online shopping destination in Bangladesh."
        />
        <meta
          property="og:image"
          content="https://cdn-icons-png.flaticon.com/512/625/625149.png"
        />
        <meta property="og:url" content={canonicalUrl} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="AnondoShop | Find What Moves You" />
        <meta
          name="twitter:description"
          content="Discover new arrivals, best sellers and exciting deals on AnondoShop with a smooth and secure shopping experience."
        />
        <meta
          name="twitter:image"
          content="https://cdn-icons-png.flaticon.com/512/625/625149.png"
        />
      </Helmet>

      <div>
        <Hero />
        <CategoriesBar />
        <LatestCollection />
        <BestSeller />
        <OurPolicy />
        <NewsLetterBox />
      </div>
    </>
  );
};

export default Home;
