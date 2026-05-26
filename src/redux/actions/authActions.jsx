// src/redux/actions/authActions.js
import { LOGOUT_USER } from '../actions'; // Ensure this type is defined in your types file

// Action to log out the user
export const logoutUser = () => {
    return (dispatch) => {
        // Clear auth-related data from localStorage or any persistence layer
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRoles');

        // Dispatch logout action
        dispatch({
            type: LOGOUT_USER
        });
    };
};
