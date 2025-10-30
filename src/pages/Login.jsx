import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ShopContext } from "../context/ShopContext";

const BD_PHONE_REGEX = /^(?:\+?88)?01[3-9]\d{8}$/;

const Login = () => {
  const [currentState, setCurrentState] = useState("Login");
  const { token, setToken, navigate, backendUrl } = useContext(ShopContext);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const normalizeBDPhone = (v) => {
    if (!v) return v;
    const raw = String(v).replace(/[^\d+]/g, "");
    if (/^\+8801[3-9]\d{8}$/.test(raw)) return raw;
    const digits = raw.replace(/^\+?/, "");
    if (/^01[3-9]\d{8}$/.test(digits)) return `+88${digits}`;
    if (/^8801[3-9]\d{8}$/.test(digits)) return `+${digits}`;
    return raw;
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    try {
      const normalized = normalizeBDPhone(phone);
      if (!BD_PHONE_REGEX.test(normalized)) {
        toast.error("Invalid Bangladesh phone number");
        return;
      }
      if (!password || String(password).length < 8) {
        toast.error("Password must be at least 8 characters");
        return;
      }

      if (currentState === "Sign Up") {
        const { data } = await axios.post(
          `${backendUrl}/api/user/register`,
          { name, phone: normalized, password },
          { headers: { "Content-Type": "application/json" } }
        );
        if (data?.success && data?.token) {
          setToken(data.token);
          toast.success("Account created");
        } else {
          toast.error(data?.message || "Registration failed");
        }
      } else {
        const { data } = await axios.post(
          `${backendUrl}/api/user/login`,
          { phone: normalized, password },
          { headers: { "Content-Type": "application/json" } }
        );
        if (data?.success && data?.token) {
          setToken(data.token);
          toast.success("Logged in");
        } else if (data?.code === "PASSWORD_NOT_SET") {
          toast.error(
            "Password not set for this number. Please set a password after checkout."
          );
        } else {
          toast.error(data?.message || "Login failed");
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.message || error.message || "Request failed"
      );
    }
  };

  useEffect(() => {
    if (token) navigate("/");
  }, [token, navigate]);

  return (
    <form
      onSubmit={onSubmitHandler}
      className="flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-14 gap-4 text-gray-800"
    >
      <div className="inline-flex items-center gap-2 mt-10 mb-2">
        <p className="text-3xl prata-regular">{currentState}</p>
        <hr className="border-none h-[1.5px] w-8 bg-gray-800" />
      </div>

      {currentState === "Login" ? null : (
        <input
          onChange={(e) => setName(e.target.value)}
          value={name}
          type="text"
          className="w-full px-3 py-2 border border-gray-800"
          placeholder="Your name"
          required
        />
      )}

      <input
        onChange={(e) => setPhone(e.target.value)}
        value={phone}
        type="tel"
        className="w-full px-3 py-2 border border-gray-800"
        placeholder="Phone (e.g. 01XXXXXXXXX or +8801XXXXXXXXX)"
        required
      />

      <input
        onChange={(e) => setPassword(e.target.value)}
        value={password}
        type="password"
        className="w-full px-3 py-2 border border-gray-800"
        placeholder="Password (min 8 chars)"
        required
      />

      <div className="flex justify-between w-full text-sm mt-[-8px]">
        <p
          className="cursor-pointer"
          onClick={() =>
            toast.info(
              "You can set your password after placing your first order too."
            )
          }
        >
          Forgot your password?
        </p>

        {currentState === "Login" ? (
          <p
            onClick={() => setCurrentState("Sign Up")}
            className="cursor-pointer"
          >
            Create a new account
          </p>
        ) : (
          <p
            onClick={() => setCurrentState("Login")}
            className="cursor-pointer"
          >
            Login here
          </p>
        )}
      </div>

      <button className="px-8 py-2 mt-4 font-light text-white bg-black">
        {currentState === "Login" ? "Sign In" : "Sign Up"}
      </button>
    </form>
  );
};

export default Login;
