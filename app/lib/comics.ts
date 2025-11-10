export type Comic = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  status: 'ongoing' | 'completed';
  author: string;
  artist: string;
  createdAt: string;
  updatedAt: string;
  genres: string[];
  chapters: Array<{
    id: string;
    title: string;
    number: number;
  }>;
};

export type ComicsResponse = {
  comics: Comic[];
  total: number;
  page: number;
  limit: number;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

export async function getComics(page = 1, limit = 20) {
  const response = await fetch(
    `${API_BASE}/comics?page=${page}&limit=${limit}`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch comics');
  }

    const data = await response.json();
    console.log('Raw API response:', data);  // Debug log
    return data as ComicsResponse;
}

export async function getComicById(id: string) {
  const response = await fetch(`${API_BASE}/comics/${id}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch comic');
  }

  return response.json() as Promise<Comic>;
}