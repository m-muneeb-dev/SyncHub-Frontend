import axios from 'axios'

let storeRef = null

export const setStore = (store) => {
    storeRef = store
}

const api = axios.create({
    baseURL: import.meta.env.BACKEND_API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Attach bearer token if present in localStorage
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

// Handle 401 Unauthorized responses globally & support AbortController
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // If the request was explicitly canceled by AbortController, propagate clean cancellation
        if (axios.isCancel(error)) {
            return Promise.reject(error)
        }

        if (error.response?.status === 401) {
            localStorage.removeItem('user')
            localStorage.removeItem('token')
            if (storeRef) {
                storeRef.dispatch({ type: 'auth/logout' })
            }
        }
        return Promise.reject(error)
    }
)

export default api
