import { useContext, useMemo } from "react";
import { Link } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";

const ProductItem = ({
  id,
  image = [],
  name,
  price,
  discount = 0,
  sizes = [], // pass sizes when you render ProductItem (recommended)
}) => {
  const { addToCart, navigate } = useContext(ShopContext);

  const firstImage =
    Array.isArray(image) && image.length
      ? typeof image[0] === "string"
        ? image[0]
        : image[0]?.url
      : "";

  const finalPrice = useMemo(() => {
    const p = Number(price) || 0;
    const d = Number(discount) || 0;
    if (!d) return p;
    return Math.max(0, p - (p * d) / 100);
  }, [price, discount]);

  const formatBDT = (val) =>
    (Number(val) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const defaultSize = Array.isArray(sizes) && sizes.length ? sizes[0] : null;

  const addToCartQuick = async () => {
    if (!defaultSize) {
      // No size available/known; send user to product page to pick a size
      navigate(`/product/${id}`);
      return;
    }
    await addToCart(id, defaultSize);
  };

  const buyNow = async () => {
    if (!defaultSize) {
      // Need a size first
      navigate(`/product/${id}`);
      return;
    }
    await addToCart(id, defaultSize);
    navigate("/cart");
  };

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-lg border bg-white transition-shadow hover:shadow-md">
      {/* Media */}
      <Link to={`/product/${id}`} className="block">
        <div className="relative overflow-hidden">
          {firstImage ? (
            <img
              src={firstImage}
              alt={name || "Product"}
              className="w-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
            />
          ) : (
            <div className="w-full aspect-square bg-gray-100" />
          )}

          {Number(discount) > 0 && (
            <span className="absolute top-2 left-2 rounded-md bg-red-500 px-2 py-1 text-xs font-semibold text-white shadow-md">
              -{Number(discount)}%
            </span>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="flex grow flex-col p-3">
        <Link to={`/product/${id}`}>
          <p className="line-clamp-2 pb-1 pt-1 text-sm text-gray-800">{name}</p>
        </Link>

        {Number(discount) > 0 ? (
          <div className="text-sm">
            <span className="mr-2 line-through text-gray-400">
              &#2547; {formatBDT(price)}
            </span>
            <span className="font-medium text-green-700">
              &#2547; {formatBDT(finalPrice)}
            </span>
          </div>
        ) : (
          <p className="text-sm font-medium text-gray-900">
            &#2547; {formatBDT(price)}
          </p>
        )}

        {/* Push buttons to card bottom for equal height cards */}
        <div className="mt-auto pt-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={addToCartQuick}
              className="inline-flex flex-1 items-center justify-center rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
              title={
                defaultSize ? `Add to cart (${defaultSize})` : "Choose size"
              }
            >
              Add to Cart
            </button>
            <button
              type="button"
              onClick={buyNow}
              className="inline-flex flex-1 items-center justify-center rounded-md bg-black px-3 py-2 text-sm font-medium text-white hover:bg-gray-900"
              title={defaultSize ? `Buy now (${defaultSize})` : "Choose size"}
            >
              Buy Now
            </button>
          </div>

          {/* Optional: show chosen quick size for transparency */}
          {defaultSize ? (
            <p className="mt-1 text-[11px] text-gray-500">
              Quick add size: <span className="font-medium">{defaultSize}</span>
            </p>
          ) : (
            <p className="mt-1 text-[11px] text-amber-600">
              Size required — opening product page
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductItem;
