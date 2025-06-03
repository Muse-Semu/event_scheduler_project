
import { format } from "date-fns";
import { FiCalendar, FiClock, FiList, FiUser } from "react-icons/fi";
import useEvents from "../hooks/useEvents";

import { useModalStore } from "../store/modalStore";
import { Link } from "react-router-dom";
import useAuthStore from "../store/authStore";

const Dashboard = () => {
  const { user } = useAuthStore().accessToken;
  const currentDate = new Date();
  const { openModal } = useModalStore();

  console.log("user", user);
  
  const { data, isLoading, isError } = useEvents();

  if (isLoading)
    return <div className="flex justify-center py-8">Loading dashboard...</div>;
  if (isError)
    return <div className="flex justify-center py-8">Error loading events</div>;


 // Flatten all pages of events
  const allEvents = data?.pages.flatMap((page) => page.results) || [];

  // Calculate statistics
  const totalEvents = allEvents.length;
  const upcomingEvents = allEvents.filter(
    (event) => new Date(event.start_time) > currentDate
  );
  const pastEvents = allEvents.filter(
    (event) => new Date(event.end_time) < currentDate
  );
  const ongoingEvents = allEvents.filter(
    (event) =>
      new Date(event.start_time) <= currentDate &&
      new Date(event.end_time) >= currentDate
  );

  if (isLoading)
    return <div className="flex justify-center py-8">Loading dashboard...</div>;

  // Calculate statistics

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Welcome back, <span className="text-blue-600">{user?.access}</span>!
        </h1>
        <p className="text-gray-600 mt-2">
          {format(currentDate, "EEEE, MMMM do yyyy")}
        </p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<FiCalendar className="text-blue-500" size={24} />}
          title="Total Events"
          value={totalEvents}
          trend="All your scheduled events"
          bgColor="bg-blue-50"
        />
        <StatCard
          icon={<FiClock className="text-green-500" size={24} />}
          title="Upcoming"
          value={upcomingEvents.length}
          trend="Events in the future"
          bgColor="bg-green-50"
        />
        <StatCard
          icon={<FiList className="text-purple-500" size={24} />}
          title="Ongoing"
          value={ongoingEvents.length}
          trend="Happening right now"
          bgColor="bg-purple-50"
        />
        <StatCard
          icon={<FiUser className="text-orange-500" size={24} />}
          title="Past Events"
          value={pastEvents.length}
          trend="Completed events"
          bgColor="bg-orange-50"
        />
      </div>

      {/* Upcoming Events Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            Upcoming Events
          </h2>
          <Link to="/events" className="text-sm text-blue-600 hover:underline">
            View All
          </Link>
        </div>

        {upcomingEvents.length > 0 ? (
          <div className="space-y-4">
            {upcomingEvents.slice(0, 3).map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No upcoming events scheduled</p>
            <button className="mt-2 text-blue-600 hover:underline">
              Create your first event
            </button>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Recent Activity
          </h3>
          <div className="space-y-4">
            <ActivityItem
              type="event_created"
              title="Team Meeting"
              time="2 hours ago"
            />
            <ActivityItem
              type="event_updated"
              title="Product Launch"
              time="Yesterday"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Quick Actions
          </h3>
          <div
            onClick={() => openModal(null)}
            className="grid grid-cols-2 gap-4"
          >
            <ActionButton
              icon={<FiCalendar size={20} />}
              label="New Event"
              color="bg-blue-100 text-blue-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Component Building Blocks
const StatCard = ({
  icon,
  title,
  value,
  trend,
  bgColor,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
  trend: string;
  bgColor: string;
}) => (
  <div className={`${bgColor} p-5 rounded-xl shadow-xs`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-lg ${bgColor.replace("50", "100")}`}>
        {icon}
      </div>
    </div>
    <p className="text-xs text-gray-500 mt-2">{trend}</p>
  </div>
);

const EventCard = ({ event }: { event: any }) => (
  <div className="flex items-start p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
    <div className="bg-blue-100 p-3 rounded-lg mr-4">
      <FiCalendar className="text-blue-600" />
    </div>
    <div className="flex-1">
      <h4 className="font-medium">{event.title}</h4>
      <p className="text-sm text-gray-600 mt-1">
        {format(new Date(event.start_time), "MMM d, h:mm a")} -
        {format(new Date(event.end_time), "h:mm a")}
      </p>
    </div>
    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
      Upcoming
    </span>
  </div>
);

const ActivityItem = ({
  type,
  title,
  time,
}: {
  type: string;
  title: string;
  time: string;
}) => (
  <div className="flex items-start">
    <div
      className={`p-2 rounded-full mr-3 ${
        type === "event_created"
          ? "bg-green-100 text-green-600"
          : "bg-blue-100 text-blue-600"
      }`}
    >
      {type === "event_created" ? (
        <FiCalendar size={16} />
      ) : (
        <FiList size={16} />
      )}
    </div>
    <div>
      <p className="font-medium">{title}</p>
      <p className="text-sm text-gray-500">{time}</p>
    </div>
  </div>
);

const ActionButton = ({
  icon,
  label,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
}) => (
  <button
    className={`${color} flex flex-col items-center justify-center p-4 rounded-lg hover:shadow-md transition-all`}
  >
    <span className="mb-2">{icon}</span>
    <span className="text-sm font-medium">{label}</span>
  </button>
);

export default Dashboard;
