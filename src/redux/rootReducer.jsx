// src/redux/rootReducer.js
import { combineReducers } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import customizationReducer from './customizationSlice';
import projectReducer from './projectSlice';

const rootReducer = combineReducers({
    auth: authReducer,
    customization: customizationReducer,
    projects: projectReducer
});

export default rootReducer;
