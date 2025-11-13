// Default API backend port is 3001. Override with NEXT_PUBLIC_API_BASE in
// your .env.local when needed.
// Prefer a full API URL (including any global prefix like `/api`) when provided.
// `NEXT_PUBLIC_API_URL` can be set to e.g. `http://localhost:3000/api`.
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";

export type User = {
  _id?: string;
  username: string;
  email: string;
  avatar?: string;
  role?: string;
  roles?: string[];
  createdAt?: string;
};

export type Chapter = {
  _id?: string;
  title: string;
  slug?: string;
  createdAt?: string;
  images?: string[];
};

export type Comment = {
  _id?: string;
  content: string;
  user?: User;
  createdAt?: string;
};

export type Comic = {
  _id?: string;
  title: string;
  cover?: string;
  author?: string;
  genres?: string[];
  status?: string;
  latestChapter?: string;
  updatedAt?: string;
  chapters?: Chapter[];
  description?: string;
  views?: number;
  follows?: number;
  comments?: Comment[];
  createdBy?: string; // User ID of the person who created this comic
  createdById?: string; // Alternative field name for created by user ID
};

async function fetchJSON(path: string, opts: RequestInit = {}) {
  // If `path` is already an absolute URL, use it as-is. Otherwise prefix with API_BASE.
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  // Log outgoing requests in development for easier debugging.
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log("[api] fetch:", opts.method || "GET", url);
  }

  // Provide runtime debug information (helps when Next uses Edge runtime)
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.debug("[api] runtime:", {
      nodeVersion: process?.version,
      nextRuntime: process?.env?.NEXT_RUNTIME,
      fetchType: typeof globalThis?.fetch,
    });
  }

  // Attempt fetch with a small retry for transient network errors
  let res: Response | undefined;
  const maxAttempts = 2;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // If running in the browser, include the stored access token (if any)
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

      res = await fetch(url, {
        ...opts,
        credentials: "include",
        headers: {
          ...opts.headers,
          "Content-Type": "application/json",
          "Accept": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        mode: "cors", // explicitly request CORS mode
      });
      break; // success
    } catch (err: any) {
      const message = `Network error when fetching ${url}: ${err?.message || err} (attempt ${attempt}/${maxAttempts})`;
      // eslint-disable-next-line no-console
      console.warn(message);
      if (attempt < maxAttempts) {
        // small backoff before retrying
        await new Promise((r) => setTimeout(r, 200));
        continue;
      }
      // final failure
      // eslint-disable-next-line no-console
      console.error(message);
      throw new Error(message);
    }
  }

  if (!res) {
    const message = `No response when fetching ${url}`;
    // eslint-disable-next-line no-console
    console.error(message);
    throw new Error(message);
  }

  if (!res.ok) {
    // If unauthorized, return null so callers can fallback to client auth state
    if (res.status === 401) {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.debug(`[api] 401 returned for ${url} - returning null`);
      }
      return null;
    }

    const text = await res.text();
    const message = `API error ${res.status} when fetching ${url}: ${text}`;
    // eslint-disable-next-line no-console
    console.error(message);
    throw new Error(message);
  }

  return res.json();
}

// Auth APIs
export async function login(email: string, password: string) {
  return fetchJSON(`/auth/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function register(username: string, email: string, password: string) {
  return fetchJSON(`/auth/register`, {
    method: "POST", 
    body: JSON.stringify({ username, email, password }),
  });
}

export async function logout() {
  return fetchJSON(`/auth/logout`, { method: "POST" });
}

// Comics APIs
export async function getComics(page = 1, limit = 20) {
  // Ensure page and limit are valid positive integers before sending to API
  const p = Math.max(1, Number(page) || 1);
  const l = Math.max(1, Number(limit) || 20);
  return fetchJSON(`/comics?page=${p}&limit=${l}`);
}

export async function getComic(id: string) {
  return fetchJSON(`/comics/${id}`);
}

export async function getChapterImages(comicId: string, chapterId: string) {
  return fetchJSON(`/comics/${comicId}/chapters/${chapterId}`);
}

export async function searchComics(q: string) {
  return fetchJSON(`/comics/search?q=${encodeURIComponent(q)}`);
}

export async function followComic(comicId: string) {
  return fetchJSON(`/comics/${comicId}/follow`, { method: "POST" });
}

export async function unfollowComic(comicId: string) {
  return fetchJSON(`/comics/${comicId}/follow`, { method: "DELETE" });
}

export async function getFollowingComics(userId: string) {
  return fetchJSON(`/users/${userId}/following`);
}

// Comments APIs
export async function getComments(comicId: string) {
  return fetchJSON(`/comments?comicId=${comicId}`);
}

export async function createComment(comicId: string, content: string) {
  return fetchJSON(`/comments`, {
    method: "POST",
    body: JSON.stringify({ comicId, content }),
  });
}

export async function deleteComment(commentId: string) {
  return fetchJSON(`/comments/${commentId}`, {
    method: "DELETE",
  });
}

// User APIs
export async function getCurrentUser() {
  return fetchJSON(`/users/profile`);
}

export async function updateProfile(data: Partial<User>) {
  return fetchJSON(`/users/profile`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Admin APIs
export async function getAdminUsers() {
  return fetchJSON(`/admin/users`);
}

export async function updateAdminUserRole(userId: string, role: string) {
  return fetchJSON(`/admin/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify({ role: role }),
  });
}

export async function deleteAdminUser(userId: string) {
  return fetchJSON(`/admin/users/${userId}`, {
    method: "DELETE",
  });
}

export async function getAdminComics() {
  return fetchJSON(`/comics`);
}

export async function getAdminComic(comicId: string) {
  return fetchJSON(`/comics/${comicId}`);
}

export async function createAdminComic(data: Partial<Comic>) {
  return fetchJSON(`/comics`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAdminComic(comicId: string, data: Partial<Comic>) {
  return fetchJSON(`/comics/${comicId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteAdminComic(comicId: string) {
  return fetchJSON(`/comics/${comicId}`, {
    method: "DELETE",
  });
}

// Categories/Genres APIs
export async function getGenres() {
  return fetchJSON(`/genres`);
}
