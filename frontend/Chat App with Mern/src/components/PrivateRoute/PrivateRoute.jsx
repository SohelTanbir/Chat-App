import  { useContext } from 'react';
import { Navigate,  } from 'react-router-dom';
import { appContext } from '../../App';

const PrivateRoute = ({children}) => {
    const [loggedInUser, setLoggedInUser ] = useContext(appContext);
    return   loggedInUser.email ? children: <Navigate to="/login" />;  
};

export default PrivateRoute;