export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";

export type User = {
  _id?: string;
  username: string;
  email: string;
  avatar?: string;
  role?: string;
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
};

async function fetchJSON(path: string, opts: RequestInit = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...opts,
    credentials: "include",
    headers: {
      ...opts.headers,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
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
  return fetchJSON(`/comics?page=${page}&limit=${limit}`);
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

// Categories/Genres APIs
export async function getGenres() {
  return fetchJSON(`/genres`);
}
