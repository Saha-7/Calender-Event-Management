"use client";
import React, { useState, useEffect } from "react";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebaseConfig"; // Adjust path based on your folder structure
import { useRouter } from "next/navigation";

function CalendarPage() {
  // const auth = getAuth();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventDescription, setEventDescription] = useState("");

  // Load events from localStorage on mount
  useEffect(() => {
    const savedEvents = localStorage.getItem("calendarEvents");
    if (savedEvents) {
      try {
        setEvents(JSON.parse(savedEvents));
      } catch (error) {
        console.error("Error loading events:", error);
      }
    }
  }, []);

  // Save events to localStorage whenever they change
  useEffect(() => {
    if (Object.keys(events).length > 0) {
      localStorage.setItem("calendarEvents", JSON.stringify(events));
    }
  }, [events]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        router.push("/");
      }
    });
    return () => unsubscribe();
  }, [auth, router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error.message);
    }
  };

  // Get days in month
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  // Navigate months
  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  // Handle date click
  const handleDateClick = (day) => {
    const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${day}`;
    setSelectedDate(dateKey);
    setShowModal(true);
  };

  // Add event
  const handleAddEvent = () => {
    if (!eventTitle.trim()) {
      alert("Please enter an event title");
      return;
    }

    const newEvent = {
      title: eventTitle,
      time: eventTime,
      description: eventDescription,
      id: Date.now(),
    };

    setEvents((prev) => ({
      ...prev,
      [selectedDate]: [...(prev[selectedDate] || []), newEvent],
    }));

    // Reset form
    setEventTitle("");
    setEventTime("");
    setEventDescription("");
    setShowModal(false);
  };

  // Delete event
  const handleDeleteEvent = (dateKey, eventId) => {
    setEvents((prev) => {
      const updatedEvents = {
        ...prev,
        [dateKey]: prev[dateKey].filter((event) => event.id !== eventId),
      };
      
      // Remove the date key if no events left
      if (updatedEvents[dateKey].length === 0) {
        delete updatedEvents[dateKey];
      }
      
      return updatedEvents;
    });
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">My Calendar</h1>
            <p className="text-gray-600">Welcome, {user.displayName || user.email}!</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Calendar Header */}
          <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
            <button
              onClick={previousMonth}
              className="hover:bg-blue-700 p-2 rounded transition"
            >
              ← Previous
            </button>
            <h2 className="text-xl font-bold">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={nextMonth}
              className="hover:bg-blue-700 p-2 rounded transition"
            >
              Next →
            </button>
          </div>

          {/* Day Names */}
          <div className="grid grid-cols-7 bg-gray-100 border-b">
            {dayNames.map((day) => (
              <div key={day} className="p-3 text-center font-semibold text-gray-700">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: startingDayOfWeek }).map((_, index) => (
              <div key={`empty-${index}`} className="border p-2 h-24 bg-gray-50"></div>
            ))}

            {/* Days of the month */}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${day}`;
              const dayEvents = events[dateKey] || [];
              const isToday =
                day === new Date().getDate() &&
                currentDate.getMonth() === new Date().getMonth() &&
                currentDate.getFullYear() === new Date().getFullYear();

              return (
                <div
                  key={day}
                  onClick={() => handleDateClick(day)}
                  className={`border p-2 h-24 cursor-pointer hover:bg-blue-50 transition ${
                    isToday ? "bg-blue-100 font-bold" : ""
                  }`}
                >
                  <div className="font-semibold text-gray-700">{day}</div>
                  <div className="mt-1 space-y-1">
                    {dayEvents.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        className="text-xs bg-blue-200 text-blue-800 rounded px-1 py-0.5 truncate"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {event.time && `${event.time} - `}{event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-600">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Event Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                Add Event - {selectedDate}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEventTitle("");
                  setEventTime("");
                  setEventDescription("");
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full border border-gray-300 text-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter event title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time (optional)
                </label>
                <input
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="w-full border text-black border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  className="w-full border border-gray-300 text-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter event description"
                  rows="3"
                />
              </div>

              {/* Existing events for this date */}
              {events[selectedDate] && events[selectedDate].length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2 text-black">Existing Events:</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {events[selectedDate].map((event) => (
                      <div
                        key={event.id}
                        className="flex justify-between items-start bg-gray-50 p-2 rounded"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-black">{event.title}</div>
                          {event.time && (
                            <div className="text-sm text-black">{event.time}</div>
                          )}
                          {event.description && (
                            <div className="text-sm text-gray-700">{event.description}</div>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteEvent(selectedDate, event.id)}
                          className="text-red-500 hover:text-red-700 ml-2 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddEvent}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
              >
                Add Event
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEventTitle("");
                  setEventTime("");
                  setEventDescription("");
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarPage;