import { combineReducers } from 'redux';

// reducer import
import authReducer from './authSlice';
import customizationReducer from './customizationReducer';

// ==============================|| COMBINE REDUCER ||============================== //

const reducer = combineReducers({
    auth: authReducer,
    customization: customizationReducer
});

export default reducer;
