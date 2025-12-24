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
  followersCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type ComicsResponse = {
  items: Comic[];
  total: number;
  page: number;
  limit: number;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';

export const getComics = async (page: number = 1, limit: number = 30, sortBy?: string): Promise<ComicsResponse> => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  if (sortBy) {
    params.append('sortBy', sortBy);
  }
  const url = `${API_BASE}/comics?${params.toString()}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Failed to fetch comics: ${response.status} ${response.statusText}. URL: ${url}${errorText ? `. Response: ${errorText}` : ''}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Comics fetch error for URL ${url}:`, error);
    throw error;
  }
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