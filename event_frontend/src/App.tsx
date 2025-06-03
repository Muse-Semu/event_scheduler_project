
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from './components/Navbar';
import CalendarView from './components/CalendarView';
import EventList from './components/EventList';
import LoginForm from './components/LoginForm';
import EventModal from './components/EventModal';
import useAuthStore from './store/authStore';
import { useModalStore } from './store/modalStore';

const App: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const { isOpen } = useModalStore();

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto p-4">
        
        <Routes>
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <CalendarView />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/events"
            element={
              isAuthenticated ? (
                <EventList />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route path="/login" element={<LoginForm />} />
        </Routes>
      </div>
      {isOpen && <EventModal />}
    </div>
  );
};

export default App;

