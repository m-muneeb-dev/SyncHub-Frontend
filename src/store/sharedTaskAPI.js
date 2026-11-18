import api from '../services/api'

// Fetch shared tasks
// type can be undefined (default: shared with me), 'sent' (shared by me), or 'all'
export const getSharedTasksAPI = async (type, options = {}) => {
    const params = type ? { type } : {}
    const response = await api.get('/shared-tasks', { params, signal: options.signal })
    return response.data
}

// Share a task with a friend
// body: { task_id, collaborator, status }
export const shareTaskAPI = async (payload, options = {}) => {
    const response = await api.post('/shared-tasks', payload, { signal: options.signal })
    return response.data
}

// Update status of a shared task
// body: { status: 'pending' | 'in-progress' | 'completed' }
export const updateSharedTaskStatusAPI = async (id, status, options = {}) => {
    const response = await api.patch(`/shared-tasks/${id}/status`, { status }, { signal: options.signal })
    return response.data
}

// Remove or unshare a shared task
export const deleteSharedTaskAPI = async (id, options = {}) => {
    const response = await api.delete(`/shared-tasks/${id}`, { signal: options.signal })
    return response.data
}
