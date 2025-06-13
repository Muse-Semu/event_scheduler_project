import { useModalStore } from "../store/modalStore";
import { format } from "date-fns";
import useEvents from "../hooks/useEvents";
import { useState } from "react";
import { FiTrash2 } from "react-icons/fi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import apiClient from "../api/client";

const EventList: React.FC = () => {
  const { openModal } = useModalStore();
  const queryClient = useQueryClient();
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useEvents();

  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(5);
  const loadIncrement = 5;
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (eventId: number) => {
      setDeletingId(eventId);
      return apiClient.delete(`/events/delete/${eventId}/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
    },
    onSuccess: () => {
      toast.success("Event deleted successfully");
      queryClient.invalidateQueries(["events"]);
      setDeletingId(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to delete event");
      setDeletingId(null);
    },
  });

  const handleDelete = (
    eventId: number,
    eventTitle: string,
    isRecurring: boolean
  ) => {
    const confirmMessage = isRecurring
      ? `Delete ALL instances of "${eventTitle}"? This cannot be undone.`
      : `Delete "${eventTitle}"? This cannot be undone.`;

    if (window.confirm(confirmMessage)) {
      deleteMutation.mutate(eventId);
    }
  };

  if (isLoading) return <div className="text-center p-4">Loading...</div>;
  if (isError)
    return <div className="text-center p-4">Error loading events</div>;

  const allEvents = data?.pages.flatMap((page) => page.results) || [];

  const isEventEnded = (event: any) => {
    const now = new Date();
    if (event.is_recurring && event.recurrence_rule?.end_date) {
      return new Date(event.recurrence_rule.end_date) < now;
    }
    return new Date(event.end_time) < now;
  };

  const formatRecurrence = (rule: any) => {
    if (!rule) return "";
    if (rule.frequency === "WEEKLY") {
      return `Recurs: Weekly on ${rule.weekdays?.join(", ") || ""} every ${
        rule.interval
      } week${rule.interval > 1 ? "s" : ""}`;
    }
    if (rule.frequency === "MONTHLY" && rule.weekday && rule.ordinal) {
      return `Recurs: Monthly on the ${rule.ordinal}${
        rule.ordinal === 1
          ? "st"
          : rule.ordinal === 2
          ? "nd"
          : rule.ordinal === 3
          ? "rd"
          : "th"
      } ${rule.weekday} every ${rule.interval} month${
        rule.interval > 1 ? "s" : ""
      }`;
    }
    return `Recurs: ${rule.frequency} every ${rule.interval} time${
      rule.interval > 1 ? "s" : ""
    }`;
  };

  const sortedEvents = [...allEvents].sort((a, b) => {
    const aTime = new Date(a.start_time).getTime();
    const bTime = new Date(b.start_time).getTime();
    if (isEventEnded(a) && !isEventEnded(b)) return 1;
    if (!isEventEnded(a) && isEventEnded(b)) return -1;
    return bTime - aTime;
  });

  const filteredEvents = sortedEvents.filter((event) => {
    const matchesFilter =
      filter === "All" ||
      (filter === "Active" && !isEventEnded(event)) ||
      (filter === "Closed" && isEventEnded(event));
    const matchesSearch =
      search === "" ||
      event.title.toLowerCase().includes(search.toLowerCase()) ||
      event.description.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const visibleEvents = filteredEvents.slice(0, visibleCount);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Upcoming Events</h2>
      <div className="mb-4 flex space-x-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="All">All</option>
          <option value="Active">Active</option>
          <option value="Closed">Closed</option>
        </select>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or description..."
          className="border p-2 rounded w-full sm:w-1/2"
        />
      </div>
      {visibleEvents.length ? (
        <div className="space-y-4">
          <ul className="space-y-4">
            {visibleEvents.map((event) => {
              const hasEnded = isEventEnded(event);
              return (
                <li
                  key={event.id}
                  className={`p-4 rounded ${
                    hasEnded
                      ? "bg-red-50 hover:bg-red-100"
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => openModal(event)}
                    >
                      <h3 className="text-lg font-semibold">{event.title}</h3>
                      <p className="text-gray-600">{event.description}</p>
                      <p className="text-gray-500">
                        {format(new Date(event.start_time), "PPP p")} -{" "}
                        {format(new Date(event.end_time), "p")}
                      </p>
                      {event.location && (
                        <p className="text-gray-500">
                          Location: {event.location}
                        </p>
                      )}
                      {event.is_recurring && event.recurrence_rule && (
                        <p className="text-gray-500">
                          {formatRecurrence(event.recurrence_rule)}
                        </p>
                      )}
                      {hasEnded && (
                        <p className="text-red-500 font-medium mt-2">
                          This event {event.is_recurring ? "series " : ""}has
                          ended.
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(event.id, event.title, event.is_recurring);
                      }}
                      disabled={deletingId === event.id}
                      className="text-red-500 hover:text-red-700 p-1 ml-2"
                      aria-label="Delete event"
                    >
                      {deletingId === event.id ? (
                        <span className="text-sm">Deleting...</span>
                      ) : (
                        <FiTrash2 size={18} />
                      )}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="flex space-x-4 mt-4">
            {visibleCount < filteredEvents.length && (
              <button
                onClick={() => setVisibleCount(visibleCount + loadIncrement)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                Load More
              </button>
            )}
            {visibleCount > loadIncrement && (
              <button
                onClick={() => setVisibleCount(visibleCount - loadIncrement)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
              >
                Load Less
              </button>
            )}
            {hasNextPage && (
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                {isFetchingNextPage ? "Loading more..." : "Load More"}
              </button>
            )}
          </div>
        </div>
      ) : (
        <p>No upcoming events.</p>
      )}
    </div>
  );
};

export default EventList;
