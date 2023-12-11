import BarLoader from "react-spinners/ClipLoader";

const Loader = ({ backdrop, size }) => {
  return (
    <div
      className={`${
        backdrop &&
        "bg-[#000] bg-opacity-80 w-full h-screen absolute top-0 left-0 right-0 overflow-hidden flex items-center justify-center z-40"
      }`}
    >
      <BarLoader color="#36d7b7" loading={backdrop} size={size ? size : 50} />
    </div>
  );
};

export default Loader;
