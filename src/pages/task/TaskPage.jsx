import { useState, useEffect, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchTasks, deleteTask } from '../../store/taskSlice';
import DatePicker from '../../components/taskComponents/DatePicker';
import DeleteTaskModal from '../../components/taskComponents/DeleteTaskModal';
import TaskDropdown from '../../components/taskComponents/TaskDropdown';
import CreateTask from './CreateTask';
import EditTask from './EditTask';
import ShareTaskModal from '../../components/sharedTaskComponents/ShareTaskModal';
import {
    Search,
    SlidersHorizontal,
    Plus,
    MoreHorizontal,
    Loader2,
    Calendar as CalendarIcon
} from 'lucide-react';

export default function TaskPage() {
    const dispatch = useDispatch();
    const { tasks, isLoading, isDeleting, error } = useSelector((state) => state.tasks);

    const [activeTab, setActiveTab] = useState('All Tasks');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const tasksPerPage = 6;

    // Filter states
    const [selectedDateFilter, setSelectedDateFilter] = useState(null);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

    // Inline Task Row Date Picker state
    const [activeDateTaskId, setActiveDateTaskId] = useState(null);

    // Modal & Dropdown states
    const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
    const [taskToEdit, setTaskToEdit] = useState(null);
    const [taskToDelete, setTaskToDelete] = useState(null);
    const [taskToShare, setTaskToShare] = useState(null);
    const [activeDropdownId, setActiveDropdownId] = useState(null);

    const navigate = useNavigate();
    const dropdownRef = useRef(null);
    const datePickerRef = useRef(null);
    const inlineDatePickerRef = useRef(null);

    // Optimized Caching (Option B): Fetch only if tasks not already in Redux
    useEffect(() => {
        let promise = null;
        if (tasks.length === 0) {
            promise = dispatch(fetchTasks());
        }
        return () => {
            promise?.abort();
        };
    }, [dispatch]);

    // Close popups on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setActiveDropdownId(null);
            }
            if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
                setIsDatePickerOpen(false);
            }
            if (inlineDatePickerRef.current && !inlineDatePickerRef.current.contains(event.target)) {
                setActiveDateTaskId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const tabs = ['All Tasks', 'High Priority', 'Medium Priority', 'Low Priority'];

    // Date formatting helper
    const formatDate = (date) => {
        if (!date) return 'No date';
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) return date;
        return parsedDate.toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
        });
    };

    const getPriorityBadge = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'high':
                return 'bg-[#aa2d00]/10 text-[#aa2d00] border border-[#aa2d00]/25';
            case 'medium':
                return 'bg-[#d9a441]/15 text-[#91650c] border border-[#d9a441]/35';
            case 'low':
                return 'bg-[#f8fafc] text-[#41454d] border border-[#dddddd]';
            default:
                return 'bg-[#f8fafc] text-[#41454d] border border-[#dddddd]';
        }
    };

    const getPriorityDot = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'high':
                return 'bg-[#aa2d00]';
            case 'medium':
                return 'bg-[#d9a441]';
            case 'low':
                return 'bg-[#9297a0]';
            default:
                return 'bg-[#9297a0]';
        }
    };

    // Filter tasks based on tabs, search, and date picker
    const filteredTasks = useMemo(() => {
        return tasks.filter((task) => {
            const matchesSearch = task.title?.toLowerCase().includes(searchQuery.toLowerCase());

            let matchesTab = true;
            if (activeTab === 'High Priority') matchesTab = task.priority?.toLowerCase() === 'high';
            if (activeTab === 'Medium Priority') matchesTab = task.priority?.toLowerCase() === 'medium';
            if (activeTab === 'Low Priority') matchesTab = task.priority?.toLowerCase() === 'low';

            let matchesDate = true;
            if (selectedDateFilter && task.dueDate) {
                const taskDate = new Date(task.dueDate);
                matchesDate =
                    taskDate.getFullYear() === selectedDateFilter.getFullYear() &&
                    taskDate.getMonth() === selectedDateFilter.getMonth() &&
                    taskDate.getDate() === selectedDateFilter.getDate();
            }

            return matchesSearch && matchesTab && matchesDate;
        });
    }, [tasks, searchQuery, activeTab, selectedDateFilter]);

    const indexOfLastTask = currentPage * tasksPerPage;
    const indexOfFirstTask = indexOfLastTask - tasksPerPage;
    const currentTasks = filteredTasks.slice(indexOfFirstTask, indexOfLastTask);
    const totalPages = Math.ceil(filteredTasks.length / tasksPerPage) || 1;

    const handleConfirmDelete = async () => {
        if (!taskToDelete) return;
        const taskId = taskToDelete._id || taskToDelete.id;
        if (!taskId) return;
        try {
            await dispatch(deleteTask(taskId)).unwrap();
            setTaskToDelete(null);
        } catch (err) {
            console.error('Failed to delete task:', err);
        }
    };

    return (
        <div className="min-h-screen text-[#181d26] font-sans relative">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header Section */}
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <h1 className="!text-lg sm:!text-xl font-semibold tracking-tight text-[#181d26] truncate">My Tasks</h1>
                        <p className="!text-xs text-[#41454d] mt-0.5 truncate hidden xs:block sm:block">{tasks.length} active personal tasks recorded</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsCreateTaskOpen(true)}
                        className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-[8px] sm:rounded-[10px] bg-[#181d26] px-3 py-1.5 sm:px-4 sm:py-2 !text-xs font-medium text-white transition hover:bg-[#0d1218] active:bg-[#0d1218] shadow-xs"
                    >
                        <Plus size={14} />
                        <span>Create Task</span>
                    </button>
                </div>

                {/* Tabs Navigation */}
                <div className="border-b border-[#dddddd]">
                    <nav className="flex space-x-6" aria-label="Tabs">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab;
                            return (
                                <button
                                    key={tab}
                                    onClick={() => {
                                        setActiveTab(tab);
                                        setCurrentPage(1);
                                    }}
                                    className={`py-2.5 px-0.5 !text-xs font-medium border-b-2 transition-colors relative cursor-pointer ${isActive
                                            ? 'border-[#181d26] text-[#181d26]'
                                            : 'border-transparent text-[#41454d] hover:text-[#181d26]'
                                        }`}
                                >
                                    {tab}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Controls Bar */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9297a0]" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder="Filter by title..."
                            className="w-full pl-9 pr-3.5 py-2 bg-white border border-[#dddddd] rounded-[8px] !text-xs text-[#181d26] placeholder:text-[#9297a0] focus:outline-none focus:border-[#458fff] transition-colors"
                        />
                    </div>
                    <div className="flex items-center gap-2.5 w-full sm:w-auto relative">
                        <button className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-white border border-[#dddddd] rounded-[8px] !text-xs font-medium text-[#41454d] hover:text-[#181d26] hover:bg-[#f8fafc] transition-colors cursor-pointer">
                            <SlidersHorizontal className="w-3.5 h-3.5 text-[#41454d]" />
                            Filters
                        </button>

                        {/* Top DatePicker Filter Trigger */}
                        <div className="relative" ref={datePickerRef}>
                            <button
                                onClick={() => setIsDatePickerOpen((prev) => !prev)}
                                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-[8px] !text-xs font-medium transition-colors cursor-pointer ${selectedDateFilter
                                        ? 'border border-[#181d26] text-[#181d26] bg-[#f8fafc]'
                                        : 'border border-[#dddddd] bg-white text-[#41454d] hover:text-[#181d26] hover:bg-[#f8fafc]'
                                    }`}
                            >
                                <CalendarIcon className="w-3.5 h-3.5 text-[#41454d]" />
                                {selectedDateFilter ? formatDate(selectedDateFilter) : 'Due date'}
                            </button>

                            {isDatePickerOpen && (
                                <div className="absolute right-0 top-full mt-2 z-50 shadow-xl">
                                    <DatePicker
                                        value={selectedDateFilter}
                                        onChange={(date) => {
                                            setSelectedDateFilter(date);
                                            setIsDatePickerOpen(false);
                                            setCurrentPage(1);
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Error State */}
                {error && (
                    <div className="p-3 bg-[#aa2d00]/10 border border-[#aa2d00]/30 rounded-[8px] !text-xs text-[#aa2d00]">
                        {error}
                    </div>
                )}

                {/* Task Table Container */}
                <div className="bg-white border border-[#dddddd] rounded-[12px] shadow-xs overflow-visible">
                    <div className="overflow-x-auto md:overflow-visible">
                        <div className="min-w-[500px]">
                            {/* Column Headings */}
                            <div className="grid grid-cols-[80px_1fr_100px_100px_48px] items-center px-5 py-2.5 bg-[#f8fafc] border-b border-[#dddddd] rounded-t-[12px] text-[11px] font-medium text-[#41454d]">
                                <div>State</div>
                                <div>Task title & description</div>
                                <div>Priority</div>
                                <div>Due date</div>
                                <div className="text-right">Actions</div>
                            </div>

                            {/* Task Rows */}
                            <div className="divide-y divide-[#dddddd] overflow-visible">
                                {isLoading ? (
                                    <div className="flex items-center justify-center gap-2 py-12 text-[#41454d]">
                                        <Loader2 size={16} className="animate-spin text-[#181d26]" />
                                        <span className="!text-xs">Loading tasks...</span>
                                    </div>
                                ) : currentTasks.length === 0 ? (
                                    <div className="py-12 text-center !text-xs text-[#41454d]">
                                        No tasks found.
                                    </div>
                                ) : (
                                    currentTasks.map((task) => {
                                        const taskId = task._id;
                                        const isMenuOpen = activeDropdownId === taskId;
                                        const isInlineDateOpen = activeDateTaskId === taskId;
                                        const isRowActive = isMenuOpen || isInlineDateOpen;
                                        const formattedDueDate = formatDate(task.dueDate);

                                        return (
                                            <div
                                                key={taskId}
                                                className={`relative grid grid-cols-[80px_1fr_100px_100px_48px] items-center px-5 py-3 transition-colors overflow-visible hover:bg-[#f8fafc]/70 cursor-pointer ${
                                                    isRowActive ? 'z-30' : 'z-0'
                                                }`}
                                            >
                                                {/* Status Column */}
                                                <div>
                                                    <span className={`text-[11px] font-medium ${task.status === 'Overdue' ? 'text-[#aa2d00]' : 'text-[#41454d]'}`}>
                                                        {task.status || 'Default'}
                                                    </span>
                                                </div>

                                                {/* Title & Description Column */}
                                                <div className="min-w-0 pr-4">
                                                    <p className="!text-xs font-medium text-[#181d26] truncate">{task.title}</p>
                                                    <p className="mt-0.5 text-[11px] text-[#41454d] truncate">{task.description}</p>
                                                </div>

                                                {/* Priority Column */}
                                                <div>
                                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[11px] font-medium ${getPriorityBadge(task.priority)}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${getPriorityDot(task.priority)}`}></span>
                                                        {task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'Low'}
                                                    </span>
                                                </div>

                                                {/* Due Date Column (Relative Parent + Absolute DatePicker) */}
                                                <div className="relative overflow-visible">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveDateTaskId(isInlineDateOpen ? null : taskId);
                                                        }}
                                                        className="cursor-pointer whitespace-nowrap !text-[11px] text-[#41454d] transition-colors hover:text-[#181d26]"
                                                    >
                                                        {task.isOverdue ? (
                                                            <span className="text-[#aa2d00] font-medium">{formattedDueDate}</span>
                                                        ) : (
                                                            <span>{formattedDueDate}</span>
                                                        )}
                                                    </button>

                                                    {/* DatePicker */}
                                                    {isInlineDateOpen && (
                                                        <>
                                                            <div
                                                                className="fixed inset-0 z-40 bg-[#181d26]/30 backdrop-blur-xs sm:hidden"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setActiveDateTaskId(null);
                                                                }}
                                                            />
                                                            <div
                                                                ref={inlineDatePickerRef}
                                                                className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 flex justify-center sm:absolute sm:inset-auto sm:translate-y-0 sm:right-0 sm:top-full sm:mt-1.5 sm:w-[280px] sm:bg-white sm:rounded-[12px] sm:border sm:border-[#dddddd] sm:shadow-xl sm:p-2"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <DatePicker
                                                                    value={task.dueDate}
                                                                    onChange={() => {
                                                                        setActiveDateTaskId(null);
                                                                    }}
                                                                />
                                                            </div>
                                                        </>
                                                    )}
                                                </div>

                                                {/* Actions Column (Relative Parent + Absolute Dropdown) */}
                                                <div className="relative flex justify-end overflow-visible">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveDropdownId(isMenuOpen ? null : taskId);
                                                        }}
                                                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-[6px] border border-[#dddddd] bg-white text-[#41454d] transition-colors hover:bg-[#f8fafc] hover:text-[#181d26]"
                                                        aria-label="More actions"
                                                    >
                                                        <MoreHorizontal size={14} />
                                                    </button>

                                                    {isMenuOpen && (
                                                        <div
                                                            ref={dropdownRef}
                                                            className="absolute right-0 top-full mt-1.5 z-50 w-max shrink-0 bg-white rounded-[12px] border border-[#dddddd] shadow-xl overflow-hidden"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <TaskDropdown
                                                                onShare={() => {
                                                                    setActiveDropdownId(null);
                                                                    setTaskToShare(task);
                                                                }}
                                                                onEdit={() => {
                                                                    setActiveDropdownId(null);
                                                                    setTaskToEdit(task);
                                                                }}
                                                                onView={() => {
                                                                    setActiveDropdownId(null);
                                                                    const taskId = task._id || task.id;
                                                                    if (taskId) {
                                                                        navigate(`/tasks/${taskId}`, { state: { from: '/tasks' } });
                                                                    }
                                                                }}
                                                                onDelete={() => {
                                                                    setActiveDropdownId(null);
                                                                    setTaskToDelete(task);
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Pagination Footer */}
                    <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3 border-t border-[#dddddd] rounded-b-[12px] bg-white gap-3">
                        <p className="!text-xs text-[#41454d]">
                            Showing <span className="font-medium text-[#181d26]">{filteredTasks.length > 0 ? indexOfFirstTask + 1 : 0}&ndash;{Math.min(indexOfLastTask, filteredTasks.length)}</span> of <span className="font-medium text-[#181d26]">{filteredTasks.length}</span> tasks
                        </p>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 !text-xs font-normal text-[#41454d] bg-white border border-[#dddddd] rounded-[6px] hover:text-[#181d26] hover:bg-[#f8fafc] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            >
                                Previous
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-7 h-7 !text-xs font-medium rounded-[6px] transition-colors cursor-pointer ${currentPage === page
                                            ? 'bg-[#181d26] text-white shadow-xs'
                                            : 'text-[#41454d] hover:bg-[#f8fafc] hover:text-[#181d26]'
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="px-3 py-1.5 !text-xs font-normal text-[#41454d] bg-white border border-[#dddddd] rounded-[6px] hover:text-[#181d26] hover:bg-[#f8fafc] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>

            </div>

            {/* Create Task Modal */}
            <CreateTask
                isOpen={isCreateTaskOpen}
                onClose={() => setIsCreateTaskOpen(false)}
            />

            {/* Edit Task Modal */}
            <EditTask
                isOpen={Boolean(taskToEdit)}
                task={taskToEdit}
                onClose={() => setTaskToEdit(null)}
                onDelete={(task) => {
                    setTaskToEdit(null);
                    setTaskToDelete(task);
                }}
            />

            {/* Integrated Delete Confirmation Modal */}
            <DeleteTaskModal
                isOpen={Boolean(taskToDelete)}
                task={taskToDelete}
                onClose={() => setTaskToDelete(null)}
                onConfirm={handleConfirmDelete}
                isDeleting={isDeleting}
            />

            {/* Share Task Modal */}
            <ShareTaskModal
                isOpen={Boolean(taskToShare)}
                preselectedTask={taskToShare}
                onClose={() => setTaskToShare(null)}
            />
        </div>
    );
}