import { useState, useEffect, useMemo, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Share2, Search, Plus, Loader2, Inbox, Send, CheckCircle2, Clock, AlertCircle, ChevronDown } from 'lucide-react'
import { fetchReceivedSharedTasks, fetchSentSharedTasks, updateSharedTaskStatus, deleteSharedTask } from '../../store/sharedTaskSlice'
import SharedTaskCard from '../../components/sharedTaskComponents/SharedTaskCard'
import ShareTaskModal from '../../components/sharedTaskComponents/ShareTaskModal'
import UnshareConfirmModal from '../../components/sharedTaskComponents/UnshareConfirmModal'

export default function SharedTasksPage() {
    const dispatch = useDispatch()

    // Redux state
    const { user } = useSelector((state) => state.auth)
    const currentUserId = user?.id || user?._id

    const {
        received = [],
        sent = [],
        isLoadingReceived,
        isLoadingSent,
        updatingId,
        deletingId,
        error,
    } = useSelector((state) => state.sharedTasks)

    // Local UI states
    const [activeTab, setActiveTab] = useState('received') // 'received' | 'sent'
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'pending' | 'in-progress' | 'completed'
    const [priorityFilter, setPriorityFilter] = useState('all') // 'all' | 'high' | 'medium' | 'low'
    const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false)
    const priorityDropdownRef = useRef(null)

    // Close priority dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (priorityDropdownRef.current && !priorityDropdownRef.current.contains(e.target)) {
                setIsPriorityDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const priorityOptions = [
        { id: 'all', label: 'All Priorities' },
        { id: 'high', label: 'High Priority', dot: 'bg-[#aa2d00]' },
        { id: 'medium', label: 'Medium Priority', dot: 'bg-[#d9a441]' },
        { id: 'low', label: 'Low Priority', dot: 'bg-[#9297a0]' },
    ]

    // Modal states
    const [isShareModalOpen, setIsShareModalOpen] = useState(false)
    const [taskToUnshare, setTaskToUnshare] = useState(null)

    // Fetch initial data with Optimized Caching (Option B)
    useEffect(() => {
        let receivedPromise = null
        let sentPromise = null

        if (received.length === 0) {
            receivedPromise = dispatch(fetchReceivedSharedTasks())
        }
        if (sent.length === 0) {
            sentPromise = dispatch(fetchSentSharedTasks())
        }

        return () => {
            receivedPromise?.abort()
            sentPromise?.abort()
        }
    }, [dispatch])

    // Current tab items
    const rawItems = activeTab === 'received' ? received : sent
    const isLoading = activeTab === 'received' ? isLoadingReceived : isLoadingSent

    // Filter items by search, status, and priority
    const filteredItems = useMemo(() => {
        return rawItems.filter((item) => {
            const task = item.task_id || {}
            const person = activeTab === 'received' ? item.shared_by : item.collaborator

            // Search query matching
            const q = searchQuery.toLowerCase().trim()
            const matchesSearch =
                !q ||
                task.title?.toLowerCase().includes(q) ||
                task.description?.toLowerCase().includes(q) ||
                person?.name?.toLowerCase().includes(q) ||
                person?.email?.toLowerCase().includes(q)

            // Status filter
            const matchesStatus =
                statusFilter === 'all' || item.status?.toLowerCase() === statusFilter

            // Priority filter
            const matchesPriority =
                priorityFilter === 'all' ||
                task.priority?.toLowerCase() === priorityFilter

            return matchesSearch && matchesStatus && matchesPriority
        })
    }, [rawItems, activeTab, searchQuery, statusFilter, priorityFilter])

    // Status update handler
    const handleStatusChange = (id, newStatus) => {
        dispatch(updateSharedTaskStatus({ id, status: newStatus }))
    }

    // Delete / unshare confirmation handler
    const handleConfirmUnshare = async () => {
        if (!taskToUnshare) return

        const sharedById = taskToUnshare?.shared_by?._id || taskToUnshare?.shared_by
        if (currentUserId && sharedById && String(sharedById) !== String(currentUserId)) {
            setTaskToUnshare(null)
            return
        }

        try {
            await dispatch(deleteSharedTask(taskToUnshare._id)).unwrap()
        } catch {
            // Error handled via Redux toast
        } finally {
            setTaskToUnshare(null)
        }
    }

    // Metric summaries
    const receivedCount = received.length
    const sentCount = sent.length
    const totalCount = receivedCount + sentCount
    const inProgressCount = [...received, ...sent].filter(
        (i) => i.status === 'in-progress'
    ).length
    const completedCount = [...received, ...sent].filter(
        (i) => i.status === 'completed'
    ).length

    return (
        <div className="mx-auto max-w-7xl space-y-6 pb-12 text-[#181d26]">
            {/* Top Heading & Actions */}
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <h1 className="!text-lg sm:!text-xl font-semibold tracking-tight text-[#181d26] truncate">
                        Shared Tasks
                    </h1>
                    <p className="mt-0.5 !text-xs text-[#41454d] truncate hidden xs:block sm:block">
                        Collaborate on shared tasks with accepted friends ({totalCount} total collaborations).
                    </p>
                </div>

                {/* Primary Action Button */}
                <button
                    type="button"
                    onClick={() => setIsShareModalOpen(true)}
                    className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-[8px] sm:rounded-[10px] bg-[#181d26] px-3 py-1.5 sm:px-4 sm:py-2 !text-xs font-medium text-white shadow-xs transition-colors hover:bg-[#0d1218] active:bg-[#0d1218]"
                >
                    <Plus size={14} />
                    <Share2 size={13} />
                    <span>Share a Task</span>
                </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-4">
                <div className="rounded-[10px] sm:rounded-[12px] border border-[#dddddd] bg-white p-2.5 sm:p-4 shadow-xs transition-colors hover:border-[#9297a0]">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] sm:text-xs text-[#41454d] truncate">Shared with Me</span>
                        <Inbox size={14} className="text-[#181d26] shrink-0" />
                    </div>
                    <p className="mt-1 sm:mt-2 text-lg sm:text-xl font-medium tracking-tight text-[#181d26] tabular-nums">
                        {receivedCount}
                    </p>
                    <p className="mt-0.5 text-[10px] sm:text-[11px] text-[#41454d] truncate hidden sm:block">Tasks assigned to you</p>
                </div>

                <div className="rounded-[10px] sm:rounded-[12px] border border-[#dddddd] bg-white p-2.5 sm:p-4 shadow-xs transition-colors hover:border-[#9297a0]">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] sm:text-xs text-[#41454d] truncate">Shared by Me</span>
                        <Send size={14} className="text-[#181d26] shrink-0" />
                    </div>
                    <p className="mt-1 sm:mt-2 text-lg sm:text-xl font-medium tracking-tight text-[#181d26] tabular-nums">
                        {sentCount}
                    </p>
                    <p className="mt-0.5 text-[10px] sm:text-[11px] text-[#41454d] truncate hidden sm:block">Tasks sent to friends</p>
                </div>

                <div className="rounded-[10px] sm:rounded-[12px] border border-[#dddddd] bg-white p-2.5 sm:p-4 shadow-xs transition-colors hover:border-[#9297a0]">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] sm:text-xs text-[#41454d] truncate">In Progress</span>
                        <Clock size={14} className="text-[#1b61c9] shrink-0" />
                    </div>
                    <p className="mt-1 sm:mt-2 text-lg sm:text-xl font-medium tracking-tight text-[#181d26] tabular-nums">
                        {inProgressCount}
                    </p>
                    <p className="mt-0.5 text-[10px] sm:text-[11px] text-[#41454d] truncate hidden sm:block">Active collaborations</p>
                </div>

                <div className="rounded-[10px] sm:rounded-[12px] border border-[#dddddd] bg-white p-2.5 sm:p-4 shadow-xs transition-colors hover:border-[#9297a0]">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] sm:text-xs text-[#41454d] truncate">Completed</span>
                        <CheckCircle2 size={14} className="text-[#006400] shrink-0" />
                    </div>
                    <p className="mt-1 sm:mt-2 text-lg sm:text-xl font-medium tracking-tight text-[#181d26] tabular-nums">
                        {completedCount}
                    </p>
                    <p className="mt-0.5 text-[10px] sm:text-[11px] text-[#41454d] truncate hidden sm:block">Done tasks</p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-[#dddddd]">
                <nav className="flex space-x-6" aria-label="Shared task tabs">
                    {/* Tab 1: Shared with Me */}
                    <button
                        type="button"
                        onClick={() => setActiveTab('received')}
                        className={`cursor-pointer inline-flex items-center gap-2 py-2.5 px-0.5 !text-xs font-medium border-b-2 transition-colors relative ${
                            activeTab === 'received'
                                ? 'border-[#181d26] text-[#181d26]'
                                : 'border-transparent text-[#41454d] hover:text-[#181d26]'
                        }`}
                    >
                        <span>Shared with Me</span>
                        <span
                            className={`rounded-[4px] px-1.5 py-0.5 text-[10px] font-medium tabular-nums ${
                                activeTab === 'received'
                                    ? 'bg-[#181d26] text-white'
                                    : 'bg-[#e0e2e6] text-[#41454d]'
                            }`}
                        >
                            {receivedCount}
                        </span>
                    </button>

                    {/* Tab 2: Shared by Me */}
                    <button
                        type="button"
                        onClick={() => setActiveTab('sent')}
                        className={`cursor-pointer inline-flex items-center gap-2 py-2.5 px-0.5 !text-xs font-medium border-b-2 transition-colors relative ${
                            activeTab === 'sent'
                                ? 'border-[#181d26] text-[#181d26]'
                                : 'border-transparent text-[#41454d] hover:text-[#181d26]'
                        }`}
                    >
                        <span>Shared by Me</span>
                        <span
                            className={`rounded-[4px] px-1.5 py-0.5 text-[10px] font-medium tabular-nums ${
                                activeTab === 'sent'
                                    ? 'bg-[#181d26] text-white'
                                    : 'bg-[#e0e2e6] text-[#41454d]'
                            }`}
                        >
                            {sentCount}
                        </span>
                    </button>
                </nav>
            </div>

            {/* Controls Bar: Search & Status Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative flex-1 w-full max-w-md">
                    <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9297a0]"
                    />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={
                            activeTab === 'received'
                                ? 'Search by title, description, or sharer...'
                                : 'Search by title, description, or collaborator...'
                        }
                        className="h-9 w-full rounded-[8px] border border-[#dddddd] bg-white pl-9 pr-3 !text-xs text-[#181d26] placeholder:text-[#9297a0] outline-none transition-colors hover:border-[#9297a0] focus:border-[#458fff]"
                    />
                </div>

                {/* Filter Controls */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                    {/* Status Filter Dropdown / Pills */}
                    <div className="flex min-w-0 flex-1 sm:flex-initial items-center gap-0.5 sm:gap-1 overflow-x-auto rounded-[8px] border border-[#dddddd] bg-[#f8fafc] p-1">
                        {[
                            { id: 'all', label: 'All' },
                            { id: 'pending', label: 'Pending' },
                            { id: 'in-progress', label: 'In Progress' },
                            { id: 'completed', label: 'Completed' },
                        ].map((s) => (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => setStatusFilter(s.id)}
                                className={`cursor-pointer whitespace-nowrap rounded-[6px] px-2 sm:px-2.5 py-1 !text-[11px] sm:!text-xs font-medium transition-colors ${
                                    statusFilter === s.id
                                        ? 'bg-white text-[#181d26] shadow-xs border border-[#dddddd]'
                                        : 'text-[#41454d] hover:text-[#181d26]'
                                }`}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>

                    {/* Priority Selector Dropdown */}
                    <div className="relative shrink-0" ref={priorityDropdownRef}>
                        <button
                            type="button"
                            onClick={() => setIsPriorityDropdownOpen((prev) => !prev)}
                            className="cursor-pointer inline-flex items-center justify-between gap-1.5 h-[34px] rounded-[8px] border border-[#dddddd] bg-white px-2.5 !text-[11px] sm:!text-xs text-[#181d26] hover:border-[#9297a0] focus:border-[#458fff] transition-colors shadow-xs whitespace-nowrap"
                        >
                            <span>
                                {priorityOptions.find((p) => p.id === priorityFilter)?.label || 'All Priorities'}
                            </span>
                            <ChevronDown size={13} className="text-[#9297a0] shrink-0" />
                        </button>

                        {isPriorityDropdownOpen && (
                            <div className="absolute right-0 top-full mt-1.5 z-40 w-36 rounded-[8px] border border-[#dddddd] bg-white p-1 shadow-xl animate-fadeIn">
                                {priorityOptions.map((opt) => (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => {
                                            setPriorityFilter(opt.id)
                                            setIsPriorityDropdownOpen(false)
                                        }}
                                        className={`cursor-pointer flex w-full items-center justify-between rounded-[6px] px-2.5 py-1.5 !text-xs transition-colors ${
                                            priorityFilter === opt.id
                                                ? 'bg-[#f8fafc] !font-medium text-[#181d26]'
                                                : 'text-[#41454d] hover:bg-[#f8fafc] hover:text-[#181d26]'
                                        }`}
                                    >
                                        <span className="flex items-center gap-1.5">
                                            {opt.dot && <span className={`h-1.5 w-1.5 rounded-full ${opt.dot}`} />}
                                            <span>{opt.label}</span>
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="flex items-center gap-2 rounded-[8px] border border-[#aa2d00]/30 bg-[#aa2d00]/10 p-3 !text-xs text-[#aa2d00]">
                    <AlertCircle size={15} />
                    <span>{typeof error === 'string' ? error : 'Failed to load shared tasks'}</span>
                </div>
            )}

            {/* Content Area */}
            {isLoading && rawItems.length === 0 ? (
                /* Loading State */
                <div className="flex flex-col items-center justify-center py-20 text-[#41454d]">
                    <Loader2 size={24} className="animate-spin text-[#181d26]" />
                    <p className="mt-2.5 !text-xs font-normal">Loading shared tasks...</p>
                </div>
            ) : filteredItems.length === 0 ? (
                /* Clean Empty States */
                <div className="flex flex-col items-center justify-center rounded-[12px] border border-[#dddddd] bg-white py-16 px-6 text-center shadow-xs">
                    <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-[#f8fafc] border border-[#dddddd] text-[#9297a0]">
                        {activeTab === 'received' ? <Inbox size={22} /> : <Share2 size={22} />}
                    </div>

                    <h3 className="mt-3.5 !text-sm font-semibold text-[#181d26]">
                        {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                            ? 'No matching shared tasks'
                            : activeTab === 'received'
                            ? 'No tasks shared with you yet'
                            : "You haven't shared any tasks with friends"}
                    </h3>

                    <p className="mt-1 max-w-sm !text-xs text-[#41454d] leading-relaxed">
                        {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                            ? 'Try adjusting your search terms or filters.'
                            : activeTab === 'received'
                            ? 'When your accepted friends assign or share tasks with you, they will appear right here.'
                            : 'Pick any of your personal tasks and collaborate with friends in real-time.'}
                    </p>

                    {activeTab === 'sent' && !searchQuery && statusFilter === 'all' && (
                        <button
                            type="button"
                            onClick={() => setIsShareModalOpen(true)}
                            className="mt-4 inline-flex items-center gap-1.5 rounded-[8px] bg-[#181d26] px-4 py-2 !text-xs font-medium text-white hover:bg-[#0d1218] transition-colors shadow-xs cursor-pointer"
                        >
                            <Plus size={14} />
                            Share Your First Task
                        </button>
                    )}
                </div>
            ) : (
                /* Grid of Shared Task Cards */
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredItems.map((sharedTask) => {
                        const id = sharedTask._id
                        const isUpdating = updatingId === id
                        const isDeleting = deletingId === id
                        const sharedById = sharedTask?.shared_by?._id || sharedTask?.shared_by
                        const isOwner = Boolean(
                            currentUserId &&
                            sharedById &&
                            String(sharedById) === String(currentUserId)
                        )

                        return (
                            <SharedTaskCard
                                key={id}
                                sharedTask={sharedTask}
                                type={activeTab}
                                isOwner={isOwner}
                                onStatusChange={handleStatusChange}
                                onDelete={(item) => setTaskToUnshare(item)}
                                isUpdating={isUpdating}
                                isDeleting={isDeleting}
                            />
                        )
                    })}
                </div>
            )}

            {/* Share Task Modal */}
            <ShareTaskModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
            />

            {/* Unshare Confirmation Modal */}
            <UnshareConfirmModal
                isOpen={Boolean(taskToUnshare)}
                sharedTask={taskToUnshare}
                onClose={() => setTaskToUnshare(null)}
                onConfirm={handleConfirmUnshare}
                isDeleting={deletingId === taskToUnshare?._id}
            />
        </div>
    )
}
