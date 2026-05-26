const SET_CREDENTIALS = '@auth/SET_CREDENTIALS';
const CLEAR_CREDENTIALS = '@auth/CLEAR_CREDENTIALS';

const initialState = {
  token: sessionStorage.getItem('token') || null,
  sentIv: sessionStorage.getItem('iv') || null,
  user: JSON.parse(sessionStorage.getItem('user') || 'null'),
  userId: sessionStorage.getItem('userId') || null,
  userName: sessionStorage.getItem('userName') || null,
  userRoles: JSON.parse(sessionStorage.getItem('userRoles') || '[]')
};

export const setCredentials = (payload) => ({
  type: SET_CREDENTIALS,
  payload
});

export const clearCredentials = () => ({
  type: CLEAR_CREDENTIALS
});

const authReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_CREDENTIALS:
      return {
        ...state,
        ...action.payload
      };
    case CLEAR_CREDENTIALS:
      return {
        token: null,
        sentIv: null,
        user: null,
        userId: null,
        userName: null,
        userRoles: []
      };
    default:
      return state;
  }
};

export default authReducer;
