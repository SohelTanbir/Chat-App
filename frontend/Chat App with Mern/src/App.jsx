import './App.css';
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import './tailwind/style.css';
import NotFound from './pages/NotFound';
import ChatList from './pages/ChatList/ChatList';
import { createContext, useState } from 'react';
import { transitions, positions, Provider as AlertProvider } from 'react-alert';
import AlertTemplate from 'react-alert-template-basic';
import PrivateRoute from './components/PrivateRoute/PrivateRoute';

export const appContext = createContext();


function App() {
  const [messages, setMessages] = useState([]);
  const [loggedInUser, setLoggedInUser ] = useState('');

  const options = {
    // you can also just use 'bottom center'
    position: positions.TOP_RIGHT,
    timeout: 3000,
    // you can also just use 'scale'
    transition: transitions.SCALE
  }
console.log("user", loggedInUser);
  return (
    <>
    <appContext.Provider value={[messages, setMessages, loggedInUser, setLoggedInUser]}>
    <AlertProvider template={AlertTemplate} {...options}>
      <Routes>
          <Route path='/' element={<SignUp/>} />
          <Route path='/login' element={<Login/>} />
          <Route path='/users/chats' element={<PrivateRoute><ChatList/></PrivateRoute>} />
          <Route path='*' element={<NotFound/>} />
      </Routes>
      </AlertProvider>
      </appContext.Provider>
      </>
  )
}

export default App
