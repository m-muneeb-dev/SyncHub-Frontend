import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import { ListTodo, Clock, MoreHorizontal, Plus, Loader2, Trash2, AlertCircle, UserCheck } from "lucide-react";

import DatePicker from "../../components/taskComponents/DatePicker.jsx";
import TaskDropdown from "../../components/taskComponents/TaskDropdown.jsx";
import DeleteTaskModal from "../../components/taskComponents/DeleteTaskModal.jsx";
import CreateTask from "../../pages/task/CreateTask.jsx";
import EditTask from "../../pages/task/EditTask.jsx";
import ConnectFriendModal from "../../components/friendComponents/ConnectFriendModal.jsx";
import ShareTaskModal from "../../components/sharedTaskComponents/ShareTaskModal.jsx";
import { fetchFriends, deleteFriend } from "../../store/friendSlice.js";

import { fetchTasks, deleteTask } from "../../store/taskSlice.js";

export default function DashboardPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [searchQuery] = useState("");
  const [openDatePickerId, setOpenDatePickerId] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isConnectFriendOpen, setIsConnectFriendOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [taskToShare, setTaskToShare] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [friendToRemove, setFriendToRemove] = useState(null);

  // Refs for positioning dropdowns/datepickers outside overflow containers
  const dropdownBtnRefs = useRef({});
  const dateBtnRefs = useRef({});
  const [dropdownPos, setDropdownPos] = useState(null);
  const [datePickerPos, setDatePickerPos] = useState(null);

  // Redux state
  const { user } = useSelector((state) => state.auth);

  const {
    tasks,
    isLoading,
    isDeleting,
    error: taskError,
  } = useSelector((state) => state.tasks);

  const friendsState = useSelector((state) => state.friends);
  const friends = Array.isArray(friendsState?.list) ? friendsState.list : [];
  const requests = Array.isArray(friendsState?.requests)
    ? friendsState.requests
    : [];
  const status = friendsState?.status || "idle";
  const friendError = friendsState?.error || null;

  // Optimized Caching (Option B): Fetch only if not present in Redux store
  useEffect(() => {
    let taskPromise = null;
    let friendPromise = null;

    // Agar tasks pehle se Redux store mein mojood nahi hain, tabhi fetch karo
    if (tasks.length === 0) {
      taskPromise = dispatch(fetchTasks());
    }

    // Agar friends pehle se Redux store mein mojood nahi hain, tabhi fetch karo
    if (friends.length === 0) {
      friendPromise = dispatch(fetchFriends());
    }

    return () => {
      // Jab component unmount ho ya user agle page par navigate kare, pending requests cancel ho jayein
      taskPromise?.abort();
      friendPromise?.abort();
    };
  }, [dispatch]);

  const handleDeleteFriendClick = (friend) => {
    setFriendToRemove(friend);
  };

  const handleConfirmDeleteFriend = async () => {
    if (!friendToRemove) return;
    const friendId = friendToRemove._id || friendToRemove.id;
    if (!friendId) return;

    try {
      await dispatch(deleteFriend(friendId)).unwrap();
      setFriendToRemove(null);
    } catch (err) {
      console.error("Failed to remove friend:", err);
    }
  };

  // Close dropdown/datepicker on outside click
  const dropdownRef = useRef(null);
  const datePickerRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        openDropdownId &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        const clickedBtn = Object.values(dropdownBtnRefs.current).some((btn) =>
          btn?.contains(e.target),
        );
        if (!clickedBtn) {
          setOpenDropdownId(null);
          setDropdownPos(null);
        }
      }
      if (
        openDatePickerId &&
        datePickerRef.current &&
        !datePickerRef.current.contains(e.target)
      ) {
        const clickedBtn = Object.values(dateBtnRefs.current).some((btn) =>
          btn?.contains(e.target),
        );
        if (!clickedBtn) {
          setOpenDatePickerId(null);
          setDatePickerPos(null);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdownId, openDatePickerId]);

  // User information
  const userName = user?.name || "User";
  const firstName = userName.trim().split(/\s+/)[0];

  // Search tasks & limit max 5 items for dashboard view
  const filteredTasks = tasks.filter((task) =>
    task.title?.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const displayedTasks = filteredTasks.slice(0, 5);

  // Format date
  const formatDate = (date) => {
    if (!date) return "No date";

    const parsedDate = new Date(date);

    if (isNaN(parsedDate.getTime())) return date;

    return parsedDate.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  // DatePicker
  const handleDatePicker = (taskId) => {
    if (openDatePickerId === taskId) {
      setOpenDatePickerId(null);
      setDatePickerPos(null);
    } else {
      const btn = dateBtnRefs.current[taskId];
      if (btn) {
        const rect = btn.getBoundingClientRect();
        setDatePickerPos({
          top: rect.bottom + 4 + window.scrollY,
          right: window.innerWidth - rect.right,
        });
      }
      setOpenDatePickerId(taskId);
    }
    setOpenDropdownId(null);
    setDropdownPos(null);
  };

  const handleDateChange = () => {
    setOpenDatePickerId(null);
    setDatePickerPos(null);
  };

  // Task Dropdown
  const handleDropdown = (taskId) => {
    if (openDropdownId === taskId) {
      setOpenDropdownId(null);
      setDropdownPos(null);
    } else {
      const btn = dropdownBtnRefs.current[taskId];
      if (btn) {
        const rect = btn.getBoundingClientRect();
        setDropdownPos({
          top: rect.bottom + 4 + window.scrollY,
          right: window.innerWidth - rect.right,
        });
      }
      setOpenDropdownId(taskId);
    }
    setOpenDatePickerId(null);
    setDatePickerPos(null);
  };

  const handleEditTask = (task) => {
    setOpenDropdownId(null);
    setDropdownPos(null);
    setTaskToEdit(task);
  };

  const handleViewTask = (task) => {
    setOpenDropdownId(null);
    setDropdownPos(null);
    const taskId = task._id || task.id;
    if (taskId) {
      navigate(`/tasks/${taskId}`, { state: { from: "/dashboard" } });
    }
  };

  // Trigger Delete confirmation modal for task
  const handleDeleteTaskClick = (taskOrId) => {
    setOpenDropdownId(null);
    setDropdownPos(null);

    const idToFind = typeof taskOrId === "string" ? taskOrId : openDropdownId;
    const taskObj = typeof taskOrId === "object" && taskOrId !== null
      ? taskOrId
      : tasks.find((t) => (t._id || t.id) === idToFind) || { _id: idToFind, title: "Selected Task" };

    setTaskToDelete(taskObj);
  };

  // Confirm delete task
  const handleConfirmDeleteTask = async () => {
    if (!taskToDelete) return;
    const taskId = taskToDelete._id || taskToDelete.id;
    if (!taskId) return;

    try {
      await dispatch(deleteTask(taskId)).unwrap();
      setTaskToDelete(null);
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };
  
  const handleCreateTaskSubmit = () => {
    setIsCreateTaskOpen(false);
  };

  const urgentCount = tasks.filter(
    (t) => t.priority?.toLowerCase() === "high",
  ).length;
  const dueSoonCount = tasks.filter((t) => {
    const due = new Date(t.dueDate || t.date);
    const now = new Date();
    const diff = due - now;
    return diff >= 0 && diff <= 48 * 60 * 60 * 1000;
  }).length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="!text-lg sm:!text-xl font-semibold tracking-tight text-[#181d26] truncate">
            Overview
          </h1>

          <p className="mt-0.5 !text-xs text-[#41454d] truncate hidden xs:block sm:block">
            Workspace briefing for {firstName} &middot; {tasks.length} active
            tasks recorded
          </p>
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

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        <MetricCard
          label="Total tasks"
          value={String(tasks.length)}
          description="Personal tasks recorded"
          footer={`${tasks.filter((t) => t.status !== "completed").length} active tasks`}
          icon={<ListTodo size={16} className="text-[#181d26]" />}
        />

        <MetricCard
          label="High priority"
          value={String(urgentCount)}
          description="Requires immediate attention"
          descriptionClass={
            urgentCount > 0 ? "text-[#aa2d00] font-medium" : "text-[#41454d]"
          }
          footer="Urgent focus items"
          icon={
            <AlertCircle
              size={16}
              className={urgentCount > 0 ? "text-[#aa2d00]" : "text-[#9297a0]"}
            />
          }
        />

        <MetricCard
          label="Due in 48 hours"
          value={String(dueSoonCount)}
          description="Upcoming deadlines"
          descriptionClass={
            dueSoonCount > 0 ? "text-[#91650c] font-medium" : "text-[#41454d]"
          }
          footer="Time sensitive tasks"
          icon={
            <Clock
              size={16}
              className={dueSoonCount > 0 ? "text-[#d9a441]" : "text-[#9297a0]"}
            />
          }
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        {/* Tasks Table */}
        <section className="lg:col-span-2 rounded-[12px] border border-[#dddddd] bg-white shadow-xs overflow-visible">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#dddddd]">
            <div>
              <h2 className="!text-xs font-medium text-[#181d26]">
                Upcoming Tasks
              </h2>

              <p className="mt-0.5 text-[11px] text-[#41454d]">
                Sorted by due date and priority
              </p>
            </div>

            <button
              onClick={() => navigate("/tasks")}
              className="!text-xs font-medium text-[#1b61c9] hover:text-[#1a3866] whitespace-nowrap cursor-pointer transition-colors"
            >
              View all tasks ({tasks.length}) &rarr;
            </button>
          </div>

          {/* Table Container (overflow-visible on desktop so absolute popovers are never clipped) */}
          <div className="overflow-x-auto md:overflow-visible">
            <div className="min-w-[500px]">
              {/* Table Column Headings */}
              <div className="grid grid-cols-[80px_1fr_100px_100px_48px] items-center px-5 py-2.5 bg-[#f8fafc] border-b border-[#dddddd] text-[11px] font-medium text-[#41454d]">
                <div>State</div>
                <div>Task title</div>
                <div>Priority</div>
                <div>Due date</div>
                <div className="text-right">Actions</div>
              </div>

              {/* Task Rows */}
              <div className="divide-y divide-[#dddddd] overflow-visible">
                {/* Loading */}
                {isLoading && tasks.length === 0 && (
                  <div className="flex items-center justify-center gap-2 py-10 text-[#41454d]">
                    <Loader2
                      size={16}
                      className="animate-spin text-[#181d26]"
                    />
                    <span className="!text-xs">Loading tasks...</span>
                  </div>
                )}

                {/* Error */}
                {taskError && (
                  <div className="py-8 text-center !text-xs text-[#aa2d00]">
                    {taskError}
                  </div>
                )}

                {/* Empty State */}
                {!isLoading && !taskError && displayedTasks.length === 0 && (
                  <div className="py-8 text-center !text-xs text-[#41454d]">
                    No tasks recorded yet.
                  </div>
                )}

                {/* Task List (Max 5 items) */}
                {!taskError &&
                  displayedTasks.map((task) => {
                    const taskId = task._id || task.id;
                    const isRowActive =
                      openDatePickerId === taskId || openDropdownId === taskId;

                    const normalizedPriority =
                      typeof task.priority === "string"
                        ? task.priority.toLowerCase()
                        : "low";

                    const priorityConfig = {
                      high: {
                        textColor: "text-[#aa2d00]",
                        dotColor: "bg-[#aa2d00]",
                        badgeBg: "bg-[#aa2d00]/10",
                        badgeBorder: "border-[#aa2d00]/25",
                      },
                      medium: {
                        textColor: "text-[#91650c]",
                        dotColor: "bg-[#d9a441]",
                        badgeBg: "bg-[#d9a441]/15",
                        badgeBorder: "border-[#d9a441]/35",
                      },
                      low: {
                        textColor: "text-[#41454d]",
                        dotColor: "bg-[#9297a0]",
                        badgeBg: "bg-[#f8fafc]",
                        badgeBorder: "border-[#dddddd]",
                      },
                    };

                    const config =
                      priorityConfig[normalizedPriority] || priorityConfig.low;

                    const taskDateStr = task.dueDate || task.date;
                    const taskDate = new Date(taskDateStr);
                    const todayDate = new Date();

                    const isOverdue =
                      taskDate < todayDate && !isNaN(taskDate.getTime());

                    const isToday =
                      taskDate.getFullYear() === todayDate.getFullYear() &&
                      taskDate.getMonth() === todayDate.getMonth() &&
                      taskDate.getDate() === todayDate.getDate();

                    return (
                      <div
                        key={taskId}
                        className={`relative grid grid-cols-[80px_1fr_100px_100px_48px] items-center px-5 py-3 transition-colors overflow-visible ${
                          isRowActive ? "z-30" : "z-0"
                        } ${
                          isToday ? "bg-[#f8fafc]" : "hover:bg-[#f8fafc]/70"
                        }`}
                      >
                        {/* State (Default / Overdue) */}
                        <div>
                          <span
                            className={`text-[11px] font-medium ${isOverdue ? "text-[#aa2d00]" : "text-[#41454d]"}`}
                          >
                            {isOverdue ? "Overdue" : "Default"}
                          </span>
                        </div>

                        {/* Title + Description */}
                        <div className="min-w-0 pr-4">
                          <p className="!text-xs font-medium text-[#181d26] truncate">
                            {task.title}
                          </p>

                          <p className="mt-0.5 text-[11px] text-[#41454d] truncate">
                            {task.description}
                          </p>
                        </div>

                        {/* Priority Badge */}
                        <div>
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-[4px] border px-2 py-0.5 text-[11px] font-medium ${config.badgeBg} ${config.textColor} ${config.badgeBorder}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${config.dotColor}`}
                            />
                            {task.priority
                              ? task.priority.charAt(0).toUpperCase() +
                                task.priority.slice(1)
                              : "Low"}
                          </span>
                        </div>

                        {/* Date (Relative Parent + Absolute DatePicker) */}
                        <div className="relative">
                          <button
                            ref={(el) => (dateBtnRefs.current[taskId] = el)}
                            type="button"
                            onClick={() => handleDatePicker(taskId)}
                            className="cursor-pointer whitespace-nowrap !text-[11px] text-[#41454d] transition-colors hover:text-[#181d26]"
                          >
                            {formatDate(taskDateStr)}
                          </button>

                          {openDatePickerId === taskId && (
                            <div
                              ref={datePickerRef}
                              className="absolute right-0 top-full mt-1.5 z-50 w-[280px] shrink-0 bg-white rounded-[12px] border border-[#dddddd] shadow-xl p-2"
                            >
                              <DatePicker
                                value={task.dueDate || task.date}
                                onChange={(newDate) => {
                                  console.log("Selected Date:", newDate);
                                  handleDateChange();
                                }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Actions Menu (Relative Parent + Absolute Dropdown) */}
                        <div className="relative flex justify-end">
                          <button
                            ref={(el) => (dropdownBtnRefs.current[taskId] = el)}
                            type="button"
                            onClick={() => handleDropdown(taskId)}
                            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-[6px] border border-[#dddddd] bg-white text-[#41454d] transition-colors hover:bg-[#f8fafc] hover:text-[#181d26]"
                            aria-label="More actions"
                          >
                            <MoreHorizontal size={14} />
                          </button>

                          {openDropdownId === taskId && (
                            <div
                              ref={dropdownRef}
                              className="absolute right-0 top-full mt-1.5 z-50 w-max shrink-0 bg-white rounded-[12px] border border-[#dddddd] shadow-xl overflow-hidden"
                            >
                              <TaskDropdown
                                task={task}
                                onShare={() => {
                                  setOpenDropdownId(null);
                                  setDropdownPos(null);
                                  setTaskToShare(task);
                                }}
                                onEdit={() => handleEditTask(task)}
                                onView={() => handleViewTask(task)}
                                onDelete={() => handleDeleteTaskClick(task)}
                                onClose={() => {
                                  setOpenDropdownId(null);
                                  setDropdownPos(null);
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Friends & Requests */}
        <div className="space-y-4">
          <section className="rounded-[12px] border border-[#dddddd] bg-white p-5 shadow-xs">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="!text-xs font-medium text-[#181d26]">Friends</h2>

              <button
                onClick={() => navigate("/friends")}
                className="!text-xs font-medium text-[#1b61c9] hover:text-[#1a3866] cursor-pointer transition-colors"
              >
                Manage ({friends.length})
              </button>
            </div>

            {/* Loading */}
            {status === "loading" && (
              <div className="flex justify-center items-center py-6">
                <Loader2 className="animate-spin text-[#181d26]" size={18} />
              </div>
            )}

            {/* Error */}
            {status === "failed" && (
              <p className="mb-4 text-[11px] text-[#aa2d00]">
                Failed to load friends:{" "}
                {typeof friendError === "string"
                  ? friendError
                  : friendError?.message || "Something went wrong"}
              </p>
            )}

            {status === "succeeded" && (
              <>
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex -space-x-1.5 overflow-hidden">
                    {friends.slice(0, 5).map((friend) => (
                      <span
                        key={friend.id || friend.email}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium border border-[#dddddd] bg-[#f8fafc] text-[#181d26]"
                      >
                        {friend.initials || friend.name?.charAt(0) || "F"}
                      </span>
                    ))}
                  </div>

                  {friends.length > 5 && (
                    <span className="inline-flex h-5 items-center justify-center rounded-full bg-[#f8fafc] border border-[#dddddd] px-2 text-[10px] font-normal text-[#41454d]">
                      +{friends.length - 5}
                    </span>
                  )}
                </div>

                <p className="mb-3 text-[11px] text-[#41454d]">
                  {friends.length} connected friends
                </p>

                <div className="mb-4 divide-y divide-[#dddddd] max-h-56 overflow-y-auto">
                  {friends.length === 0 ? (
                    <p className="!text-xs text-[#41454d] py-2">
                      No friends connected yet.
                    </p>
                  ) : (
                    friends.map((friend) => (
                      <div
                        key={friend.id || friend.email}
                        className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0 group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] border border-[#dddddd] bg-[#f8fafc] text-[10px] font-medium text-[#181d26]">
                            {friend.initials || friend.name?.charAt(0) || "F"}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate !text-xs font-medium text-[#181d26]">
                              {friend.name}
                            </p>

                            <p className="truncate !text-[10px] text-[#41454d]">
                              {friend.email}
                            </p>
                          </div>
                        </div>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteFriendClick(friend)}
                          className="text-[#9297a0] hover:text-[#aa2d00] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-1"
                          title="Delete friend"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            <button
              type="button"
              onClick={() => setIsConnectFriendOpen(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-[8px] border border-dashed border-[#dddddd] bg-[#f8fafc] py-2 !text-xs font-medium text-[#41454d] hover:border-[#181d26] hover:text-[#181d26] hover:bg-white transition-colors cursor-pointer"
            >
              <Plus size={14} />
              Connect New Friend
            </button>
          </section>

          {/* Friend Requests Notification Card */}
          <section className="rounded-[12px] border border-[#dddddd] bg-[#f8fafc] p-4 shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <p className="!text-xs text-[#41454d]">
                {requests.length > 0 ? (
                  <>
                    You have{" "}
                    <span className="!text-sm font-medium text-[#181d26]">
                      {requests.length} pending requests
                    </span>
                  </>
                ) : (
                  <>No pending friend requests</>
                )}
              </p>

              <button
                onClick={() => navigate("/friend-requests")}
                className="shrink-0 !text-xs font-medium text-[#1b61c9] hover:text-[#1a3866] cursor-pointer transition-colors"
              >
                Review &rarr;
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Create Task Modal */}
      <CreateTask
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        onSubmit={handleCreateTaskSubmit}
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

      {/* Delete Task Confirmation Modal */}
      <DeleteTaskModal
        isOpen={Boolean(taskToDelete)}
        task={taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={handleConfirmDeleteTask}
        isDeleting={isDeleting}
      />

      {/* Remove Friend Confirmation Dialog */}
      {friendToRemove && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#181d26]/40 p-4 backdrop-blur-xs transition-opacity animate-fadeIn"
          onClick={() => setFriendToRemove(null)}
        >
          <div
            className="w-full max-w-sm rounded-[12px] border border-[#dddddd] bg-white p-6 shadow-xl transition-all text-[#181d26]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#aa2d00]/10 text-[#aa2d00] border border-[#aa2d00]/25">
              <UserCheck size={16} />
            </div>

            <h3 className="mt-3.5 !text-sm font-semibold text-[#181d26]">
              Remove Friend?
            </h3>
            <p className="mt-1 !text-xs text-[#41454d] leading-relaxed">
              Are you sure you want to remove{" "}
              <span className="font-medium text-[#181d26]">
                {friendToRemove.name || "this friend"}
              </span>{" "}
              from your friends list? You won't be able to assign tasks together
              until you reconnect.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setFriendToRemove(null)}
                className="cursor-pointer rounded-[8px] border border-[#dddddd] bg-white px-3.5 py-2 !text-xs font-medium text-[#181d26] hover:bg-[#f8fafc] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteFriend}
                className="cursor-pointer rounded-[8px] bg-[#aa2d00] px-3.5 py-2 !text-xs font-medium text-white hover:bg-[#8f2500] transition-colors shadow-xs"
              >
                Remove Friend
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connect Friend Modal */}
      <ConnectFriendModal
        isOpen={isConnectFriendOpen}
        onClose={() => setIsConnectFriendOpen(false)}
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

// Metric Card per Airtable Editorial Light Specs
function MetricCard({
  label,
  value,
  description,
  descriptionClass = "text-[#41454d]",
  footer,
  icon,
}) {
  return (
    <div className="flex flex-col justify-between rounded-[10px] sm:rounded-[12px] border border-[#dddddd] bg-white p-2.5 sm:p-5 shadow-xs transition-colors hover:border-[#9297a0]">
      <div>
        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] sm:text-xs font-normal text-[#41454d] truncate">
            {label}
          </span>
          {icon && <span className="shrink-0">{icon}</span>}
        </div>

        <p className="mt-1 sm:mt-2 text-lg sm:text-2xl font-semibold tracking-tight text-[#181d26] tabular-nums">
          {value}
        </p>

        <p
          className={`mt-0.5 text-[10px] sm:text-xs truncate ${descriptionClass}`}
        >
          {description}
        </p>
      </div>

      {footer && (
        <div className="mt-2 sm:mt-4 hidden sm:flex items-center justify-between border-t border-[#dddddd] pt-2 sm:pt-3">
          <span className="text-[11px] font-normal text-[#41454d] truncate">
            {footer}
          </span>
        </div>
      )}
    </div>
  );
}