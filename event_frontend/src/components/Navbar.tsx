import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { useModalStore } from '../store/modalStore';

const Navbar: React.FC = () => {
  const { isAuthenticated, logout } = useAuthStore();
  const { openModal } = useModalStore();

  return (
    <nav className="bg-blue-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">
          Event Scheduler
        </Link>
        <div className="space-x-4">
          {isAuthenticated ? (
            <>
              <Link to="/" className="hover:underline">
                Calendar
              </Link>
              <Link to="/events" className="hover:underline">
                Events
              </Link>
              <button
                onClick={() => openModal(null)}
                className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded"
              >
                New Event
              </button>
              <button
                onClick={logout}
                className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded"
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="hover:underline">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
