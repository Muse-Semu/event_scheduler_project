import useEvents from "../hooks/useEvents";
import { useModalStore } from "../store/modalStore";
import { format } from "date-fns";


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

const EventList: React.FC = () => {
  const { data: events, isLoading } = useEvents();
  const { openModal } = useModalStore();

  if (isLoading) return <div className="text-center p-4">Loading...</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Upcoming Events</h2>
      {events?.length ? (
        <ul className="space-y-4">
          {events.map((event: Event) => (
            <li
              key={event.id}
              className="p-4 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
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
              {event.is_recurring && (
                <p className="text-gray-500">
                  Recurs: {event.recurrence_rule?.frequency} every{" "}
                  {event.recurrence_rule?.interval}{" "}
                  {event.recurrence_rule?.interval === 1 ? "time" : "times"}
                </p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>No upcoming events.</p>
      )}
    </div>
  );
};

export default EventList;
