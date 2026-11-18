import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getSharedTasksAPI, shareTaskAPI, updateSharedTaskStatusAPI, deleteSharedTaskAPI } from './sharedTaskAPI'

// Helper to extract clean error message
const getErrorMessage = (error, defaultMsg) => {
    if (!error) return defaultMsg
    if (typeof error === 'string') return error
    if (error.response?.data) {
        const data = error.response.data
        if (typeof data === 'string') return data
        if (data.message && typeof data.message === 'string') return data.message
    }
    return error.message || defaultMsg
}

// 1. Fetch tasks shared WITH logged-in user
export const fetchReceivedSharedTasks = createAsyncThunk(
    'sharedTasks/fetchReceived',
    async (_, { rejectWithValue, signal }) => {
        try {
            const res = await getSharedTasksAPI(undefined, { signal })
            return res.data || []
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
                return rejectWithValue({ isCanceled: true })
            }
            return rejectWithValue(getErrorMessage(error, 'Failed to fetch shared tasks'))
        }
    }
)

// 2. Fetch tasks shared BY logged-in user
export const fetchSentSharedTasks = createAsyncThunk(
    'sharedTasks/fetchSent',
    async (_, { rejectWithValue, signal }) => {
        try {
            const res = await getSharedTasksAPI('sent', { signal })
            return res.data || []
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
                return rejectWithValue({ isCanceled: true })
            }
            return rejectWithValue(getErrorMessage(error, 'Failed to fetch sent shared tasks'))
        }
    }
)

// 3. Fetch all shared tasks (both received & sent)
export const fetchAllSharedTasks = createAsyncThunk(
    'sharedTasks/fetchAll',
    async (_, { dispatch }) => {
        const [receivedRes, sentRes] = await Promise.allSettled([
            dispatch(fetchReceivedSharedTasks()).unwrap(),
            dispatch(fetchSentSharedTasks()).unwrap(),
        ])
        return {
            received: receivedRes.status === 'fulfilled' ? receivedRes.value : [],
            sent: sentRes.status === 'fulfilled' ? sentRes.value : [],
        }
    }
)

// 4. Share task with a collaborator (Supports single or multiple tasks)
export const shareTask = createAsyncThunk(
    'sharedTasks/shareTask',
    async ({ task_id, task_ids, collaborator, status }, { rejectWithValue, dispatch, signal }) => {
        try {
            const res = await shareTaskAPI({ task_id, task_ids, collaborator, status }, { signal })
            // Refresh sent tasks after sharing
            dispatch(fetchSentSharedTasks(true))
            return {
                data: res.data,
                message: res.message
            }
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
                return rejectWithValue({ isCanceled: true })
            }
            return rejectWithValue(getErrorMessage(error, 'Failed to share task'))
        }
    }
)

// 5. Update shared task status (pending | in-progress | completed)
export const updateSharedTaskStatus = createAsyncThunk(
    'sharedTasks/updateStatus',
    async ({ id, status }, { rejectWithValue, signal }) => {
        try {
            const res = await updateSharedTaskStatusAPI(id, status, { signal })
            return { id, status, updatedTask: res.data }
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
                return rejectWithValue({ isCanceled: true })
            }
            return rejectWithValue({
                id,
                message: getErrorMessage(error, 'Failed to update shared task status'),
            })
        }
    }
)

// 6. Delete / unshare shared task
export const deleteSharedTask = createAsyncThunk(
    'sharedTasks/deleteSharedTask',
    async (id, { rejectWithValue, signal }) => {
        try {
            await deleteSharedTaskAPI(id, { signal })
            return id
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
                return rejectWithValue({ isCanceled: true })
            }
            return rejectWithValue({
                id,
                message: getErrorMessage(error, 'Failed to remove shared task'),
            })
        }
    }
)

const initialState = {
    received: [],
    sent: [],
    isLoadingReceived: false,
    isLoadingSent: false,
    error: null,

    // Share modal state
    isSharing: false,
    shareSuccess: false,
    shareError: null,

    // Item-specific action states
    updatingId: null,
    deletingId: null,

    // Toast notification
    toast: null, // { type: 'success' | 'error' | 'info', message: string, id: number }
}

