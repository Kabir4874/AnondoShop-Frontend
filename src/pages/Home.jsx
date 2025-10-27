import BestSeller from "../components/BestSeller";
import CategoriesBar from "../components/CategoriesBar";
import Hero from "../components/Hero";
import LatestCollection from "../components/LatestCollection";
import NewsLetterBox from "../components/NewsLetterBox";
import OurPolicy from "../components/OurPolicy";

const Home = () => {
  return (
    <div>
      <Hero />
      <CategoriesBar/>
      <LatestCollection />
      <BestSeller />
      <OurPolicy />
      <NewsLetterBox />
    </div>
  );
};

export default Home;
