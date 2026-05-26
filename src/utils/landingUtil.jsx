// src/utils/authUtils.js
import { setCredentials, clearCredentials } from 'redux/authSlice';
import { get } from './apiUtils';

// Function to handle login
export const getAllProjects = async (endpoint) => {
    try {
        let data = await get(endpoint);

        console.log('Response data for projects:', data);

        return data;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
};

// Function to handle login
export const getAllFirms = async (endpoint) => {
    try {
        let data = await get(endpoint);

        console.log('Response data for firms:', data);

        return data;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
};

export const getAllSkills = async (endpoint) => {
    try {
        let data = await get(endpoint);

        console.log('Response data for skills:', data);

        return data;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
};

export const createFirm = async (formData) => {
    try {
        const response = await fetch('/api/firms', {
            method: 'POST',
            body: formData
        });
        return await response.json();
    } catch (error) {
        throw new Error('Failed to create firm');
    }
};

export const updateFirm = async (id, formData) => {
    try {
        const response = await fetch(`/api/firms/${id}`, {
            method: 'PUT',
            body: formData
        });
        return await response.json();
    } catch (error) {
        throw new Error('Failed to update firm');
    }
};

export const deleteFirm = async (id) => {
    try {
        await fetch(`/api/firms/${id}`, {
            method: 'DELETE'
        });
        return true;
    } catch (error) {
        throw new Error('Failed to delete firm');
    }
};
