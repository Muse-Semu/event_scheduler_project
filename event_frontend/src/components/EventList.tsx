import { useModalStore } from "../store/modalStore";
import { format } from "date-fns";
import useEvents from "../hooks/useEvents";

const EventList: React.FC = () => {
  const { openModal } = useModalStore();
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useEvents();

  if (isLoading) return <div className="text-center p-4">Loading...</div>;
  if (isError)
    return <div className="text-center p-4">Error loading events</div>;

  const allEvents = data?.pages.flatMap((page) => page.results) || [];

  // Helper function to format recurrence rule
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

  // Helper function to check if event has ended
  const isEventEnded = (endDate: string | null) => {
    if (!endDate) return false;
    return new Date(endDate) < new Date();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Upcoming Events</h2>
      {allEvents.length ? (
        <div className="space-y-4">
          <ul className="space-y-4">
            {allEvents.map((event) => {
              const hasEnded = isEventEnded(event.recurrence_rule?.end_date);
              return (
                <li
                  key={event.id}
                  className={`p-4 rounded cursor-pointer ${
                    hasEnded
                      ? "bg-red-50 hover:bg-red-100"
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
                  onClick={() => openModal(event)}
                >
                  <h3 className="text-lg font-semibold">{event.title}</h3>
                  <p className="text-gray-600">{event.description}</p>
                  <p className="text-gray-500">
                    {format(new Date(event.start_time), "PPP p")} -{" "}
                    {format(new Date(event.end_time), "p")}
                  </p>
                  {event.location && (
                    <p className="text-gray-500">Location: {event.location}</p>
                  )}
                  {event.is_recurring && event.recurrence_rule && (
                    <p className="text-gray-500">
                      {formatRecurrence(event.recurrence_rule)}
                    </p>
                  )}
                  {hasEnded && (
                    <p className="text-red-500 font-medium mt-2">
                      This event series has ended.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
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
      ) : (
        <p>No upcoming events.</p>
      )}
    </div>
  );
};

export default EventList;
