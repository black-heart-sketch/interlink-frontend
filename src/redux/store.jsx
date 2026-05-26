// src/redux/store.jsx
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { createLogger } from 'redux-logger';

import { authReducer } from './authSlice';
import { customizationReducer } from './customizationSlice';
import projectReducer from './projectSlice';

const persistConfig = {
    key: 'root',
    storage,
    whitelist: ['auth'] // Only persist auth state
};

const rootReducer = combineReducers({
    auth: authReducer,
    customization: customizationReducer,
    projects: projectReducer
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) => {
        const middleware = getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'persist/REGISTER']
            }
        });
        
        if (import.meta.env.DEV) {
            const logger = createLogger({
                collapsed: true
            });
            return middleware.concat(logger);
        }
        return middleware;
    },
    devTools: import.meta.env.DEV
});

export const persistor = persistStore(store);

export { authReducer, customizationReducer };
export default store;
