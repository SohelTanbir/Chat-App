import "./App.css";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import "./tailwind/style.css";
import NotFound from "./pages/NotFound";
import ChatList from "./pages/ChatList/ChatList";
import { createContext, useEffect, useState } from "react";
import { transitions, positions, Provider as AlertProvider } from "react-alert";
import AlertTemplate from "react-alert-template-basic";
import PrivateRoute from "./components/PrivateRoute/PrivateRoute";
import Home from "./pages/Home/Home";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
export const userContext = createContext();
export const messageContext = createContext();

function App() {
  const [loggedInUser, setLoggedInUser] = useState([]);
  const [messages, setMessages] = useState([]);

  // add to number make a function

  useEffect(() => {
    // get logged in user
    const getLoggedInUser = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BASE_URL}/api/v1/users/user`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
        const { user } = await res.json();
        if (!user) {
          return;
        }
        setLoggedInUser(user[0]);
      } catch (err) {
        return err;
      }
    };

    getLoggedInUser();
  }, []);

  const options = {
    // you can also just use 'bottom center'
    position: positions.TOP_RIGHT,
    timeout: 3000,
    // you can also just use 'scale'
    transition: transitions.SCALE,
  };

  return (
    <>
      <userContext.Provider value={[loggedInUser, setLoggedInUser]}>
        <messageContext.Provider value={[messages, setMessages]}>
          <AlertProvider template={AlertTemplate} {...options}>
            <Routes>
              <Route exact path="/" element={<Home />} />
              <Route exact path="/account/register" element={<SignUp />} />
              <Route exact path="/account/login" element={<Login />} />
              <Route
                exact
                path="/password/forgot"
                element={<ForgotPassword />}
              />
              <Route
                exact
                path="/password/reset/:token"
                element={<ResetPassword />}
              />
              <Route
                exact
                path="/users/chats"
                element={
                  <PrivateRoute>
                    {" "}
                    <ChatList />{" "}
                  </PrivateRoute>
                }
              />
              <Route exact path="*" element={<NotFound />} />
            </Routes>
          </AlertProvider>
        </messageContext.Provider>
      </userContext.Provider>
    </>
  );
}

export default App;
