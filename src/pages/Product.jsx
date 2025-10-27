import { useContext, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { backendUrl } from "../App";
import RelatedProducts from "../components/RelatedProducts";
import { ShopContext } from "../context/ShopContext";
import { trackEvent } from "../lib/tracking";

const Product = () => {
  const { productId } = useParams();
  const { products, addToCart, navigate } = useContext(ShopContext);

  const [productData, setProductData] = useState(null);
  const [activeImage, setActiveImage] = useState("");
  const [size, setSize] = useState("");

  const imageUrls = useMemo(() => {
    if (!productData || !Array.isArray(productData.image)) return [];
    return productData.image
      .map((img) => (typeof img === "string" ? img : img?.url))
      .filter(Boolean);
  }, [productData]);

  const formatBDT = (val) =>
    (Number(val) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const finalPrice = useMemo(() => {
    if (!productData) return 0;
    const p = Number(productData.price) || 0;
    const d = Number(productData.discount) || 0;
    if (!d) return p;
    return Math.max(0, p - (p * d) / 100);
  }, [productData]);

  const fetchProductData = () => {
    const found = (products || []).find((p) => p._id === productId);
    if (found) {
      setProductData(found);
      const first =
        Array.isArray(found.image) && found.image.length
          ? typeof found.image[0] === "string"
            ? found.image[0]
            : found.image[0]?.url
          : "";
      setActiveImage(first || "");
    } else {
      setProductData(null);
      setActiveImage("");
    }
  };

  useEffect(() => {
    fetchProductData();
  }, [productId, products]);

  if (!productData) {
    return <div className="opacity-0" />;
  }

  const requiresSize =
    Array.isArray(productData.sizes) && productData.sizes.length > 0;

  const ensureSizeOrToast = () => {
    if (requiresSize && !size) {
      toast.error("Please select a size first.");
      return false;
    }
    return true;
  };

  const handleWhatsAppOrder = () => {
    if (!ensureSizeOrToast()) return;
    const phone = "8801876694376";
    const pageUrl = typeof window !== "undefined" ? window.location.href : "";
    const msg = `হ্যালো! আমি এই প্রোডাক্টটি অর্ডার করতে চাইঃ
- প্রোডাক্ট: ${productData.name}
- সাইজ: ${size || "N/A"}
- দাম: ৳${formatBDT(finalPrice)}
লিংক: ${pageUrl}

অনুগ্রহ করে কনফার্ম করুন।`;
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  const handleAddToCart = () => {
    if (!ensureSizeOrToast()) return;
    addToCart(productData._id, size);
    trackEvent(backendUrl, {
      name: "AddToCart",
      content_ids: [productData._id],
      content_name: productData.name,
      value: finalPrice,
      currency: "BDT",
    });
  };

  trackEvent(backendUrl, {
    name: "ViewContent",
    content_ids: [productData._id],
    content_name: productData.name,
  });

  return (
    <div className="pt-10 transition-opacity duration-500 ease-in border-t-2 opacity-100">
      {/* Product Data */}
      <div className="flex flex-col gap-12 sm:gap-12 sm:flex-row">
        {/* Product Images */}
        <div className="flex flex-col-reverse flex-1 gap-3 sm:flex-row">
          <div className="flex justify-between overflow-x-auto sm:flex-col sm:overflow-y-scroll sm:justify-normal sm:w-[18.7%] w-full">
            {imageUrls.map((url, index) => (
              <img
                src={url}
                key={index}
                onClick={() => setActiveImage(url)}
                className={`w-[24%] sm:w-full sm:mb-3 flex-shrink-0 cursor-pointer ${
                  activeImage === url
                    ? "border-2 border-gray-600 py-2 px-2"
                    : ""
                }`}
                alt={`Photo ${index + 1}`}
              />
            ))}
          </div>
          <div className="w-full sm:w-[80%]">
            {activeImage ? (
              <img src={activeImage} className="w-full h-auto" alt="Selected" />
            ) : (
              <div className="w-full aspect-square bg-gray-100" />
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="flex-1">
          <h1 className="mt-2 text-2xl font-medium">{productData.name}</h1>

          {/* Price (with discount display if applicable) */}
          <div className="mt-5 text-3xl font-medium">
            {Number(productData.discount) > 0 ? (
              <div className="flex items-baseline gap-3">
                <span className="line-through text-gray-400 text-2xl">
                  &#2547; {formatBDT(productData.price)}
                </span>
                <span>&#2547; {formatBDT(finalPrice)}</span>
                <span className="ml-2 text-sm text-green-600 font-semibold">
                  {Number(productData.discount)}% OFF
                </span>
              </div>
            ) : (
              <span>&#2547; {formatBDT(productData.price)}</span>
            )}
          </div>

          <p className="mt-5 text-gray-500 md:w-4/5">
            {productData.description}
          </p>

          {/* Sizes */}
          {Array.isArray(productData.sizes) && productData.sizes.length > 0 && (
            <div className="flex flex-col gap-4 my-8">
              <p>Select Size</p>
              <div className="flex flex-wrap gap-2">
                {productData.sizes.map((sz, index) => (
                  <button
                    key={index}
                    onClick={() => setSize(sz)}
                    type="button"
                    className={`border py-2 px-4 bg-gray-100 rounded-md ${
                      sz === size ? "border-orange-500" : ""
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 sm:w-4/5">
            {/* Confirm Order (green) */}
            <button
              onClick={handleWhatsAppOrder}
              className="w-full py-3 text-white font-semibold rounded bg-green-600 hover:bg-green-700 active:scale-[.99] transition"
            >
              অর্ডার কনফার্ম করুন
            </button>

            {/* WhatsApp Order (green) */}
            <button
              onClick={handleWhatsAppOrder}
              className="w-full py-3 text-white font-semibold rounded bg-green-700 hover:bg-green-800 active:scale-[.99] transition"
            >
              WHATSAPP এ অর্ডার করুন
            </button>

            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              className="w-full px-8 py-3 text-sm text-white bg-black active:bg-gray-700 rounded transition"
            >
              ADD TO CART
            </button>
          </div>

          <hr className="mt-8 sm:w-4/5" />
          <div className="flex flex-col gap-1 mt-5 text-sm text-gray-500">
            <p>Guaranteed 100% Authentic – Shop with Confidence!</p>
            <p>Enjoy Cash on Delivery – Pay at Your Doorstep!</p>
            <p>
              Hassle-Free Returns & Exchanges – 10 Days, No Questions Asked!
            </p>
          </div>
        </div>
      </div>

      {/* Description and Review Section */}
      <div className="mt-20">
        <div className="flex">
          <b className="px-5 py-3 text-sm border">Description</b>
        </div>

        {/* Long Description (rich HTML) */}
        <div className="flex flex-col gap-4 px-6 py-6 text-sm text-gray-700 border">
          {productData.longDescription ? (
            <div
              className="prose max-w-none prose-sm sm:prose"
              dangerouslySetInnerHTML={{ __html: productData.longDescription }}
            />
          ) : (
            <>
              <p>
                Elevate your style with our meticulously crafted Trendify
                quality products. Designed with a perfect balance of elegance
                and practicality, these Trendify quality products are made from
                premium materials that ensure both durability and comfort.
              </p>
              <p>
                Whether you&apos;re dressing up for a special occasion or adding
                a touch of sophistication to your everyday look, the Trendify
                quality products offer unparalleled versatility. Its timeless
                design, coupled with a flawless fit, makes it a must-have
                addition to any wardrobe. Don’t miss out—experience the
                difference today.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Related Products */}
      <RelatedProducts
        category={productData.category}
        subCategory={productData.subCategory}
      />
    </div>
  );
};

export default Product;
