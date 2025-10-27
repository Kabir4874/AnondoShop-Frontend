// src/pages/Profile.jsx
import { useContext } from "react";
import { toast } from "react-toastify";
import { ShopContext } from "../context/ShopContext";

const BD_PHONE_REGEX = "^(?:\\+?88)?01[3-9]\\d{8}$";
const BD_POSTAL_REGEX = "^\\d{4}$";

const Profile = () => {
  const {
    // state from provider
    token,
    user,
    setUser,
    address,
    setAddress,

    // api actions from provider
    updateUserProfile,
    saveUserAddress,

    // loading flags
    isProfileLoading,
    isSavingProfile,
    isSavingAddress,
  } = useContext(ShopContext);

  // --- Handlers (Profile) ---
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!token) return toast.error("You must be logged in.");
    const { name, email } = user || {};
    if (!name || !email) return toast.error("Name and email are required.");
    await updateUserProfile({ name, email });
  };

  // --- Handlers (Address) ---
  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!token) return toast.error("You must be logged in.");
    const { recipientName, phone, addressLine1, district, postalCode } =
      address || {};
    if (!recipientName || !phone || !addressLine1 || !district || !postalCode) {
      return toast.error("All address fields are required.");
    }
    await saveUserAddress({
      recipientName,
      phone,
      addressLine1,
      district,
      postalCode,
    });
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
        My Profile
      </h1>

      {isProfileLoading ? (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
          <div className="h-64 bg-gray-100 rounded" />
          <div className="h-64 bg-gray-100 rounded" />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Account Info */}
          <section className="border rounded-xl p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-medium">
              Account Information
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Update your basic account details.
            </p>

            <form onSubmit={handleSaveProfile} className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  value={user?.name || ""}
                  onChange={handleProfileChange}
                  type="text"
                  placeholder="Your name"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  value={user?.email || ""}
                  onChange={handleProfileChange}
                  type="email"
                  placeholder="you@example.com"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="inline-flex items-center justify-center rounded-md bg-black text-white px-4 py-2 hover:bg-gray-900 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSavingProfile ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </section>

          {/* Delivery Address */}
          <section className="border rounded-xl p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-medium">Delivery Address</h2>
            <p className="text-sm text-gray-500 mt-1">
              This address will be used for your orders within Bangladesh.
            </p>

            <form onSubmit={handleSaveAddress} className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="recipientName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Recipient Name
                </label>
                <input
                  id="recipientName"
                  name="recipientName"
                  value={address?.recipientName || ""}
                  onChange={handleAddressChange}
                  type="text"
                  placeholder="e.g., Mohammad Rahim"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700"
                >
                  Phone (Bangladesh)
                </label>
                <input
                  id="phone"
                  name="phone"
                  value={address?.phone || ""}
                  onChange={handleAddressChange}
                  type="tel"
                  inputMode="tel"
                  placeholder="01XXXXXXXXX or +8801XXXXXXXXX"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  pattern={BD_PHONE_REGEX}
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Must be a valid BD mobile number.
                </p>
              </div>

              <div>
                <label
                  htmlFor="addressLine1"
                  className="block text-sm font-medium text-gray-700"
                >
                  Address Line
                </label>
                <input
                  id="addressLine1"
                  name="addressLine1"
                  value={address?.addressLine1 || ""}
                  onChange={handleAddressChange}
                  type="text"
                  placeholder="House/Road/Village"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="district"
                  className="block text-sm font-medium text-gray-700"
                >
                  District
                </label>
                <input
                  id="district"
                  name="district"
                  value={address?.district || ""}
                  onChange={handleAddressChange}
                  type="text"
                  placeholder="e.g., Dhaka"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="postalCode"
                  className="block text-sm font-medium text-gray-700"
                >
                  Postal Code (4 digits)
                </label>
                <input
                  id="postalCode"
                  name="postalCode"
                  value={address?.postalCode || ""}
                  onChange={handleAddressChange}
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g., 1212"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  pattern={BD_POSTAL_REGEX}
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingAddress}
                  className="inline-flex items-center justify-center rounded-md bg-black text-white px-4 py-2 hover:bg-gray-900 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSavingAddress ? "Saving..." : "Save Address"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};

export default Profile;
