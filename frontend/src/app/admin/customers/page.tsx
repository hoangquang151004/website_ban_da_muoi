"use client";
import { useState, useEffect, useCallback } from "react";
import AdminHeader from "@/components/admin/Header";
import { adminUserService, AdminUser } from "@/services/adminUserService";

export default function AdminCustomersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Filters mapped to the backend new features
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tier, setTier] = useState("");
  const [sortBy, setSortBy] = useState("joined"); // Default to newest
  
  const [page, setPage] = useState(1);
  const limit = 20;

  const [lockId, setLockId] = useState<number | null>(null);

  // Add customer state
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [addForm, setAddForm] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // reset to page 1 on new search
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [tier, sortBy]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminUserService.getUsers({
        page,
        limit,
        search: debouncedSearch || undefined,
        tier: tier || undefined,
        sort_by: sortBy || undefined,
      });
      setUsers(data.items);
      setTotal(data.total);
    } catch (error) {
      console.error("Lỗi khi tải danh sách khách hàng:", error);
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, tier, sortBy]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleStatus = async () => {
    if (lockId === null) return;
    try {
      const userToToggle = users.find((u) => u.id === lockId);
      if (!userToToggle) return;
      
      const newStatus = !userToToggle.is_active;
      await adminUserService.toggleStatus(lockId, newStatus);
      // Reload or modify state directly
      setUsers(users.map((u) => (u.id === lockId ? { ...u, is_active: newStatus } : u)));
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái khách hàng:", error);
    } finally {
      setLockId(null);
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    setIsAdding(true);
    try {
      await adminUserService.createUser(addForm);
      setShowAddModal(false);
      setAddForm({ full_name: "", email: "", password: "", phone: "", address: "" });
      fetchUsers(); // reload list
    } catch (error: any) {
      console.error(error);
      setAddError(error.response?.data?.detail || "Lỗi khi thêm khách hàng");
    } finally {
      setIsAdding(false);
    }
  };

  const getTierInfo = (spent: number) => {
    if (spent >= 20000000) return { label: "VIP", cls: "bg-amber-100 text-amber-700" };
    if (spent >= 5000000) return { label: "Thân thiết", cls: "bg-blue-100 text-blue-700" };
    return { label: "Mới", cls: "bg-slate-100 text-slate-600" };
  };

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  return (
    <div className="flex flex-col overflow-y-auto flex-1">
      <AdminHeader 
        placeholder="Tìm kiếm khách hàng, email, số điện thoại..." 
        searchValue={search}
        onSearchChange={setSearch}
      />

      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Danh sách khách hàng
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Quản lý thông tin và lịch sử mua hàng ({total} Khách hàng)
            </p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-50 transition-all"
          >
            <span className="material-symbols-outlined text-sm">
              person_add
            </span>
            Thêm khách hàng
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50">
            <span className="material-symbols-outlined text-slate-400 text-lg">
              filter_alt
            </span>
            <span className="font-medium text-slate-700">Lọc theo:</span>
          </div>
          <select 
            value={tier}
            onChange={(e) => setTier(e.target.value)}
            className="bg-slate-50 border-slate-200 rounded-lg text-sm focus:ring-primary focus:border-primary text-slate-700 py-2 px-3 outline-none"
          >
            <option value="">Tất cả hạng thành viên</option>
            <option value="VIP">Thành viên VIP</option>
            <option value="Thân thiết">Thành viên Thân thiết</option>
            <option value="Mới">Thành viên Mới</option>
          </select>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-50 border-slate-200 rounded-lg text-sm focus:ring-primary focus:border-primary text-slate-700 py-2 px-3 outline-none"
          >
            <option value="spent">Sắp xếp theo chi tiêu</option>
            <option value="joined">Sắp xếp theo ngày tham gia</option>
            <option value="name">Sắp xếp theo tên A-Z</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto min-h-[400px]">
            {loading ? (
              <div className="flex justify-center items-center h-full py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Khách hàng</th>
                    <th className="px-6 py-4">Liên hệ</th>
                    <th className="px-6 py-4 text-center">Tổng đơn</th>
                    <th className="px-6 py-4">Tổng chi tiêu</th>
                    <th className="px-6 py-4">Hạng</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((c) => {
                    const tierInfo = getTierInfo(c.total_spent);
                    return (
                      <tr
                        key={c.id}
                        className="hover:bg-slate-50 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`size-10 rounded-full flex items-center justify-center font-bold text-sm bg-indigo-100 text-indigo-600`}
                            >
                              {getInitials(c.full_name)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">
                                {c.full_name}
                              </p>
                              <p className="text-xs text-slate-400">Tham gia: {formatDate(c.created_at)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-slate-700">{c.email}</p>
                          <p className="text-xs text-slate-400">{c.phone || "N/A"}</p>
                        </td>
                        <td className="px-6 py-4 text-center text-sm font-bold text-slate-900">
                          {c.order_count}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-primary">
                          {formatCurrency(c.total_spent)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${tierInfo.cls}`}
                          >
                            {tierInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${c.is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
                          >
                            {c.is_active ? "Hoạt động" : "Bị Khóa"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              className="p-1.5 text-slate-500 hover:text-amber-500 hover:bg-amber-50 rounded-md transition-colors"
                              title={c.is_active ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                              onClick={() => setLockId(c.id)}
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                {c.is_active ? "lock" : "lock_open"}
                              </span>
                            </button>
                            <button
                              className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                              title="Xóa"
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                delete
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-slate-500">
                        Không tìm thấy khách hàng nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
          
          {/* Pagination Controls */}
          {total > limit && (
            <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-slate-50 text-sm">
              <span className="text-slate-600">
                Hiển thị {((page - 1) * limit) + 1} - {Math.min(page * limit, total)} trong {total}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1 bg-white border border-slate-200 rounded-md hover:bg-slate-100 disabled:opacity-50 transition-colors"
                >
                  Trước
                </button>
                <button
                  disabled={page * limit >= total}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1 bg-white border border-slate-200 rounded-md hover:bg-slate-100 disabled:opacity-50 transition-colors"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lock/Unlock confirm modal */}
      {lockId !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`size-12 rounded-full flex items-center justify-center ${users.find(u => u.id === lockId)?.is_active ? 'bg-amber-100' : 'bg-emerald-100'}`}>
                <span className={`material-symbols-outlined ${users.find(u => u.id === lockId)?.is_active ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {users.find(u => u.id === lockId)?.is_active ? 'lock' : 'lock_open'}
                </span>
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {users.find(u => u.id === lockId)?.is_active ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                </h2>
                <p className="text-sm text-slate-500">
                  {users.find(u => u.id === lockId)?.is_active 
                    ? 'Người dùng sẽ không thể đăng nhập' 
                    : 'Người dùng có thể đăng nhập lại'
                  }
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Bạn có chắc muốn {users.find(u => u.id === lockId)?.is_active ? 'khóa' : 'mở khóa'} tài khoản của <strong>{users.find(u => u.id === lockId)?.full_name}</strong>?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setLockId(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleToggleStatus}
                className={`px-4 py-2 text-white rounded-lg text-sm font-bold transition-colors ${users.find(u => u.id === lockId)?.is_active ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add customer modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 sticky top-0 z-10">
              <h2 className="text-lg font-bold text-slate-900">Thêm khách hàng mới</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="add-customer-form" onSubmit={handleAddCustomer} className="space-y-4">
                {addError && (
                  <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                    {addError}
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Họ tên <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={addForm.full_name}
                    onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    required
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    placeholder="nguyenvana@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu <span className="text-red-500">*</span></label>
                  <input
                    type="password"
                    required
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    placeholder="Tối thiểu 6 ký tự"
                    minLength={6}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
                  <input
                    type="tel"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    placeholder="0912345678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Địa chỉ</label>
                  <input
                    type="text"
                    value={addForm.address}
                    onChange={(e) => setAddForm({ ...addForm, address: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    placeholder="Nhập địa chỉ"
                  />
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3 sticky bottom-0 z-10">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors"
                disabled={isAdding}
              >
                Hủy
              </button>
              <button
                type="submit"
                form="add-customer-form"
                disabled={isAdding}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                {isAdding && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
                Thêm khách hàng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
