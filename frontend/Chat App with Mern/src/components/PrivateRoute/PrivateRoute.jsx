import  { useContext } from 'react';
import { Navigate,  } from 'react-router-dom';
import { userContext } from '../../App';

const PrivateRoute = ({children}) => {
    const [loggedInUser ] = useContext(userContext);
    return   loggedInUser.email ? children   : <Navigate to="/account/login" />;  
};

export default PrivateRoute;