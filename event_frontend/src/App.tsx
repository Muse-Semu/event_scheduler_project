import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import CalendarView from "./components/CalendarView";
import EventList from "./components/EventList";
import LoginForm from "./components/LoginForm";
import EventModal from "./components/EventModal";
import useAuthStore from "./store/authStore";
import { useModalStore } from "./store/modalStore";
import RegisterForm from "./components/RegisterForm";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
const App: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const { isOpen } = useModalStore();

  return (
    <div className="min-h-screen bg-gray-100">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Navbar />
      <div className="container mx-auto p-4">
        <Routes>
          <Route
            path="/"
            element={
              isAuthenticated ? <CalendarView /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/events"
            element={isAuthenticated ? <EventList /> : <Navigate to="/login" />}
          />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
        </Routes>
      </div>
      {isOpen && <EventModal />}
    </div>
  );
};

export default App;
