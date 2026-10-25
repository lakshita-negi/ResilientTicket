import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import BookTickets from "./pages/BookTickets";
import MyBookings from "./pages/MyBookings";
import MyTickets from "./pages/MyTickets";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/book-tickets" element={<BookTickets />} />
      <Route path="/login" element={<Login />} />
      <Route path="/bookings" element={<MyBookings />} />
      <Route path="/tickets" element={<MyTickets />} />
      <Route path="/admin" element={<AdminDashboard />} />
    </Routes>
  );
}

export default App;