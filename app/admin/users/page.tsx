"use client";
import { useEffect, useState } from "react";
import { User, getAdminUsers, updateAdminUserRole, deleteAdminUser } from "../../lib/api";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [deleteUserName, setDeleteUserName] = useState("");
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [dark, setDark] = useState(false);

  // Filter users based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter((user) => 
        (user.username && user.username.toLowerCase().includes(query)) ||
        (user.email && user.email.toLowerCase().includes(query))
      );
      setFilteredUsers(filtered);
    }
  }, [users, searchQuery]);

  // Listen to dark mode changes
  useEffect(() => {
    const stored = typeof window !== "undefined" && localStorage.getItem("cv-dark");
    if (stored !== null) {
      setDark(stored === "1");
    } else {
      const prefers = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      setDark(prefers);
    }

    // Listen for dark mode toggle
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains("dark");
      setDark(isDark);
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setError(null);
        const data = await getAdminUsers();

        // If the API returned `null`, it likely means 401 Unauthorized from
        // our fetchJSON wrapper. Surface that to the UI.
        if (data === null) {
          setUsers([]);
          setError("Bạn cần đăng nhập với quyền quản trị để xem danh sách người dùng.");
          return;
        }

        // Normalize response shapes: API may return an array directly or an
        // object like { items: [...] }, { users: [...] }, or { data: [...] }
        let list: any[] = [];
        if (Array.isArray(data)) {
          list = data;
        } else if (Array.isArray((data as any).items)) {
          // API returns { items: [...], total, page, limit }
          list = (data as any).items;
        } else if (Array.isArray((data as any).users)) {
          list = (data as any).users;
        } else if (Array.isArray((data as any).data)) {
          // some APIs return { data: [...] }
          list = (data as any).data;
        } else {
          // In dev, log the unexpected shape to help debugging.
          if (process.env.NODE_ENV !== "production") {
            // eslint-disable-next-line no-console
            console.debug("[admin/users] unexpected getAdminUsers() response:", data);
          }
        }

        // Dev-only: log the normalized list length to quickly spot empty responses
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.debug(`[admin/users] loaded ${list.length} users`);
        }

        // Normalize each user so we always have a `role` string available
        const normalized = list.map((u: any) => {
          const roleFromRolesArray = Array.isArray(u.roles) && u.roles.length > 0 ? u.roles[0] : undefined;
          const roleFromRolesString = typeof u.roles === 'string' ? u.roles : undefined;
          const role = u.role || roleFromRolesArray || roleFromRolesString || 'user';
          return { ...u, role };
        });

        setUsers(normalized);
      } catch (err) {
        console.error("Error loading users:", err);
        setError("Không thể tải danh sách người dùng. Xem console để biết chi tiết.");
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      // Immediately update UI
      setUsers(users.map((user) => (user._id === userId ? { ...user, role: newRole } : user)));
      
      // Send update to backend
      const updated = await updateAdminUserRole(userId, newRole);
      if (updated === null) {
        throw new Error("Failed to update user role (unauthorized)");
      }

      // The API might return the updated user, so update state with the response if available
      if (updated && updated._id) {
        setUsers(users.map((user) => (user._id === userId ? { ...user, role: updated.role || newRole } : user)));
      }
    } catch (err) {
      console.error("Error updating user role:", err);
      // Reload users to revert the optimistic update on error
      const data = await getAdminUsers();
      let list: any[] = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (Array.isArray((data as any).items)) {
        list = (data as any).items;
      } else if (Array.isArray((data as any).users)) {
        list = (data as any).users;
      } else if (Array.isArray((data as any).data)) {
        list = (data as any).data;
      }
      const normalized = list.map((u: any) => {
        let roleFromRolesArray: any = undefined;
        if (Array.isArray(u.roles) && u.roles.length > 0) {
          const first = u.roles[0];
          if (typeof first === 'string') roleFromRolesArray = first;
          else if (first && typeof first === 'object') roleFromRolesArray = first.name || first.role || first.value || undefined;
        }
        const roleFromRolesString = typeof u.roles === 'string' ? u.roles : undefined;
        const role = u.role || roleFromRolesArray || roleFromRolesString || 'user';
        return { ...u, role };
      });
      setUsers(normalized);
      alert("Không thể cập nhật quyền người dùng");
    }
  };

  const handleDelete = async (userId: string) => {
    const user = users.find(u => u._id === userId);
    setDeleteUserName(user?.username || "người dùng");
    setShowDeleteConfirm(userId);
  };

  const confirmDelete = async (userId: string) => {
    setShowDeleteConfirm(null);
    setDeleteLoading(userId);
    try {
      console.log("Attempting to delete user:", userId);
      const res = await deleteAdminUser(userId);
      console.log("Delete response:", res);
      console.log("Delete response type:", typeof res);
      console.log("Delete response keys:", Object.keys(res || {}));
      
      if (res === null) {
        throw new Error("Failed to delete user (unauthorized)");
      }
      
      // Always try to reload from backend to verify deletion
      console.log("Reloading users from backend to verify deletion...");
      
      const data = await getAdminUsers();
      console.log("Reloaded users from backend:", data);
      console.log("Data structure keys:", Object.keys(data || {}));
      
      let list: any[] = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (Array.isArray((data as any).items)) {
        list = (data as any).items;
      } else if (Array.isArray((data as any).users)) {
        list = (data as any).users;
      } else if (Array.isArray((data as any).data)) {
        list = (data as any).data;
      }
      
      console.log("Extracted user list:", list);
      console.log("User count after delete:", list.length);
      console.log("Checking if deleted user still exists:", list.some((u: any) => u._id === userId));
      
      const normalized = list.map((u: any) => {
        let roleFromRolesArray: any = undefined;
        if (Array.isArray(u.roles) && u.roles.length > 0) {
          const first = u.roles[0];
          if (typeof first === 'string') roleFromRolesArray = first;
          else if (first && typeof first === 'object') roleFromRolesArray = first.name || first.role || first.value || undefined;
        }
        const roleFromRolesString = typeof u.roles === 'string' ? u.roles : undefined;
        const role = u.role || roleFromRolesArray || roleFromRolesString || 'user';
        return { ...u, role };
      });
      
      setUsers(normalized);
      
      // Check if deletion was successful
      if (normalized.some((u) => u._id === userId)) {
        alert("⚠️ Cảnh báo: Backend trả về thành công nhưng user vẫn còn trong danh sách. Vui lòng kiểm tra backend.");
      }
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("Không thể xóa người dùng: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setDeleteLoading(null);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-neutral-900 dark:text-white uppercase pb-3 border-b-4 border-red-600 inline-block">Quản lý người dùng</h1>
      {/* Search */}
      <div className="mb-4 flex items-center gap-3 w-full max-w-md">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && setSearchQuery(searchQuery)}
          placeholder="Tìm theo tên hoặc email"
          className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 px-4 py-2 text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none shadow-sm"
          style={{
            backgroundColor: dark ? '#27272a' : 'white',
            borderColor: dark ? '#404040' : 'rgb(229, 231, 235)',
            color: dark ? 'white' : 'rgb(17, 24, 39)',
          }}
        />
      </div>
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
          <thead className="bg-gray-50 dark:bg-black">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-white">
                Tên người dùng
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-white">
                Quyền
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-white">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-neutral-700 bg-white dark:bg-black">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-gray-500 dark:text-neutral-400">
                  {searchQuery ? `Không tìm thấy người dùng với từ khóa "${searchQuery}"` : (error ? "Không có quyền truy cập hoặc có lỗi." : "Không có người dùng để hiển thị.")}
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.username} className="mr-3 h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="mr-3 h-10 w-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500">{user.username?.[0]?.toUpperCase() || '?'}</div>
                      )}
                      <div className="flex flex-col">
                        <span className="font-medium text-neutral-900 dark:text-white">{user.username}</span>
                        <span className="text-xs text-neutral-500 dark:text-white">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-2">
                      <select
                        value={user.role || "user"}
                        onChange={(e) => handleRoleChange(user._id!, e.target.value)}
                        className="rounded-md border border-neutral-200 dark:border-neutral-700 px-2 py-1 text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                        style={{
                          backgroundColor: dark ? '#27272a' : 'white',
                          borderColor: dark ? '#404040' : 'rgb(229, 231, 235)',
                          color: dark ? 'white' : 'rgb(17, 24, 39)',
                        }}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="uploader">Uploader</option>
                      </select>
                      <span className="text-xs px-2 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-white">{user.role || 'user'}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleDelete(user._id!)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gradient-to-br from-red-100 to-red-50 text-red-700 text-sm font-semibold hover:from-red-200 hover:to-red-100 transition shadow-sm hover:shadow-md">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-xs rounded-xl bg-white dark:bg-black shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-5 py-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Xác nhận xóa
              </h2>
            </div>

            {/* Body */}
            <div className="px-5 py-4">
              <p className="text-neutral-700 dark:text-white text-sm">
                Bạn có chắc chắn muốn xóa người dùng <span className="font-bold text-red-600 dark:text-red-400">"{deleteUserName}"</span>?
              </p>
              <p className="text-neutral-500 dark:text-white text-xs mt-2">
                Hành động này không thể hoàn tác.
              </p>
            </div>

            {/* Footer */}
            <div className="flex gap-2 px-5 py-3 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-3 py-2 rounded-lg bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-900 dark:text-white font-medium text-sm transition-colors"
              >
                Huỷ
              </button>
              <button
                onClick={() => confirmDelete(showDeleteConfirm)}
                disabled={deleteLoading === showDeleteConfirm}
                className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-red-400 disabled:to-red-500 text-white font-medium text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {deleteLoading === showDeleteConfirm ? (
                  <>
                    <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang xóa...
                  </>
                ) : (
                  "Xóa"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}