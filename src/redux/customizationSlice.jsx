import { createSlice } from '@reduxjs/toolkit';
import config from 'config';

const initialState = {
    isOpen: [], // for active default menu
    defaultId: 'default',
    fontFamily: config.fontFamily || `'Roboto', sans-serif`,
    borderRadius: config.borderRadius || 12,
    opened: true,
    mode: 'light', // light or dark mode
    presetColor: 'default', // default, theme1, theme2, theme3, theme4, theme5, theme6
    enableNavbarWhenCollapsed: true
};

const customizationSlice = createSlice({
    name: 'customization',
    initialState,
    reducers: {
        setMenu: (state) => {
            state.opened = !state.opened;
        },
        menuToggle: (state) => {
            state.opened = !state.opened;
        },
        menuOpen: (state, action) => {
            state.isOpen = [action.payload];
        },
        setFontFamily: (state, action) => {
            state.fontFamily = action.payload;
        },
        setBorderRadius: (state, action) => {
            state.borderRadius = action.payload;
        },
        setMode: (state, action) => {
            state.mode = action.payload;
        },
        setPresetColor: (state, action) => {
            state.presetColor = action.payload;
        },
        setEnableNavbarWhenCollapsed: (state, action) => {
            state.enableNavbarWhenCollapsed = action.payload;
        }
    }
});

// Action creators
export const { setMenu, menuToggle, menuOpen, setFontFamily, setBorderRadius, setMode, setPresetColor, setEnableNavbarWhenCollapsed } =
    customizationSlice.actions;

export const customizationReducer = customizationSlice.reducer;
export default customizationSlice.reducer;
