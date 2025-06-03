// src/hooks/useEvents.ts
import { useQuery } from "@tanstack/react-query";
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
  };
}

const fetchEvents = async (
  refreshToken: () => Promise<string>
): Promise<Event[]> => {
  try {
    const response = await apiClient.get("/events/");
    return response.data.results;
  } catch (err: any) {
    if (err.response?.status === 401) {
      const newToken = await refreshToken();
      const response = await apiClient.get("/events/", {
        headers: { Authorization: `Bearer ${newToken}` },
      });
      return response.data.results;
    }
    throw err;
  }
};

const useEvents = () => {
  const { refreshToken } = useAuth();
  return useQuery({
    queryKey: ["events"],
    queryFn: () => fetchEvents(refreshToken),
  });
};

export default useEvents;