const sharedTaskSlice = createSlice({
    name: 'sharedTasks',
    initialState,
    reducers: {
        clearSharedTaskError: (state) => {
            state.error = null
            state.shareError = null
        },
        resetShareState: (state) => {
            state.isSharing = false
            state.shareSuccess = false
            state.shareError = null
        },
        showToast: (state, action) => {
            state.toast = {
                id: Date.now(),
                type: action.payload.type || 'info',
                message: action.payload.message || '',
            }
        },
        clearToast: (state) => {
            state.toast = null
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch Received
            .addCase(fetchReceivedSharedTasks.pending, (state) => {
                state.isLoadingReceived = true
                state.error = null
            })
            .addCase(fetchReceivedSharedTasks.fulfilled, (state, action) => {
                state.isLoadingReceived = false
                state.received = Array.isArray(action.payload) ? action.payload : []
            })
            .addCase(fetchReceivedSharedTasks.rejected, (state, action) => {
                state.isLoadingReceived = false
                if (!action.payload?.isCanceled && !action.meta?.aborted) {
                    state.error = action.payload
                }
            })

            // Fetch Sent
            .addCase(fetchSentSharedTasks.pending, (state) => {
                state.isLoadingSent = true
                state.error = null
            })
            .addCase(fetchSentSharedTasks.fulfilled, (state, action) => {
                state.isLoadingSent = false
                state.sent = Array.isArray(action.payload) ? action.payload : []
            })
            .addCase(fetchSentSharedTasks.rejected, (state, action) => {
                state.isLoadingSent = false
                if (!action.payload?.isCanceled && !action.meta?.aborted) {
                    state.error = action.payload
                }
            })

            // Share Task
            .addCase(shareTask.pending, (state) => {
                state.isSharing = true
                state.shareSuccess = false
                state.shareError = null
            })
            .addCase(shareTask.fulfilled, (state, action) => {
                state.isSharing = false
                state.shareSuccess = true
                state.shareError = null
                const payloadData = action.payload?.data !== undefined ? action.payload.data : action.payload
                if (Array.isArray(payloadData)) {
                    payloadData.forEach((item) => {
                        if (item && item._id) {
                            const exists = state.sent.some((s) => s._id === item._id)
                            if (!exists) {
                                state.sent.unshift(item)
                            }
                        }
                    })
                } else if (payloadData && payloadData._id) {
                    const exists = state.sent.some((item) => item._id === payloadData._id)
                    if (!exists) {
                        state.sent.unshift(payloadData)
                    }
                }
                state.toast = {
                    id: Date.now(),
                    type: 'success',
                    message: action.payload?.message || 'Task(s) shared successfully.',
                }
            })
            .addCase(shareTask.rejected, (state, action) => {
                state.isSharing = false
                state.shareSuccess = false
                state.shareError = action.payload || 'Failed to share task'
            })

            // Update Status (optimistic handled in UI + updated in store)
            .addCase(updateSharedTaskStatus.pending, (state, action) => {
                state.updatingId = action.meta.arg.id
                const { id, status } = action.meta.arg
                // Optimistic update in received
                const recIdx = state.received.findIndex((item) => item._id === id)
                if (recIdx !== -1) {
                    state.received[recIdx].status = status
                }
                // Optimistic update in sent
                const sentIdx = state.sent.findIndex((item) => item._id === id)
                if (sentIdx !== -1) {
                    state.sent[sentIdx].status = status
                }
            })
            .addCase(updateSharedTaskStatus.fulfilled, (state, action) => {
                state.updatingId = null
                const { id, updatedTask } = action.payload
                if (updatedTask) {
                    const recIdx = state.received.findIndex((item) => item._id === id)
                    if (recIdx !== -1) {
                        state.received[recIdx] = { ...state.received[recIdx], ...updatedTask }
                    }
                    const sentIdx = state.sent.findIndex((item) => item._id === id)
                    if (sentIdx !== -1) {
                        state.sent[sentIdx] = { ...state.sent[sentIdx], ...updatedTask }
                    }
                }
                state.toast = {
                    id: Date.now(),
                    type: 'success',
                    message: 'Shared task status updated successfully.',
                }
            })
            .addCase(updateSharedTaskStatus.rejected, (state, action) => {
                state.updatingId = null
                state.toast = {
                    id: Date.now(),
                    type: 'error',
                    message: action.payload?.message || 'Failed to update status',
                }
            })

            // Delete / Unshare
            .addCase(deleteSharedTask.pending, (state, action) => {
                state.deletingId = action.meta.arg
                state.error = null
            })
            .addCase(deleteSharedTask.fulfilled, (state, action) => {
                state.deletingId = null
                state.error = null
                const id = action.payload
                state.received = state.received.filter((item) => item._id !== id)
                state.sent = state.sent.filter((item) => item._id !== id)
                state.toast = {
                    id: Date.now(),
                    type: 'success',
                    message: 'Shared task removed successfully.',
                }
            })
            .addCase(deleteSharedTask.rejected, (state, action) => {
                state.deletingId = null
                const errorMsg = action.payload?.message || 'Failed to remove shared task'
                state.error = errorMsg
                state.toast = {
                    id: Date.now(),
                    type: 'error',
                    message: errorMsg,
                }
            })
    },
})

export const { clearSharedTaskError, resetShareState, showToast, clearToast } =
    sharedTaskSlice.actions

export default sharedTaskSlice.reducer
