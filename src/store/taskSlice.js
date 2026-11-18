import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getTasksAPI, deleteTasksAPI, createTaskAPI, updateTaskAPI } from './taskAPI'

// Fetch Tasks
export const fetchTasks = createAsyncThunk(
    'tasks/fetchTasks',
    async (_, { rejectWithValue, signal }) => {
        try {
            const response = await getTasksAPI({ signal })
            return response
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
                return rejectWithValue({ isCanceled: true })
            }
            return rejectWithValue(
                error.response?.data?.message || 'Failed to fetch tasks'
            )
        }
    }
)

// Create Task
export const createTask = createAsyncThunk(
    'tasks/createTask',
    async (taskData, { rejectWithValue, signal }) => {
        try {
            const response = await createTaskAPI(taskData, { signal })
            return response
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
                return rejectWithValue({ isCanceled: true })
            }
            return rejectWithValue(
                error.response?.data?.message || 'Failed to create task'
            )
        }
    }
)

// Update Task
export const updateTask = createAsyncThunk(
    'tasks/updateTask',
    async ({ id, ...taskData }, { rejectWithValue, signal }) => {
        try {
            const response = await updateTaskAPI(id, taskData, { signal })
            return response
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
                return rejectWithValue({ isCanceled: true })
            }
            return rejectWithValue(
                error.response?.data?.message || 'Failed to update task'
            )
        }
    }
)

// Delete Task
export const deleteTask = createAsyncThunk(
    'tasks/deleteTask',
    async (id, { rejectWithValue, signal }) => {
        try {
            await deleteTasksAPI(id, { signal })
            return id
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
                return rejectWithValue({ isCanceled: true })
            }
            return rejectWithValue(
                error.response?.data?.message || 'Failed to delete task'
            )
        }
    }
)

// Initial State
const initialState = {
    tasks: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    isLoading: false,
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    error: null,
}

// Slice
const taskSlice = createSlice({
    name: 'tasks',
    initialState,

    reducers: {
        clearTaskError: (state) => {
            state.error = null
        },
    },

    extraReducers: (builder) => {
        builder

            // Fetch Tasks - Pending
            .addCase(fetchTasks.pending, (state) => {
                state.isLoading = true
                state.status = 'loading'
                state.error = null
            })

            // Fetch Tasks - Fulfilled
            .addCase(fetchTasks.fulfilled, (state, action) => {
                state.isLoading = false
                state.status = 'succeeded'
                state.tasks = Array.isArray(action.payload)
                    ? action.payload
                    : action.payload?.tasks || []
            })

            // Fetch Tasks - Rejected
            .addCase(fetchTasks.rejected, (state, action) => {
                state.isLoading = false
                if (action.payload?.isCanceled || action.meta?.aborted) {
                    return
                }
                state.status = 'failed'
                state.error = action.payload
            })

            // Create Task - Pending
            .addCase(createTask.pending, (state) => {
                state.isCreating = true
                state.error = null
            })

            // Create Task - Fulfilled
            .addCase(createTask.fulfilled, (state, action) => {
                state.isCreating = false
                const newTask = action.payload?.task || action.payload
                if (newTask) {
                    state.tasks.unshift(newTask)
                }
            })

            // Create Task - Rejected
            .addCase(createTask.rejected, (state, action) => {
                state.isCreating = false
                if (!action.payload?.isCanceled && !action.meta?.aborted) {
                    state.error = action.payload
                }
            })

            // Update Task - Pending
            .addCase(updateTask.pending, (state) => {
                state.isUpdating = true
                state.error = null
            })

            // Update Task - Fulfilled
            .addCase(updateTask.fulfilled, (state, action) => {
                state.isUpdating = false
                const updated = action.payload?.task || action.payload
                if (updated) {
                    const index = state.tasks.findIndex(
                        (t) => (t._id && t._id === updated._id) || (t.id && t.id === updated.id)
                    )
                    if (index !== -1) {
                        state.tasks[index] = { ...state.tasks[index], ...updated }
                    }
                }
            })

            // Update Task - Rejected
            .addCase(updateTask.rejected, (state, action) => {
                state.isUpdating = false
                if (!action.payload?.isCanceled && !action.meta?.aborted) {
                    state.error = action.payload
                }
            })

            // Delete Task - Pending
            .addCase(deleteTask.pending, (state) => {
                state.isDeleting = true
                state.error = null
            })

            // Delete Task - Fulfilled
            .addCase(deleteTask.fulfilled, (state, action) => {
                state.isDeleting = false

                state.tasks = state.tasks.filter(
                    (task) => task._id !== action.payload && task.id !== action.payload
                )
            })

            // Delete Task - Rejected
            .addCase(deleteTask.rejected, (state, action) => {
                state.isDeleting = false
                if (!action.payload?.isCanceled && !action.meta?.aborted) {
                    state.error = action.payload
                }
            })
    },
})

export const { clearTaskError } = taskSlice.actions

export default taskSlice.reducer