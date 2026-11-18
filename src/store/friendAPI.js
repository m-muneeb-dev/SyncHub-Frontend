import api from '../services/api'

export const getFriendsAPI = async (options = {}) => {
    const response = await api.get('/friends', { signal: options.signal })
    return response.data
}

export const getFriendRequestsAPI = async (options = {}) => {
    const response = await api.get('/friends/received', { signal: options.signal })
    return response.data
}

export const getSentFriendRequestsAPI = async (options = {}) => {
    const response = await api.get('/friends/sent', { signal: options.signal })
    return response.data
}

export const acceptFriendRequestAPI = async (requestId, options = {}) => {
    const response = await api.patch(`/friends/${requestId}/accept`, {}, { signal: options.signal })
    return response.data
}

export const rejectFriendRequestAPI = async (requestId, options = {}) => {
    const response = await api.patch(`/friends/${requestId}/reject`, {}, { signal: options.signal })
    return response.data
}

export const cancelFriendRequestAPI = async (requestId, options = {}) => {
    const response = await api.delete(`/friends/requests/${requestId}`, { signal: options.signal })
    return response.data
}

export const deleteFriendAPI = async (id, options = {}) => {
    const response = await api.delete(`/friends/${id}`, { signal: options.signal })
    return response.data
}

export const sendFriendRequestAPI = async (email, options = {}) => {
    const response = await api.post('/friends/request', { email }, { signal: options.signal })
    return response.data
}

