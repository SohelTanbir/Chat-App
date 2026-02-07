import { useState } from "react";
import { Link } from "react-router-dom";
import { useAlert } from "react-alert";
import Loader from "../components/Loader/Loader";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const alert = useAlert();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      alert.info("Email is required!");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/v1/users/password/forgot`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email }),
        },
      );
      const { success, message, resetToken } = await res.json();
      setLoading(false);
      if (!success) {
        alert.error(message || "Request failed");
        return;
      }
      alert.success(message || "Reset link generated");
      setEmail("");
    } catch (err) {
      setLoading(false);
      alert.error("Sorry! We can't process the request right now");
    }
  };

  return (
    <div id="auth-page">
      <div className="flex">
        <div className="max-w-[400px] w-full bg-primary px-5 py-8 text-center flex justify-center items-center max-[780px]:hidden ">
          <div className="w-full">
            <h2 className=" font-Montserrat font-semibold  text-2xl text-white mb-3">
              Welcome Back!
            </h2>
            <p className=" font-Montserrat font-normal  text-lg text-white mb-4">
              Enter your email and we will send you a reset link
            </p>
            <Link to="/account/login">
              <button className=" font-medium text-white text-center border border-gray-300 rounded-full  uppercase py-2 px-8  hover:bg-primary hover:border-current  ">
                Sign In
              </button>
            </Link>
          </div>
        </div>
        <div className="max-w-[450px] w-full mx-auto px-5 py-8 text-center h-screen flex items-center justify-center">
          <div className="w-full">
            <h2 className=" font-Montserrat font-semibold  text-md text-primary mb-2 min-[780px]:hidden">
              Reset Password
            </h2>
            <h2 className=" font-Montserrat font-bold text-3xl mb-5">
              Forgot Password
            </h2>
            <form onSubmit={handleSubmit}>
              <input
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mb-[20px] bg-[#EEEEEE] py-2 px-4 rounded-md font-normal text-lg text-black outline-none "
                type="email"
                placeholder="Email"
                value={email}
              />
              <button className=" font-medium text-white   text-center  border-gray-300 rounded-full  uppercase py-2 px-8 bg-primary mt-2">
                Send Reset Link
              </button>
            </form>
            <p className=" font-normal text-primary text-center text-[12px] md:text-sm py-3 min-[780px]:hidden">
              Remember your password?{" "}
              <Link to="/account/login">
                <span className="underline">Sign In</span>
              </Link>
            </p>
          </div>
        </div>
      </div>
      <Loader backdrop={loading} size={70} />
    </div>
  );
};

export default ForgotPassword;
