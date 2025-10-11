import axios from "axios";
import { useContext, useState } from "react";
import { toast } from "react-toastify";
import { assets } from "../assets/assets";
import CartTotal from "../components/CartTotal";
import Title from "../components/Title";
import { ShopContext } from "../context/ShopContext";

const PlaceOrder = () => {
  const [method, setMethod] = useState("cod");
  const {
    navigate,
    backendUrl,
    token,
    cartItems,
    setCartItems,
    getCartAmount,
    delivery_fee,
    products,
  } = useContext(ShopContext);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipcode: "",
    country: "",
    phone: "",
  });

  const onChangeHandler = (e) => {
    const { name, value } = e.target;
    setFormData((d) => ({ ...d, [name]: value }));
  };

  const buildOrderItems = () => {
    const orderItems = [];
    for (const productId in cartItems) {
      for (const size in cartItems[productId]) {
        if (cartItems[productId][size] > 0) {
          const itemInfo = structuredClone(
            products.find((p) => p._id === productId)
          );
          if (itemInfo) {
            itemInfo.size = size;
            itemInfo.quantity = cartItems[productId][size];
            orderItems.push(itemInfo);
          }
        }
      }
    }
    return orderItems;
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    try {
      const items = buildOrderItems();
      const amount = getCartAmount() + delivery_fee;
      const orderData = {
        address: formData,
        items,
        amount,
      };

      if (method === "cod") {
        const { data } = await axios.post(
          `${backendUrl}/api/order/place`,
          orderData,
          { headers: { token } }
        );
        if (data.success) {
          setCartItems({});
          navigate("/orders");
        } else {
          toast.error(data.message || "Failed to place order");
        }
      }

      if (method === "sslcommerz") {
        const { data } = await axios.post(
          `${backendUrl}/api/order/ssl/initiate`,
          orderData,
          { headers: { token } }
        );
        if (data.success && data.url) {
          window.location.replace(data.url);
        } else {
          toast.error(data.message || "Failed to initialize payment");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Something went wrong");
    }
  };

  return (
    <form
      onSubmit={onSubmitHandler}
      className="flex flex-col justify-between gap-4 pt-5 sm:flex-row sm:pt-14 min-h-[80vh] border-t"
    >
      {/* Left Side */}
      <div className="flex flex-col w-full gap-4 sm:max-w-[480px]">
        <div className="my-3 text-xl sm:text-2xl">
          <Title text1={"DELIVERY"} text2={"INFORMATION"} />
        </div>
        <div className="flex gap-3">
          <input
            required
            name="firstName"
            value={formData.firstName}
            onChange={onChangeHandler}
            className="w-full px-4 py-2 border border-gray-300 rounded"
            type="text"
            placeholder="First Name"
          />
          <input
            required
            name="lastName"
            value={formData.lastName}
            onChange={onChangeHandler}
            className="w-full px-4 py-2 border border-gray-300 rounded"
            type="text"
            placeholder="Last Name"
          />
        </div>
        <input
          required
          name="email"
          value={formData.email}
          onChange={onChangeHandler}
          className="w-full px-4 py-2 border border-gray-300 rounded"
          type="email"
          placeholder="Email Address"
        />
        <input
          required
          name="street"
          value={formData.street}
          onChange={onChangeHandler}
          className="w-full px-4 py-2 border border-gray-300 rounded"
          type="text"
          placeholder="Street"
        />
        <div className="flex gap-3">
          <input
            required
            name="city"
            value={formData.city}
            onChange={onChangeHandler}
            className="w-full px-4 py-2 border border-gray-300 rounded"
            type="text"
            placeholder="City"
          />
          <input
            required
            name="state"
            value={formData.state}
            onChange={onChangeHandler}
            className="w-full px-4 py-2 border border-gray-300 rounded"
            type="text"
            placeholder="State"
          />
        </div>
        <div className="flex gap-3">
          <input
            required
            name="zipcode"
            value={formData.zipcode}
            onChange={onChangeHandler}
            className="w-full px-4 py-2 border border-gray-300 rounded"
            type="text"
            placeholder="Zip Code"
          />
          <input
            required
            name="country"
            value={formData.country}
            onChange={onChangeHandler}
            className="w-full px-4 py-2 border border-gray-300 rounded"
            type="text"
            placeholder="Country"
          />
        </div>
        <input
          required
          name="phone"
          value={formData.phone}
          onChange={onChangeHandler}
          className="w-full px-4 py-2 border border-gray-300 rounded"
          type="text"
          placeholder="Mobile"
        />
      </div>

      {/* Right Side */}
      <div className="mt-8">
        <div className="mt-8 min-w-80">
          <CartTotal />
        </div>

        <div className="mt-12">
          <Title text1={"PAYMENT"} text2={"METHODS"} />
          <div className="flex flex-col gap-3 lg:flex-row">
            <div
              onClick={() => setMethod("sslcommerz")}
              className="flex items-center gap-3 p-2 px-3 border cursor-pointer"
            >
              <p
                className={`min-w-3.5 h-3.5 border rounded-full ${
                  method === "sslcommerz" ? "bg-green-600" : ""
                }`}
              ></p>
              <img
                className="h-5 mx-4"
                src={assets.sslcommerz_logo}
                alt="SSLCommerz"
              />
            </div>

            <div
              onClick={() => setMethod("cod")}
              className="flex items-center gap-3 p-2 px-3 border cursor-pointer"
            >
              <p
                className={`min-w-3.5 h-3.5 border rounded-full ${
                  method === "cod" ? "bg-green-600" : ""
                }`}
              ></p>
              <p className="mx-4 text-sm font-medium text-gray-500">
                CASH ON DELIVERY
              </p>
            </div>
          </div>

          <div className="w-full mt-8 text-end">
            <button
              type="submit"
              className="px-16 py-3 text-sm text-white bg-black active:bg-gray-800"
            >
              PLACE ORDER
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;
