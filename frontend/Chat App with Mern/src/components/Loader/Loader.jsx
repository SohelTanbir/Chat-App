import BarLoader from "react-spinners/ClipLoader";

const Loader = ({loading}) => {
    return (
        <div className={`${loading && 'bg-[#000] bg-opacity-90 w-full h-screen absolute top-0 left-0 right-0 overflow-hidden flex items-center justify-center'}`}>   
            <BarLoader color="#36d7b7" loading={loading} size={70}/>
        </div>
    );
};

export default Loader;