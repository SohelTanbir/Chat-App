import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAlert } from "react-alert";
import Loader from "../components/Loader/Loader";

const ResetPassword = () => {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const alert = useAlert();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      alert.info("All fields are required!");
      return;
    }
    if (password !== confirmPassword) {
      alert.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/v1/users/password/reset/${token}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ password }),
        },
      );
      const { success, message } = await res.json();
      setLoading(false);
      if (!success) {
        alert.error(message || "Reset failed");
        return;
      }
      alert.success(message || "Password reset successful");
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        navigate("/account/login");
      }, 500);
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
              Create a new password to secure your account
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
              New Password
            </h2>
            <form onSubmit={handleSubmit}>
              <input
                onChange={(e) => setPassword(e.target.value)}
                className="w-full mb-[20px] bg-[#EEEEEE] py-2 px-4 rounded-md font-normal text-lg text-black outline-none "
                type="password"
                placeholder="New Password"
                value={password}
              />
              <input
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full mb-[20px] bg-[#EEEEEE] py-2 px-4 rounded-md font-normal text-lg text-black outline-none "
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
              />
              <button className=" font-medium text-white   text-center  border-gray-300 rounded-full  uppercase py-2 px-8 bg-primary mt-2">
                Reset Password
              </button>
            </form>
            <p className=" font-normal text-primary text-center text-[12px] md:text-sm py-3 min-[780px]:hidden">
              Back to{" "}
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

export default ResetPassword;
