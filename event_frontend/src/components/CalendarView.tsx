import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import useEvents from "../hooks/useEvents";
import { useModalStore } from "../store/modalStore";
import { useState } from "react";
import { RRule } from "rrule";

const localizer = momentLocalizer(moment);

const CalendarView: React.FC = () => {
  const { data, isLoading, fetchNextPage, hasNextPage } = useEvents();
  const { openModal } = useModalStore();
  const [date, setDate] = useState(new Date(2025, 5, 3)); // Start on June 3, 2025 (today)
  const [view, setView] = useState("month");

  const allEvents = data?.pages.flatMap((page) => page.results) || [];
  if (hasNextPage) fetchNextPage();

  const expandRecurringEvents = (events: any[]) => {
    const expandedEvents: any[] = [];
    const startOfMonth = moment(date).startOf("month").toDate();
    const endOfMonth = moment(date).endOf("month").toDate();

    events.forEach((event) => {
      if (event.is_recurring && event.recurrence_rule) {
        const ruleOptions: any = {
          dtstart: new Date(event.start_time),
          until: event.recurrence_rule.end_date
            ? new Date(event.recurrence_rule.end_date) > new Date()
              ? new Date(event.recurrence_rule.end_date)
              : endOfMonth
            : endOfMonth,
          interval: event.recurrence_rule.interval || 1,
        };

        switch (event.recurrence_rule.frequency) {
          case "DAILY":
            ruleOptions.freq = RRule.DAILY;
            break;
          case "WEEKLY":
            ruleOptions.freq = RRule.WEEKLY;
            if (event.recurrence_rule.weekdays) {
              ruleOptions.byweekday = event.recurrence_rule.weekdays
                .map((day: string) => {
                  switch (day) {
                    case "MON":
                      return RRule.MO;
                    case "TUE":
                      return RRule.TU;
                    case "WED":
                      return RRule.WE;
                    case "THU":
                      return RRule.TH;
                    case "FRI":
                      return RRule.FR;
                    case "SAT":
                      return RRule.SA;
                    case "SUN":
                      return RRule.SU;
                    default:
                      return null;
                  }
                })
                .filter((d: any) => d !== null);
            }
            break;
          case "MONTHLY":
            ruleOptions.freq = RRule.MONTHLY;
            if (
              event.recurrence_rule.weekday &&
              event.recurrence_rule.ordinal
            ) {
              const weekdayMap: any = {
                MON: RRule.MO,
                TUE: RRule.TU,
                WED: RRule.WE,
                THU: RRule.TH,
                FRI: RRule.FR,
                SAT: RRule.SA,
                SUN: RRule.SU,
              };
              ruleOptions.byweekday = weekdayMap[
                event.recurrence_rule.weekday
              ].nth(event.recurrence_rule.ordinal);
            }
            break;
        }

        const rule = new RRule(ruleOptions);
        const occurrences = rule.between(startOfMonth, endOfMonth, true);

        occurrences.forEach((occurrence) => {
          const duration =
            new Date(event.end_time).getTime() -
            new Date(event.start_time).getTime();
          const occurrenceEnd = new Date(occurrence.getTime() + duration);
          expandedEvents.push({
            id: `${event.id}-${occurrence.getTime()}`,
            title: event.title,
            start: occurrence,
            end: occurrenceEnd,
            originalEvent: event,
          });
        });
      } else {
        expandedEvents.push({
          id: event.id,
          title: event.title,
          start: new Date(event.start_time),
          end: new Date(event.end_time),
          originalEvent: event,
        });
      }
    });

    return expandedEvents;
  };

  const calendarEvents = expandRecurringEvents(allEvents);

  const handleSelectEvent = (event: {
    id: string | number;
    originalEvent: any;
  }) => {
    const eventId =
      typeof event.id === "string"
        ? parseInt(event.id.split("-")[0])
        : event.id;
    const selectedEvent = allEvents.find((e) => e.id === eventId);
    if (selectedEvent) openModal(selectedEvent);
  };

  const handleNavigate = (newDate: Date) => {
    setDate(newDate);
  };

  const handleViewChange = (newView: string) => {
    setView(newView);
  };

  const eventPropGetter = (event: any) => {
    const now = new Date();
    const originalEvent = event.originalEvent;
    let isClosed = false;

    if (originalEvent.is_recurring && originalEvent.recurrence_rule?.end_date) {
      isClosed = new Date(originalEvent.recurrence_rule.end_date) < now;
    } else {
      isClosed = new Date(originalEvent.end_time) < now;
    }

    return {
      style: {
        fontSize: "10px",
        padding: "2px 4px",
        margin: "1px 0",
        height: "auto",
        backgroundColor: isClosed ? "#ffcccc" : "#cce5ff", // Red for closed, blue for active
        color: isClosed ? "#cc0000" : "#0033cc", // Darker text for contrast
        border: "none",
      },
    };
  };

  if (isLoading) return <div className="text-center p-4">Loading...</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Calendar</h2>
      <div style={{ height: "600px" }}>
        <style>
          {`
            .rbc-month-row {
              min-height: 150px !important;
            }
            .rbc-event {
              min-height: 18px !important;
              overflow: hidden;
              text-overflow: ellipsis;
            }
          `}
        </style>
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          onSelectEvent={handleSelectEvent}
          className="rbc-calendar"
          date={date}
          onNavigate={handleNavigate}
          view={view}
          onView={handleViewChange}
          eventPropGetter={eventPropGetter}
          max={Infinity}
        />
      </div>
    </div>
  );
};

export default CalendarView;
