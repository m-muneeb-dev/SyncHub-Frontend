import api from '../services/api'

export const getTasksAPI = async (options = {}) => {
    const response = await api.get('/tasks', { signal: options.signal })
    return response.data
}

export const getTaskByIdAPI = async (id, options = {}) => {
    const response = await api.get(`/tasks/${id}`, { signal: options.signal })
    return response.data
}

export const createTaskAPI = async (taskData, options = {}) => {
    const response = await api.post('/tasks/create', taskData, { signal: options.signal })
    return response.data
}

export const updateTaskAPI = async (id, taskData, options = {}) => {
    const response = await api.patch(`/tasks/${id}`, taskData, { signal: options.signal })
    return response.data
}

export const deleteTasksAPI = async (id, options = {}) => {
    const response = await api.delete(`/tasks/${id}`, { signal: options.signal })
    return response.data
}