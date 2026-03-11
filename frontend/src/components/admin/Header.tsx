"use client";

interface AdminHeaderProps {
  placeholder?: string;
  actionLabel?: string;
  actionIcon?: string;
  onAction?: () => void;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
}

export default function AdminHeader({
  placeholder = "Tìm kiếm...",
  actionLabel,
  actionIcon = "add",
  onAction,
  searchValue,
  onSearchChange,
}: AdminHeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10">
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
            search
          </span>
          <input
            className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg focus:ring-2 focus:ring-primary/50 text-sm placeholder:text-slate-500 outline-none"
            placeholder={placeholder}
            type="text"
            value={searchValue}
            onChange={
              onSearchChange ? (e) => onSearchChange(e.target.value) : undefined
            }
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-1.5 right-1.5 size-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        {actionLabel && (
          <button
            onClick={onAction}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-primary/90 transition-all"
          >
            <span className="material-symbols-outlined text-sm">
              {actionIcon}
            </span>
            {actionLabel}
          </button>
        )}
      </div>
    </header>
  );
}
