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

export const messageContext = createContext();


function App() {
  const [messages, setMessages] = useState([]);
  const options = {
    // you can also just use 'bottom center'
    position: positions.TOP_RIGHT_RIGHT,
    timeout: 3000,
    // you can also just use 'scale'
    transition: transitions.SCALE
  }

  return (
    <>
    <messageContext.Provider value={[messages, setMessages]}>
    <AlertProvider template={AlertTemplate} {...options}>
      <Routes>
          <Route path='/' element={<SignUp/>} />
          <Route path='/login' element={<Login/>} />
          <Route path='/users/chats' element={<ChatList/>} />
          <Route path='*' element={<NotFound/>} />
      </Routes>
      </AlertProvider>
      </messageContext.Provider>
      </>
  )
}

export default App
