"use client";
import { useEffect, useState } from "react";
import { getCurrentUser, updateProfile, User } from "../lib/api";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    avatar: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const data = await getCurrentUser();
      setUser(data);
      setFormData({
        username: data.username,
        email: data.email,
        avatar: data.avatar || "",
      });
    } catch (err) {
      console.error("Error loading user data:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await updateProfile(formData);
      setIsEditing(false);
      await loadUserData();
    } catch (err: any) {
      setError(err.message || "Không thể cập nhật thông tin");
    }
  };

  if (!user) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Thông tin cá nhân</h1>
      
      {error && (
        <div className="mb-4 rounded bg-red-100 p-3 text-red-600">{error}</div>
      )}

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm">Tên người dùng</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              className="w-full rounded border p-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full rounded border p-2"
              disabled
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">Avatar URL</label>
            <input
              type="text"
              value={formData.avatar}
              onChange={(e) =>
                setFormData({ ...formData, avatar: e.target.value })
              }
              className="w-full rounded border p-2"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Lưu thay đổi
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded border px-4 py-2 hover:bg-gray-100"
            >
              Hủy
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            {user.avatar && (
              <img
                src={user.avatar}
                alt={user.username}
                className="h-20 w-20 rounded-full object-cover"
              />
            )}
            <div>
              <h2 className="text-xl font-medium">{user.username}</h2>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Chỉnh sửa thông tin
          </button>
        </div>
      )}
    </div>
  );
}