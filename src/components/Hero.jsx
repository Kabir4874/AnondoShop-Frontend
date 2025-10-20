import axios from "axios";
import { useContext, useEffect, useState } from "react";
import "swiper/css";
import "swiper/css/pagination";
import { Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { ShopContext } from "../context/ShopContext";

import { assets } from "../assets/assets";

const Hero = () => {
  const { backendUrl } = useContext(ShopContext);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        activeOnly: "1",
        page: "1",
        limit: "12",
      });
      const { data } = await axios.get(
        `${backendUrl}/api/content/banners?${params}`
      );
      if (data?.success && Array.isArray(data.banners)) {
        setBanners(data.banners);
      } else {
        setBanners([]);
      }
    } catch {
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const hasBanners = banners && banners.length > 0;

  return (
    <div className="relative border border-gray-300 rounded-lg overflow-hidden mt-4">
      {/* Slider / Fallback */}
      <div className="relative">
        {loading ? (
          <div className="aspect-[16/8] sm:aspect-[16/6] bg-gray-100 animate-pulse" />
        ) : hasBanners ? (
          <Swiper
            modules={[Autoplay, Pagination]}
            autoplay={{ delay: 3500, disableOnInteraction: false }}
            loop
            pagination={{ clickable: true }}
            className="w-full"
          >
            {banners.map((b) => (
              <SwiperSlide key={b._id}>
                <img
                  src={b?.image?.url}
                  alt=""
                  className="w-full h-auto object-cover aspect-[16/8] sm:aspect-[16/6]"
                  loading="lazy"
                />
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <img
            className="w-full h-auto object-cover aspect-[16/8] sm:aspect-[16/6]"
            src={assets.hero_img}
            alt=""
          />
        )}
      </div>
    </div>
  );
};

export default Hero;
