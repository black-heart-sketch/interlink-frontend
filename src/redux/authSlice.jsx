import { createSlice } from '@reduxjs/toolkit';

const safeParseJSON = (key, defaultValue) => {
    try {
        const item = sessionStorage.getItem(key);
        return item && item !== 'undefined' ? JSON.parse(item) : defaultValue;
    } catch (e) {
        return defaultValue;
    }
};

const initialState = {
    token: sessionStorage.getItem('token') || null,
    isAuthenticated: !!sessionStorage.getItem('token'),
    userId: sessionStorage.getItem('userId') || null,
    userName: sessionStorage.getItem('userName') || null,
    email: sessionStorage.getItem('email') || null,
    phone: sessionStorage.getItem('phone') || null,
    sentIv: sessionStorage.getItem('sentIv') || null,
    userRoles: safeParseJSON('userRoles', []),
    userProfile: safeParseJSON('userProfile', null)
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (state, action) => {
            const { token, userId, userRoles, userName, profile, iv, email, phone } = action.payload;
            console.log('userphone in authSlice:', action.payload);
            // console.log(token,userId,userRoles,userName,profile)

            state.token = token;
            state.sentIv = iv;
            state.userId = userId;
            state.userName = userName;
            state.email = email;
            state.phone = phone;
            state.userProfile = profile;
            state.userRoles = Array.isArray(userRoles) ? userRoles : [userRoles];
            state.isAuthenticated = true;

            // Store token and session data in both sessionStorage and localStorage
            if (token) {
                sessionStorage.setItem('token', token);
                localStorage.setItem('token', token);
            }
            if (iv) {
                sessionStorage.setItem('sentIv', iv);
                localStorage.setItem('sentIv', iv);
            }
            if (userId) {
                sessionStorage.setItem('userId', userId);
                localStorage.setItem('userId', userId);
            }
            if (userName) {
                sessionStorage.setItem('userName', userName);
                localStorage.setItem('userName', userName);
            }
            if (email) {
                sessionStorage.setItem('email', email);
                localStorage.setItem('email', email);
            }
            if (phone) {
                sessionStorage.setItem('phone', phone);
                localStorage.setItem('phone', phone);
            }
            sessionStorage.setItem('userRoles', JSON.stringify(state.userRoles));
            localStorage.setItem('userRoles', JSON.stringify(state.userRoles));
            if (profile) {
                sessionStorage.setItem('userProfile', JSON.stringify(profile));
                localStorage.setItem('userProfile', JSON.stringify(profile));
                localStorage.setItem('user', JSON.stringify({ id: profile._id, email: profile.email, role: profile.role }));
            }
        },
        clearCredentials: (state) => {
            state.token = null;
            state.sentIv = null;
            state.userId = null;
            state.userName = null;
            state.email = null;
            state.phone = null;
            state.userRoles = [];
            state.userProfile = null;
            state.isAuthenticated = false;

            // Clear sessionStorage
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('iv');
            sessionStorage.removeItem('userId');
            sessionStorage.removeItem('userName');
            sessionStorage.removeItem('email');
            sessionStorage.removeItem('phone');
            sessionStorage.removeItem('userRoles');
            sessionStorage.removeItem('userProfile');
            sessionStorage.removeItem('user');

            // Clear localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('iv');
            localStorage.removeItem('userId');
            localStorage.removeItem('userName');
            localStorage.removeItem('email');
            localStorage.removeItem('phone');
            localStorage.removeItem('userRoles');
            localStorage.removeItem('userProfile');
            localStorage.removeItem('user');
            localStorage.removeItem('userRole');
        }
    }
});

export const { setCredentials, clearCredentials } = authSlice.actions;

export const authReducer = authSlice.reducer;
export default authSlice.reducer;

export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectCurrentToken = (state) => state.auth.token;
export const selectCurrentIv = (state) => state.auth.setIv;
export const selectCurrentUserId = (state) => state.auth.userId;
export const selectCurrentUserName = (state) => state.auth.userName;
export const selectCurrentUserEmail = (state) => state.auth.email;
export const selectCurrentUserPhone = (state) => state.auth.phone;
export const selectCurrentUserProfile = (state) => state.auth.userProfile;
export const selectCurrentUserRoles = (state) => state.auth.userRoles;
