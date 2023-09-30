import { Link } from "react-router-dom";

const NotFound = () => {
    return (
        <div className='flex items-center justify-center w-full h-screen'>
            <div className='text-center'>
                <h1 className='font-bold text-6xl text-primary block'>404</h1>
                <p className='text-black font-medium'> Page not found!</p>
               <Link to="/">
               <button className=' font-medium text-white   text-center  border-gray-300 rounded-full  py-1 px-5 bg-primary mt-3'>Back to Home</button>
               </Link>
            </div>
        </div>
    );
};

export default NotFound;