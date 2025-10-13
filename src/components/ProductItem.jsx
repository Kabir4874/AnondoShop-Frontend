import { Link } from "react-router-dom";

const ProductItem = ({ id, image = [], name, price, discount = 0 }) => {
  const firstImage =
    Array.isArray(image) && image.length
      ? typeof image[0] === "string"
        ? image[0]
        : image[0]?.url
      : "";

  const finalPrice = (() => {
    const p = Number(price) || 0;
    const d = Number(discount) || 0;
    if (!d) return p;
    return Math.max(0, p - (p * d) / 100);
  })();

  const formatBDT = (val) =>
    (Number(val) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <Link
      to={`/product/${id}`}
      className="relative block text-gray-700 cursor-pointer group"
    >
      {/* Image Container */}
      <div className="relative overflow-hidden rounded-md">
        {firstImage ? (
          <img
            src={firstImage}
            alt={name || "Product"}
            className="transition-transform duration-300 ease-in-out group-hover:scale-110"
          />
        ) : (
          <div className="w-full aspect-square bg-gray-100" />
        )}

        {/* Discount Badge */}
        {Number(discount) > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-md shadow-md">
            -{Number(discount)}%
          </span>
        )}
      </div>

      {/* Product Info */}
      <p className="pt-3 pb-1 text-sm line-clamp-2">{name}</p>

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
        <p className="text-sm font-medium">&#2547; {formatBDT(price)}</p>
      )}
    </Link>
  );
};

export default ProductItem;
