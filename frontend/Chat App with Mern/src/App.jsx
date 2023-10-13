import './App.css';
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import './tailwind/style.css';
import NotFound from './pages/NotFound';
import ChatList from './pages/ChatList/ChatList';
import { createContext, useState } from 'react';

export const messageContext = createContext();


function App() {
  const [messages, setMessages] = useState([]);


  return (
    <>
    <messageContext.Provider value={[messages, setMessages]}>
      <Routes>
          <Route path='/' element={<SignUp/>} />
          <Route path='/login' element={<Login/>} />
          <Route path='/users/chats' element={<ChatList/>} />
          <Route path='*' element={<NotFound/>} />
      </Routes>
      </messageContext.Provider>
      </>
  )
}

export default App
