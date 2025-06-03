import { useInfiniteQuery } from "@tanstack/react-query";
import apiClient from "../api/client";
import { useAuth } from "./useAuth";

interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
  recurrence_rule?: {
    frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
    interval: number;
    end_date?: string;
    weekdays?: string[] | null;
    weekday?: string | null;
    ordinal?: number | null;
  };
}

interface EventsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Event[];
}

const fetchEvents = async (
  refreshToken: () => Promise<string>,
  pageParam: string | null
): Promise<EventsResponse> => {
  try {
    const url = pageParam || "/events/";
    const response = await apiClient.get(url);
    return response.data;
  } catch (err: any) {
    if (err.response?.status === 401) {
      const newToken = await refreshToken();
      const url = pageParam || "/events/";
      const response = await apiClient.get(url, {
        headers: { Authorization: `Bearer ${newToken}` },
      });
      return response.data;
    }
    throw err;
  }
};

const useEvents = () => {
  const { refreshToken } = useAuth();
  return useInfiniteQuery({
    queryKey: ["events"],
    queryFn: ({ pageParam }) => fetchEvents(refreshToken, pageParam),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.next || undefined,
  });
};

export default useEvents;
