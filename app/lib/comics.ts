export type Comic = {
  _id: string;
  title: string;
  slug: string;
  description: string;
  cover?: string;
  authors: string[];
  genres: string[];
  status: 'ongoing' | 'completed';
  chapters: Array<{
    _id: string;
    title: string;
    images: string[];
    isDraft: boolean;
    date: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

export type ComicsResponse = {
  items: Comic[];
  total: number;
  page: number;
  limit: number;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

export const getComics = async (page: number = 1, limit: number = 20): Promise<ComicsResponse> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/comics?page=${page}&limit=${limit}`);
  if (!response.ok) {
    throw new Error('Failed to fetch comics');
  }
  const data = await response.json();
  return data;
};

export async function getComicById(id: string) {
  try {
    const response = await fetch(`${API_BASE}/comics/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch comic');
    }

    return response.json() as Promise<Comic>;
  } catch (error) {
    console.error('Error fetching comic:', error);
    throw error;
  }
}