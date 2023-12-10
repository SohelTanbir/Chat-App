import { useContext } from "react";

import { userContext } from "../../App";
import { useNavigate } from "react-router-dom";

const GuestRoute = ({ children }) => {
  const navigate = useNavigate();
  const [loggedInUser] = useContext(userContext);
  console.log("protected ", loggedInUser);
  return loggedInUser.email ? children : navigate("/sohel/login");
};

export default GuestRoute;
