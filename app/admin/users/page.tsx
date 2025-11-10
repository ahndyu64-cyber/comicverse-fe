"use client";
import { useEffect, useState } from "react";
import { User, getAdminUsers, updateAdminUserRole, deleteAdminUser } from "../../lib/api";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        // object like { users: [...] } depending on backend implementation.
        let list: any[] = [];
        if (Array.isArray(data)) {
          list = data;
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

        setUsers(list);
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
      const updated = await updateAdminUserRole(userId, newRole);
      if (updated === null) throw new Error("Failed to update user role (unauthorized)");

      setUsers(users.map((user) => (user._id === userId ? { ...user, role: newRole } : user)));
    } catch (err) {
      console.error("Error updating user role:", err);
      alert("Không thể cập nhật quyền người dùng");
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Bạn có chắc muốn xóa người dùng này?")) return;
    try {
      const res = await deleteAdminUser(userId);
      if (res === null) throw new Error("Failed to delete user (unauthorized)");
      setUsers(users.filter((u) => u._id !== userId));
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("Không thể xóa người dùng");
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Quản lý người dùng</h1>
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
                Email
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
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  {error ? "Không có quyền truy cập hoặc có lỗi." : "Không có người dùng để hiển thị."}
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user._id}>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      {user.avatar && (
                        <img
                          src={user.avatar}
                          alt={user.username}
                          className="mr-3 h-8 w-8 rounded-full"
                        />
                      )}
                      {user.username}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">{user.email}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <select
                      value={user.role || "user"}
                      onChange={(e) => handleRoleChange(user._id!, e.target.value)}
                      className="rounded border p-1"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="moderator">Moderator</option>
                    </select>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <button onClick={() => handleDelete(user._id!)} className="text-sm text-red-600 hover:underline">
                      Xóa
                    </button>
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