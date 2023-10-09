import './App.css';
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import './tailwind/style.css';
import NotFound from './pages/NotFound';
import ChatList from './pages/ChatList/ChatList';

function App() {

  return (
    <>
      <Routes>
          <Route path='/' element={<SignUp/>} />
          <Route path='/login' element={<Login/>} />
          <Route path='/users/chats' element={<ChatList/>} />
          <Route path='*' element={<NotFound/>} />
      </Routes>
      </>
  )
}

export default App
