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

export const userContext = createContext();
export const messageContext = createContext();

function App() {
  const [loggedInUser, setLoggedInUser] = useState([]);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // get logged in user
    const getLoggedInUser = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/v1/users/user", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const { user } = await res.json();
        if (!user) {
          console.log("Couldn't find user");
          return;
        }
        setLoggedInUser(user[0]);
      } catch (err) {
        console.log(err.message);
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
