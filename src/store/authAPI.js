// src/store/authAPI.js

import api from '../services/api'

// Signup API
export const signupAPI = async (userData, options = {}) => {
    const { data } = await api.post('/auth/signup', userData, { signal: options.signal })
    return data
}

// Email and Password Login API
export const loginAPI = async (credentials, options = {}) => {
    const { data } = await api.post('/auth/signin', credentials, { signal: options.signal })
    return data
}

// Google Login API
export const googleLoginAPI = async (credential, options = {}) => {
    const { data } = await api.post('/auth/google', { credential }, { signal: options.signal })
    return data
}

// Logout API
export const logoutAPI = async (options = {}) => {
    const { data } = await api.post('/auth/logout', {}, { signal: options.signal })
    return data
}