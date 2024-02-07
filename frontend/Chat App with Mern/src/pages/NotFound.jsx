import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="flex items-center justify-center w-full h-screen">
      <div className="text-center">
        <h1 className="font-bold text-6xl text-primary block">404</h1>
        <p className="text-black font-medium mb-5"> Page not found!</p>
        <Link
          to="/"
          className=" font-medium text-white text-center border border-gray-300 rounded-full  uppercase py-2 px-8  bg-primary hover:border-current  "
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
