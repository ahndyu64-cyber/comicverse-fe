"use client";
import { useEffect, useState } from "react";
import { User } from "../../lib/api";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/admin/users`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to load users");
        const data = await res.json();
        setUsers(data || []);
      } catch (err) {
        console.error("Error loading users:", err);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/admin/users/${userId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: newRole }),
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error("Failed to update user role");
      
      setUsers(users.map(user => 
        user._id === userId ? { ...user, role: newRole } : user
      ));
    } catch (err) {
      console.error("Error updating user role:", err);
      alert("Không thể cập nhật quyền người dùng");
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Quản lý người dùng</h1>
      
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
            {users.map((user) => (
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
                  <button className="text-sm text-red-600 hover:underline">
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}