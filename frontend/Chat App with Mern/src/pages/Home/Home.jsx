import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="flex items-center justify-center w-full h-screen">
      <div className="text-center">
        <h1 className="font-bold text-4xl sm:text-5xl text-primary  mb-2">
          Welcome Back!
        </h1>
        <Link to="/users/chats" className=" font-medium text-white   text-center border border-gray-300 rounded-full  py-2 px-5 bg-primary hover:bg-transparent hover:text-primary mt-4 inline-block hover-animate">
            Start Conversation
        </Link>
      </div>
    </div>
  );
};

export default Home;
