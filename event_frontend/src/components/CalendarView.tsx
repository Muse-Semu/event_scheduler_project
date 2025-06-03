import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import useEvents from "../hooks/useEvents";
import { useModalStore } from "../store/modalStore";
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

const localizer = momentLocalizer(moment);

const CalendarView: React.FC = () => {
  const { data: events, isLoading } = useEvents();
  const { openModal } = useModalStore();

  const calendarEvents =
    events?.map((event: Event) => ({
      id: event.id,
      title: event.title,
      start: new Date(event.start_time),
      end: new Date(event.end_time),
    })) || [];

  const handleSelectEvent = (event: { id: number }) => {
    const selectedEvent = events?.find((e) => e.id === event.id);
    openModal(selectedEvent);
  };

  if (isLoading) return <div className="text-center p-4">Loading...</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Calendar</h2>
      <div style={{ height: "500px" }}>
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          onSelectEvent={handleSelectEvent}
          className="rbc-calendar"
        />
      </div>
    </div>
  );
};

export default CalendarView;
