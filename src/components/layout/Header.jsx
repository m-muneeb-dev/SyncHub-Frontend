import { Search, Bell, Menu } from 'lucide-react'
import BrandLogo from '../common/BrandLogo'

export default function Header({
    title = 'Overview',
    searchValue = '',
    onSearch,
    onNotifications,
    onProfileClick,
    onMenuClick,
    userInitial = 'U',
}) {
    return (
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b border-[#dddddd] bg-white/95 backdrop-blur-md px-3.5 sm:px-6">

            {/* Left section: Hamburger button + (Mobile: Logo & Logo Name / Desktop: Title) */}
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <button
                    type="button"
                    onClick={onMenuClick}
                    aria-label="Open sidebar"
                    className="cursor-pointer flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border border-[#dddddd] bg-white text-[#41454d] shadow-xs hover:text-[#181d26] hover:bg-[#f8fafc] md:hidden transition-colors"
                >
                    <Menu size={16} />
                </button>

                {/* Mobile: Logo and Logo Name */}
                <div className="flex items-center md:hidden">
                    <BrandLogo size="sm" />
                </div>

                {/* Desktop: Current folder / page title */}
                <h2 className="hidden md:block !text-sm !font-semibold !tracking-tight !text-[#181d26] truncate">
                    {title}
                </h2>
            </div>

            {/* Right section: Search (desktop), notifications, profile */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                <div className="relative hidden sm:block">
                    <Search
                        size={14}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 !text-[#9297a0]"
                    />

                    <input
                        type="text"
                        value={searchValue}
                        onChange={(e) => onSearch?.(e.target.value)}
                        placeholder="Search..."
                        className="h-8 w-40 sm:w-48 rounded-[6px] border border-[#dddddd] bg-[#f8fafc] pl-8 pr-2.5 !text-xs !text-[#181d26] placeholder:!text-[#9297a0] outline-none transition-colors hover:border-[#9297a0] focus:border-[#458fff] focus:bg-white"
                    />
                </div>

                <button
                    type="button"
                    onClick={onNotifications}
                    className="cursor-pointer rounded-[6px] p-2 !text-[#41454d] transition hover:bg-[#f8fafc] hover:!text-[#181d26]"
                    aria-label="Notifications"
                >
                    <Bell size={16} />
                </button>

                <button
                    type="button"
                    onClick={onProfileClick}
                    className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-full bg-[#f8fafc] border border-[#dddddd] !text-xs !font-medium !text-[#181d26] transition hover:border-[#9297a0] hover:bg-[#e0e2e6]"
                    aria-label="User profile"
                >
                    {userInitial}
                </button>

            </div>
        </header>
    )
}
