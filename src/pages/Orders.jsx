import axios from "axios";
import { useContext, useEffect, useState } from "react";
import Title from "../components/Title";
import { ShopContext } from "../context/ShopContext";

const Orders = () => {
  const { backendUrl, token, currency } = useContext(ShopContext);
  const [orderData, setOrderData] = useState([]);

  const formatBDT = (num) =>
    (Number(num) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const getItemImage = (item) => {
    const arr = item?.image;
    if (Array.isArray(arr) && arr.length > 0) {
      const first = arr[0];
      if (typeof first === "string") return first;
      if (first && typeof first === "object" && first.url) return first.url;
    }
    return "";
  };

  const deriveUnitPrice = (item) => {
    // Prefer unitFinal from server-enriched items; fallback to legacy price
    const unit = item?.unitFinal ?? item?.price ?? 0;
    return Number(unit) || 0;
  };

  const loadOrderData = async () => {
    try {
      if (!token) return;

      const response = await axios.post(
        `${backendUrl}/api/order/userorders`,
        {},
        { headers: { token } }
      );

      const orders = response?.data?.orders || [];

      // Flatten to item rows while carrying order meta safely
      const allItems = [];
      for (const order of orders) {
        const items = Array.isArray(order?.items) ? order.items : [];
        for (const item of items) {
          allItems.push({
            ...item,
            status: order?.status,
            payment: order?.payment,
            paymentMethod: order?.paymentMethod,
            date: order?.date,
          });
        }
      }

      setOrderData(allItems);
    } catch (error) {
      console.error(error);
      // Optionally toast here
    }
  };

  useEffect(() => {
    loadOrderData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="pt-16 border-t">
      <div className="text-2xl">
        <Title text1={"YOUR"} text2={"ORDERS"} />
      </div>

      <div>
        {orderData.map((item, index) => {
          const unitPrice = deriveUnitPrice(item);
          const qty = Number(item?.quantity) || 0;
          const lineTotal =
            // If backend sent a lineSubtotal, prefer it; else compute
            Number(item?.lineSubtotal ?? unitPrice * qty) || 0;

          const dateLabel = item?.date
            ? new Date(item.date).toDateString()
            : "-";

          const imgUrl = getItemImage(item);

          return (
            <div
              key={`${item?._id || index}-${index}`}
              className="flex flex-col gap-4 py-4 text-gray-700 border-t border-b md:flex-row md:items-center md:justify-between"
            >
              {/* Left: Item snapshot */}
              <div className="flex items-start gap-6 text-sm">
                {imgUrl ? (
                  <img
                    className="w-16 sm:w-20 object-cover"
                    src={imgUrl}
                    alt={item?.name || "Photo"}
                  />
                ) : (
                  <div className="w-16 sm:w-20 bg-gray-100" />
                )}

                <div>
                  <p className="font-medium sm:text-base">
                    {item?.name || "—"}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 mt-1 text-base text-gray-700">
                    {/* Unit price */}
                    <p className="text-lg">৳ {formatBDT(unitPrice)}</p>

                    {/* Quantity */}
                    <p>
                      Quantity: <span className="font-medium">{qty}</span>
                    </p>

                    {/* Size */}
                    {item?.size ? (
                      <p>
                        Size: <span className="font-medium">{item.size}</span>
                      </p>
                    ) : null}

                    {/* Line total (optional display, helpful for users) */}
                    <p className="text-gray-600 text-sm">
                      Line Total: ৳ {formatBDT(lineTotal)}
                    </p>
                  </div>

                  {/* Date & Payment */}
                  <p className="mt-1">
                    Date:&nbsp;
                    <span className="text-gray-400">{dateLabel}</span>
                  </p>
                  <p className="mt-1">
                    Payment:&nbsp;
                    <span className="text-gray-400">
                      {item?.paymentMethod || "—"}
                    </span>
                  </p>
                </div>
              </div>

              {/* Right: Status + action */}
              <div className="flex justify-between md:w-1/2">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 min-w-2 rounded-full ${
                      String(item?.status).toLowerCase() === "delivered"
                        ? "bg-green-500"
                        : "bg-amber-500"
                    }`}
                  />
                  <p className="text-sm md:text-base">{item?.status || "—"}</p>
                </div>

                <button
                  onClick={loadOrderData}
                  className="px-4 py-2 text-sm font-medium border rounded-sm"
                  title="Refresh"
                >
                  TRACK ORDER
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Orders;
