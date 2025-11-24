"use client";
import { useEffect, useState } from "react";
import { User, getAdminUsers, updateAdminUserRole, deleteAdminUser } from "../../lib/api";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

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
    if (!confirm("Bạn có chắc muốn xóa người dùng này?")) return;
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
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Quản lý người dùng</h1>
      {/* Search */}
      <div className="mb-4 flex items-center gap-3 w-full max-w-md">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && setSearchQuery(searchQuery)}
          placeholder="Tìm theo tên hoặc email"
          className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 px-4 py-2 text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none shadow-sm"
        />
      </div>
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Tên người dùng
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Quyền
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
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
                        <span className="font-medium text-neutral-900">{user.username}</span>
                        <span className="text-xs text-neutral-500">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-2">
                      <select
                        value={user.role || "user"}
                        onChange={(e) => handleRoleChange(user._id!, e.target.value)}
                        className="rounded-md border border-neutral-200 dark:border-neutral-700 px-2 py-1 text-sm bg-white dark:bg-neutral-800 text-neutral-900"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="uploader">Uploader</option>
                      </select>
                      <span className="text-xs px-2 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">{user.role || 'user'}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleDelete(user._id!)} className="px-3 py-1 rounded-md bg-red-100 text-red-700 text-sm hover:bg-red-200 transition">
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
    </div>
  );
}