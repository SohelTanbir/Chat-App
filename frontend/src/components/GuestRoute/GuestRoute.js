import { useContext } from "react";

import { userContext } from "../../App";
import { Navigate } from "react-router-dom";

const GuestRoute = ({ children }) => {
  const [loggedInUser, , authLoading] = useContext(userContext);
  if (authLoading) return null;
  return loggedInUser?.email ? <Navigate to="/users/chats" /> : children;
};

export default GuestRoute;
