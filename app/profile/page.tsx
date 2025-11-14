"use client";
import { useEffect, useState } from "react";
import { getCurrentUser, updateProfile, User } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { uploadProfileAvatar, validateImageFile } from "../lib/cloudinary";

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
  const [isUploading, setIsUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>("");

  const { user: authUser, refreshUser } = useAuth();

  useEffect(() => {
    // If we already have an auth user from context, prefill immediately
    if (authUser) {
      const av = (authUser as any).avatar;
      const avUrl = av && typeof av === "object" ? (av.secure_url || av.url || "") : (av || "");
      setUser(authUser as unknown as User);
      setFormData({ username: authUser.username || "", email: authUser.email || "", avatar: avUrl });
    }

    loadUserData();
  }, [authUser]);

  // Helper to extract avatar URL from various response formats
  const extractAvatarUrl = (avatarVal: any): string => {
    if (!avatarVal) return "";
    if (typeof avatarVal === "string") return avatarVal;
    if (typeof avatarVal === "object") {
      // Try common response formats: secure_url, url, data.secure_url, data.url
      return avatarVal.secure_url || avatarVal.url || avatarVal.data?.secure_url || avatarVal.data?.url || "";
    }
    return "";
  };

  const loadUserData = async () => {
    try {
      const data = await getCurrentUser();
      console.log("[profile] getCurrentUser response:", data);

      // If API returned null (401), don't treat as an exception here — fallback below
      if (!data) {
        if (authUser) {
          const av = (authUser as any).avatar;
          const avUrl = extractAvatarUrl(av);
          setUser(authUser as unknown as User);
          setFormData({ username: authUser.username || "", email: authUser.email || "", avatar: avUrl });
        }
        return;
      }

      // Normalize common API response shapes: some backends return { data: user } or { user: user }
      const userObj = (data as any).data || (data as any).user || data;
      console.log("[profile] normalized user object:", userObj);

      // Support avatar being either a string URL or an object returned by some backends
      const avatarVal = (userObj as any).avatar;
      const avatarUrl = extractAvatarUrl(avatarVal);
      console.log("[profile] avatar extraction:", { raw: avatarVal, extracted: avatarUrl });

      setUser({ ...userObj, avatar: avatarUrl } as User);
      setFormData({
        username: userObj.username || "",
        email: userObj.email || "",
        avatar: avatarUrl,
      });
    } catch (err) {
      // If API fails (401), fall back to client-side auth user if available
      // eslint-disable-next-line no-console
      console.error("Error loading user data:", err);
      if (authUser) {
        const av = (authUser as any).avatar;
        const avUrl = extractAvatarUrl(av);
        setUser(authUser as unknown as User);
        setFormData({ username: authUser.username || "", email: authUser.email || "", avatar: avUrl });
      }
    }
  };

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file, 5);
    if (!validation.valid) {
      setError(validation.error || "File không hợp lệ");
      return;
    }

    setIsUploading(true);
    setError("");
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        setError("Bạn cần đăng nhập để tải avatar. Vui lòng đăng nhập lại.");
        setIsUploading(false);
        return;
      }
      
      const result = await uploadProfileAvatar(file, token ?? undefined);
      const imageUrl = result.secure_url || result.url;
      console.log("[profile] uploadProfileAvatar success:", { result, extractedUrl: imageUrl });
      setFormData({ ...formData, avatar: imageUrl });
      setAvatarPreview(imageUrl);
      setSuccess("Avatar được tải lên thành công. Nhấn 'Lưu thay đổi' để hoàn tất.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      const errMsg = err.message || "Không thể tải ảnh avatar";
      setError(errMsg);
      // If 401, suggest re-login
      if (err.message?.includes('Unauthorized')) {
        setError(errMsg + " — Vui lòng đăng nhập lại.");
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      console.log("[profile] updateProfile payload:", formData);
      const updateResult = await updateProfile(formData);
      console.log("[profile] updateProfile response:", updateResult);
      console.log("[profile] updateProfile success");
      setIsEditing(false);
      setAvatarPreview("");
      
      // Workaround: Persist avatar to localStorage since backend may not save it
      if (formData.avatar && typeof window !== "undefined") {
        try {
          const userFromStorage = localStorage.getItem("user");
          if (userFromStorage) {
            const userObj = JSON.parse(userFromStorage);
            userObj.avatar = formData.avatar;
            localStorage.setItem("user", JSON.stringify(userObj));
            console.log("[profile] avatar persisted to localStorage:", formData.avatar);
          }
        } catch (e) {
          console.debug("Could not persist avatar to localStorage:", e);
        }
      }
      
      // Update user state immediately with the new data
      setUser({ ...user, avatar: formData.avatar } as User);
      console.log("[profile] user state updated to:", { ...user, avatar: formData.avatar });
      // Refresh server-side and auth context data to keep everything in sync
      await loadUserData();
      try {
        if (typeof refreshUser === "function") await refreshUser();
      } catch (e) {
        // ignore refresh errors — loadUserData already updated the page state
        console.debug("Auth refresh failed:", e);
      }
      setSuccess("Cập nhật thành công.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error("[profile] updateProfile error:", err);
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
                <label className="mb-1 block text-sm font-medium text-neutral-700">Avatar</label>
                <div className="flex items-center gap-3">
                  {avatarPreview || formData.avatar ? (
                    <img
                      src={avatarPreview || formData.avatar}
                      alt="Preview"
                      className="h-16 w-16 rounded object-cover"
                    />
                  ) : null}
                  <div className="flex-1">
                    <input
                      id="avatar-file"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileSelect}
                      disabled={isUploading}
                      className="hidden"
                    />
                    <label
                      htmlFor="avatar-file"
                      className="inline-block cursor-pointer rounded bg-sky-100 px-3 py-2 text-sm font-medium text-sky-700 hover:bg-sky-200 disabled:opacity-50"
                    >
                      {isUploading ? "Đang tải..." : "Chọn ảnh"}
                    </label>
                  </div>
                </div>
                <p className="mt-2 text-xs text-neutral-500">Hoặc dán URL ảnh avatar dưới đây:</p>
                <input
                  type="text"
                  value={formData.avatar}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                  className="mt-2 w-full rounded border px-3 py-2 outline-none focus:ring-2 focus:ring-sky-300"
                  placeholder="https://.../avatar.jpg"
                />
              </div>

              <div className="flex gap-2">
                <button type="submit" className="rounded bg-emerald-600 px-4 py-2 font-bold text-white shadow hover:bg-emerald-700">Lưu thay đổi</button>
                <button type="button" onClick={() => { setIsEditing(false); setError(""); }} className="rounded border-2 border-neutral-300 px-4 py-2 font-bold text-neutral-900 hover:bg-neutral-100">Hủy</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}