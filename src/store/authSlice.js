import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

import { signupAPI, loginAPI, googleLoginAPI, logoutAPI } from './authAPI'

// Get saved user from LocalStorage
const getSavedUser = () => {
    try {
        const saved = localStorage.getItem('user')
        return saved ? JSON.parse(saved) : null
    } catch {
        return null
    }
}

const savedUser = getSavedUser()

const initialState = {
    user: savedUser,
    isAuthenticated: Boolean(savedUser),

    isCheckingAuth: false,
    isLoading: false,
    isLoggingOut: false,

    error: null,
    signupMessage: null,
}

// SIGNUP
export const signupUser = createAsyncThunk(
    'auth/signup',
    async (userData, { rejectWithValue, signal }) => {
        try {
            return await signupAPI(userData, { signal })
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
                return rejectWithValue({ isCanceled: true })
            }
            return rejectWithValue(
                error.response?.data?.message ||
                'Registration failed. Please try again.'
            )
        }
    }
)

// NORMAL LOGIN
export const loginUser = createAsyncThunk(
    'auth/login',
    async (credentials, { rejectWithValue, signal }) => {
        try {
            const response = await loginAPI(credentials, { signal })

            const user = response?.user || response
            const token = response?.token

            if (!user?.name || !user?.email) {
                return rejectWithValue(
                    'Login response does not contain valid user information.'
                )
            }

            localStorage.setItem('user', JSON.stringify(user))

            if (token) {
                localStorage.setItem('token', token)
            }

            return response

        } catch (error) {
            if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
                return rejectWithValue({ isCanceled: true })
            }
            return rejectWithValue(
                error.response?.data?.message ||
                'Invalid email or password.'
            )
        }
    }
)

// GOOGLE LOGIN
export const googleLoginUser = createAsyncThunk(
    'auth/googleLogin',
    async (credential, { rejectWithValue, signal }) => {
        try {
            const response = await googleLoginAPI(credential, { signal })

            const user = response?.user || response
            const token = response?.token

            if (!user?.name || !user?.email) {
                return rejectWithValue(
                    'Google login response does not contain valid user information.'
                )
            }

            localStorage.setItem('user', JSON.stringify(user))

            if (token) {
                localStorage.setItem('token', token)
            }

            return response

        } catch (error) {
            if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
                return rejectWithValue({ isCanceled: true })
            }
            return rejectWithValue(
                error.response?.data?.message ||
                'Google login failed. Please try again.'
            )
        }
    }
)

// LOGOUT
export const logoutUser = createAsyncThunk(
    'auth/logout',
    async (_, { rejectWithValue, signal }) => {
        try {
            return await logoutAPI({ signal })
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
                return rejectWithValue({ isCanceled: true })
            }
            return rejectWithValue(
                error.response?.data?.message ||
                'Logout failed. Please try again.'
            )
        } finally {
            localStorage.removeItem('user')
            localStorage.removeItem('token')
        }
    }
)

const authSlice = createSlice({
    name: 'auth',
    initialState,

    reducers: {
        clearError: (state) => {
            state.error = null
        },

        clearSignupMessage: (state) => {
            state.signupMessage = null
        },

        logout: (state) => {
            state.user = null
            state.isAuthenticated = false
            state.isLoggingOut = false
            state.error = null
            state.signupMessage = null

            localStorage.removeItem('user')
            localStorage.removeItem('token')
        },
    },

    extraReducers: (builder) => {
        builder

            // SIGNUP
            .addCase(signupUser.pending, (state) => {
                state.isLoading = true
                state.error = null
                state.signupMessage = null
            })

            .addCase(signupUser.fulfilled, (state, action) => {
                state.isLoading = false
                state.signupMessage =
                    action.payload?.message ||
                    'Account created successfully!'
                state.error = null
            })

            .addCase(signupUser.rejected, (state, action) => {
                state.isLoading = false
                if (!action.payload?.isCanceled && !action.meta?.aborted) {
                    state.error = action.payload
                }
            })

            // LOGIN
            .addCase(loginUser.pending, (state) => {
                state.isLoading = true
                state.error = null
            })

            .addCase(loginUser.fulfilled, (state, action) => {
                state.isLoading = false
                state.user = action.payload?.user || action.payload
                state.isAuthenticated = true
                state.error = null
            })

            .addCase(loginUser.rejected, (state, action) => {
                state.isLoading = false
                if (!action.payload?.isCanceled && !action.meta?.aborted) {
                    state.error = action.payload
                }
            })

            // GOOGLE LOGIN
            .addCase(googleLoginUser.pending, (state) => {
                state.isLoading = true
                state.error = null
            })

            .addCase(googleLoginUser.fulfilled, (state, action) => {
                state.isLoading = false
                state.user = action.payload?.user || action.payload
                state.isAuthenticated = true
                state.error = null
            })

            .addCase(googleLoginUser.rejected, (state, action) => {
                state.isLoading = false
                if (!action.payload?.isCanceled && !action.meta?.aborted) {
                    state.error = action.payload
                }
            })

            // LOGOUT
            .addCase(logoutUser.pending, (state) => {
                state.isLoggingOut = true
                state.error = null
            })

            .addCase(logoutUser.fulfilled, (state) => {
                state.isLoggingOut = false
                state.user = null
                state.isAuthenticated = false
                state.error = null
                state.signupMessage = null
            })

            .addCase(logoutUser.rejected, (state, action) => {
                state.isLoggingOut = false
                state.user = null
                state.isAuthenticated = false
                if (!action.payload?.isCanceled && !action.meta?.aborted) {
                    state.error = action.payload
                }
                state.signupMessage = null
            })
    },
})

export const {
    clearError,
    clearSignupMessage,
    logout,
} = authSlice.actions

export default authSlice.reducer