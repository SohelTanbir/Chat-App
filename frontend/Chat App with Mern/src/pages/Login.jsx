import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {  faFacebookF, faGooglePlusG, faLinkedinIn } from '@fortawesome/free-brands-svg-icons';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import {useNavigate } from 'react-router-dom';


const Login = () => {
    const navigate = useNavigate();
    const [user, setUser] =  useState({
        email:"",
        password:"",
    });

// get input field value
const handleChange =(e)=>{
    const newUser  = {...user};
    newUser[e.target.name] = e.target.value;
    setUser(newUser);
}

// submit the form and create account
const handleSumit = (e)=>{
    e.preventDefault();
    // if(!user.email || !user.password){
    //     alert("All field are required!");
    //     return;
    // }
    setUser({
        email:"",
        password:"",
    });


   // redirect to all chats list pages
   navigate("/users/chats");
}










    return (
        <div id='auth-page'>
            <div className="flex">
                <div className="max-w-[450px] w-full mx-auto px-5 py-8 text-center h-screen flex items-center justify-center ">
                    <div className='w-full'>
                    <h2 className=' font-Montserrat font-semibold  text-md text-primary mb-2 min-[780px]:hidden '>Welcome Back!</h2>
                    <h2 className=' font-Montserrat font-bold text-3xl mb-5'>Sign In</h2>
                    <div className="tex-center">
                        <ul className='flex justify-center items-center '>
                            <li className='w-10 h-10 border border-gray-300 text-center  font-normal text-md text-black flex justify-center items-center rounded-full mr-4 cursor-pointer hover:bg-primary hover:text-white '>
                                <FontAwesomeIcon icon={ faFacebookF} />
                            </li>
                            <li className='w-10 h-10 border border-gray-300 text-center  font-normal text-md text-black flex justify-center items-center rounded-full mr-4 cursor-pointer hover:bg-primary hover:text-white '>
                                <FontAwesomeIcon icon={ faGooglePlusG} />
                            </li>
                            <li className='w-10 h-10 border border-gray-300 text-center  font-normal text-md text-black flex justify-center items-center rounded-full mr-4 cursor-pointer hover:bg-primary hover:text-white '>
                                <FontAwesomeIcon icon={ faLinkedinIn} />
                            </li>
                        </ul>
                    </div>
                    <p className=' font-normal text-black text-center texy-sm py-3'>Or use your Account</p>
                    <form onSubmit={handleSumit}>
                       <input onChange={handleChange} name="email" className='w-full mb-[20px] bg-[#EEEEEE] py-2 px-4 rounded-md font-normal text-lg text-black outline-none ' type="email"  placeholder='Email'/><br />
                       <input onChange={handleChange} name="password" className='w-full mb-[20px] bg-[#EEEEEE] py-2 px-4 rounded-md font-normal text-lg text-black outline-none ' type="password"  placeholder='Password'/>
                        <Link to="/password/forgot">
                            <p>Forgot your password?</p>
                        </Link>
                    <button className=' font-medium text-white   text-center  border-gray-300 rounded-full  uppercase py-2 px-8 bg-primary mt-2'>Sign in</button>
                    </form>
                    <p className=' font-normal text-primary text-center text-[12px] md:text-sm py-3 min-[780px]:hidden'>Dont have an account? <Link to="/"> <span className='underline'>Sign Up</span> </Link></p>
                    </div>
                </div>
                <div className="w-96 bg-primary px-5 py-8 text-center flex justify-center items-center max-[780px]:hidden">
                    <div className="w-full">
                    <h2 className=' font-Montserrat font-semibold  text-2xl text-white mb-3'>Welcome Back!</h2>
                    <p className=' font-Montserrat font-normal  text-lg text-white mb-4' >Enter your credentials and start<br />
                    journey with us
                    </p>
                  <Link to="/">
                     <button className=' font-medium text-white text-center border border-gray-300 rounded-full  uppercase py-2 px-8  hover:bg-primary hover:border-current  '>Sign Up</button>

                  </Link>
                </div>
                </div>
            </div>
        </div>
    );
};

export default Login;