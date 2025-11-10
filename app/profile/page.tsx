"use client";
import { useEffect, useState } from "react";
import { getCurrentUser, updateProfile, User } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    avatar: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { user: authUser } = useAuth();

  useEffect(() => {
    // If we already have an auth user from context, prefill immediately
    if (authUser) {
      setUser(authUser as unknown as User);
      setFormData({ username: authUser.username || "", email: authUser.email || "", avatar: (authUser as any).avatar || "" });
    }

    loadUserData();
  }, [authUser]);

  const loadUserData = async () => {
    try {
      const data = await getCurrentUser();
      // If API returned null (401), don't treat as an exception here — fallback below
      if (!data) {
        if (authUser) {
          setUser(authUser as unknown as User);
          setFormData({ username: authUser.username || "", email: authUser.email || "", avatar: (authUser as any).avatar || "" });
        }
        return;
      }
      setUser(data);
      setFormData({
        username: data.username,
        email: data.email,
        avatar: data.avatar || "",
      });
    } catch (err) {
      // If API fails (401), fall back to client-side auth user if available
      // eslint-disable-next-line no-console
      console.error("Error loading user data:", err);
      if (authUser) {
        setUser(authUser as unknown as User);
        setFormData({ username: authUser.username || "", email: authUser.email || "", avatar: (authUser as any).avatar || "" });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await updateProfile(formData);
      setIsEditing(false);
      await loadUserData();
      setSuccess("Cập nhật thành công.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Không thể cập nhật thông tin");
    }
  };

  if (!user) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="relative rounded-lg overflow-hidden shadow">
        <div className="h-40 w-full bg-gradient-to-r from-sky-400 to-indigo-600" />
        <div className="-mt-10 flex items-end justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-lg"
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-neutral-100 text-2xl font-semibold text-neutral-800 shadow-lg">
                  {user?.username?.slice(0,1).toUpperCase()}
                </div>
              )}
            </div>
            <div className="text-white drop-shadow">
              <h1 className="text-2xl font-bold leading-tight">{user?.username}</h1>
              <p className="text-sm opacity-90">{user?.email}</p>
            </div>
          </div>
          <div className="pb-3">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="rounded-md bg-white/90 px-4 py-2 text-sm font-medium text-neutral-900 hover:brightness-95"
              >
                Chỉnh sửa
              </button>
            ) : null}
          </div>
        </div>

        <div className="bg-white p-6">
          {error && <div className="mb-4 rounded bg-red-50 p-3 text-red-600">{error}</div>}
          {success && <div className="mb-4 rounded bg-green-50 p-3 text-green-700">{success}</div>}

          {!isEditing ? (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Hồ sơ của tôi</h2>
              <p className="text-neutral-700">Đây là trang thông tin cá nhân. Bạn có thể cập nhật tên hiển thị và avatar.</p>

              <div className="mt-4 rounded-md border bg-neutral-50 p-4">
                <h3 className="mb-2 text-sm font-medium text-neutral-800">Thông tin chi tiết</h3>
                <div className="grid grid-cols-1 gap-2 text-sm text-neutral-700 md:grid-cols-1">
                  <div className="flex items-start gap-2">
                    <div className="w-32 text-neutral-500">Tên</div>
                    <div className="font-medium">{user?.username || "-"}</div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-32 text-neutral-500">Email</div>
                    <div className="font-medium">{user?.email || "-"}</div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-32 text-neutral-500">Tham gia</div>
                    <div className="font-medium">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-neutral-700">Tên người dùng</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full rounded border px-3 py-2 outline-none focus:ring-2 focus:ring-sky-300"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-neutral-700">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded border px-3 py-2 bg-neutral-50"
                    disabled
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">Avatar URL</label>
                <input
                  type="text"
                  value={formData.avatar}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                  className="w-full rounded border px-3 py-2 outline-none focus:ring-2 focus:ring-sky-300"
                />
                <p className="mt-2 text-xs text-neutral-500">Dán URL ảnh avatar (hỗ trợ hình vuông). Ví dụ: https://.../avatar.jpg</p>
              </div>

              <div className="flex gap-2">
                <button type="submit" className="rounded bg-sky-600 px-4 py-2 text-white hover:bg-sky-700">Lưu thay đổi</button>
                <button type="button" onClick={() => { setIsEditing(false); setError(""); }} className="rounded border px-4 py-2 hover:bg-gray-50">Hủy</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}