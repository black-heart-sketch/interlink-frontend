import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { get, post } from '../utils/apiUtils';
export const createProject = createAsyncThunk('projects/createProject', async (projectData, { rejectWithValue }) => {
    try {
        return await post('/projects/create', projectData);
    } catch (error) {
        return rejectWithValue(error.message || 'Network error');
    }
});

const projectSlice = createSlice({
    name: 'projects',
    initialState: {
        projects: [],
        status: 'idle',
        error: null
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(createProject.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(createProject.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.projects.push(action.payload);
            })
            .addCase(createProject.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            });
    }
});

export default projectSlice.reducer;
