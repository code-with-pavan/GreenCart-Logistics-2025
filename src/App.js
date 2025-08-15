import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

// Mock data to simulate initial data load from a CSV/JSON file
const initialDrivers = [
  { id: "d1", name: "Alice", currentShiftHours: 2, past7DayHours: 45 },
  { id: "d2", name: "Bob", currentShiftHours: 6, past7DayHours: 35 },
  { id: "d3", name: "Charlie", currentShiftHours: 9, past7DayHours: 50 }, // Charlie has fatigue
];

const initialRoutes = [
  { id: "r1", distance: 10, trafficLevel: "Low", baseTime: 30 }, // Base time in minutes
  { id: "r2", distance: 25, trafficLevel: "High", baseTime: 60 },
  { id: "r3", distance: 15, trafficLevel: "Medium", baseTime: 45 },
  { id: "r4", distance: 5, trafficLevel: "Low", baseTime: 15 },
  { id: "r5", distance: 20, trafficLevel: "High", baseTime: 50 },
];

const initialOrders = [
  {
    id: "o1",
    value_rs: 500,
    assignedRoute: "r1",
    deliveryTimestamp: null,
    delivered: false,
  },
  {
    id: "o2",
    value_rs: 1200,
    assignedRoute: "r2",
    deliveryTimestamp: null,
    delivered: false,
  },
  {
    id: "o3",
    value_rs: 800,
    assignedRoute: "r3",
    deliveryTimestamp: null,
    delivered: false,
  },
  {
    id: "o4",
    value_rs: 150,
    assignedRoute: "r4",
    deliveryTimestamp: null,
    delivered: false,
  },
  {
    id: "o5",
    value_rs: 2500,
    assignedRoute: "r5",
    deliveryTimestamp: null,
    delivered: false,
  },
  {
    id: "o6",
    value_rs: 900,
    assignedRoute: "r1",
    deliveryTimestamp: null,
    delivered: false,
  },
  {
    id: "o7",
    value_rs: 1100,
    assignedRoute: "r2",
    deliveryTimestamp: null,
    delivered: false,
  },
  {
    id: "o8",
    value_rs: 300,
    assignedRoute: "r3",
    deliveryTimestamp: null,
    delivered: false,
  },
  {
    id: "o9",
    value_rs: 700,
    assignedRoute: "r4",
    deliveryTimestamp: null,
    delivered: false,
  },
  {
    id: "o10",
    value_rs: 1800,
    assignedRoute: "r5",
    deliveryTimestamp: null,
    delivered: false,
  },
];

// Main App Component
const App = () => {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    user: null,
  });
  const [currentView, setCurrentView] = useState("dashboard");
  const [message, setMessage] = useState(null);

  // State for data
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [simulationHistory, setSimulationHistory] = useState([]);

  // State for simulation results
  const [kpis, setKpis] = useState({
    totalProfit: 0,
    efficiencyScore: 0,
    onTimeDeliveries: 0,
    lateDeliveries: 0,
    fuelCostBreakdown: [],
  });

  // Use localStorage to persist data and simulate a database
  useEffect(() => {
    const storedDrivers =
      JSON.parse(localStorage.getItem("drivers")) || initialDrivers;
    const storedRoutes =
      JSON.parse(localStorage.getItem("routes")) || initialRoutes;
    const storedOrders =
      JSON.parse(localStorage.getItem("orders")) || initialOrders;
    const storedHistory =
      JSON.parse(localStorage.getItem("simulationHistory")) || [];

    setDrivers(storedDrivers);
    setRoutes(storedRoutes);
    setOrders(storedOrders);
    setSimulationHistory(storedHistory);

    // Initial KPI calculation on load
    if (storedOrders.some((order) => order.delivered)) {
      calculateKPIs(storedOrders, storedRoutes);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("drivers", JSON.stringify(drivers));
  }, [drivers]);

  useEffect(() => {
    localStorage.setItem("routes", JSON.stringify(routes));
  }, [routes]);

  useEffect(() => {
    localStorage.setItem("orders", JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(
      "simulationHistory",
      JSON.stringify(simulationHistory)
    );
  }, [simulationHistory]);

  // Login/Logout logic
  const handleLogin = (username, password) => {
    if (username === "manager" && password === "password") {
      setAuthState({ isAuthenticated: true, user: { username } });
      setMessage({ type: "success", text: "Login successful!" });
    } else {
      setMessage({ type: "error", text: "Invalid username or password." });
    }
  };

  const handleLogout = () => {
    setAuthState({ isAuthenticated: false, user: null });
    setMessage({ type: "success", text: "Logged out successfully!" });
  };

  // KPI Calculation Logic
  const calculateKPIs = (completedOrders, allRoutes) => {
    let totalProfit = 0;
    let onTimeDeliveries = 0;
    let lateDeliveries = 0;
    const fuelCostBreakdown = { Low: 0, Medium: 0, High: 0 };

    completedOrders.forEach((order) => {
      const route = allRoutes.find((r) => r.id === order.assignedRoute);
      if (!route) return; // Skip if route not found

      const isLate =
        (order.deliveryTimestamp - order.startTime) / 60000 >
        route.baseTime + 10;
      const isHighValue = order.value_rs > 1000;

      // 1. Fuel Cost Calculation
      let fuelCostPerKm = 5;
      if (route.trafficLevel === "High") {
        fuelCostPerKm += 2;
      }
      const fuelCost = fuelCostPerKm * route.distance;
      fuelCostBreakdown[route.trafficLevel] += fuelCost;

      // 2. Late Delivery Penalty
      let penalty = isLate ? 50 : 0;

      // 3. High-Value Bonus
      let bonus = 0;
      if (isHighValue && !isLate) {
        bonus = order.value_rs * 0.1;
      }

      // 4. Overall Profit
      totalProfit += order.value_rs + bonus - penalty - fuelCost;

      // 5. Efficiency Score
      if (!isLate) {
        onTimeDeliveries++;
      } else {
        lateDeliveries++;
      }
    });

    const totalDeliveries = onTimeDeliveries + lateDeliveries;
    const efficiencyScore =
      totalDeliveries > 0 ? (onTimeDeliveries / totalDeliveries) * 100 : 0;

    setKpis({
      totalProfit: totalProfit,
      efficiencyScore: efficiencyScore,
      onTimeDeliveries: onTimeDeliveries,
      lateDeliveries: lateDeliveries,
      fuelCostBreakdown: Object.entries(fuelCostBreakdown).map(
        ([name, value]) => ({ name, value })
      ),
    });

    return {
      totalProfit,
      efficiencyScore,
      onTimeDeliveries,
      lateDeliveries,
      fuelCostBreakdown: Object.entries(fuelCostBreakdown).map(
        ([name, value]) => ({ name, value })
      ),
    };
  };

  // Simulation Logic
  const runSimulation = (inputs) => {
    const { numDrivers, routeStartTime, maxHours } = inputs;

    if (numDrivers <= 0 || numDrivers > drivers.length) {
      setMessage({
        type: "error",
        text:
          "Invalid number of drivers. Must be between 1 and " +
          drivers.length +
          ".",
      });
      return;
    }

    // Simulate order reallocation and delivery
    const simulatedOrders = orders.map((order, index) => {
      const route = routes.find((r) => r.id === order.assignedRoute);
      const isFatigued = drivers.some(
        (d) => d.past7DayHours > 40 && d.currentShiftHours > 8
      ); // simplified fatigue logic
      const deliverySpeedModifier = isFatigued ? 1.3 : 1; // 30% slower

      const deliveryDuration = route.baseTime * deliverySpeedModifier * 60000; // in milliseconds

      return {
        ...order,
        delivered: true,
        startTime:
          new Date(`${new Date().toDateString()} ${routeStartTime}`).getTime() +
          index * 10 * 60000,
        deliveryTimestamp:
          new Date(`${new Date().toDateString()} ${routeStartTime}`).getTime() +
          index * 10 * 60000 +
          deliveryDuration,
      };
    });

    const newKpis = calculateKPIs(simulatedOrders, routes);

    setOrders(simulatedOrders);

    // Save to history
    const newHistory = {
      timestamp: new Date().toLocaleString(),
      inputs,
      kpis: newKpis,
    };
    setSimulationHistory((prev) => [...prev, newHistory]);
    setMessage({
      type: "success",
      text: "Simulation completed and results updated!",
    });
  };

  // CRUD operations
  const handleCreate = (type, newItem) => {
    const id = (Math.random() + 1).toString(36).substring(7);
    switch (type) {
      case "drivers":
        setDrivers((prev) => [
          ...prev,
          { ...newItem, id, currentShiftHours: 0, past7DayHours: 0 },
        ]);
        break;
      case "routes":
        setRoutes((prev) => [
          ...prev,
          {
            ...newItem,
            id,
            distance: Number(newItem.distance),
            baseTime: Number(newItem.baseTime),
          },
        ]);
        break;
      case "orders":
        setOrders((prev) => [
          ...prev,
          {
            ...newItem,
            id,
            value_rs: Number(newItem.value_rs),
            delivered: false,
          },
        ]);
        break;
      default:
        break;
    }
    setMessage({
      type: "success",
      text: `${type.slice(0, -1)} created successfully!`,
    });
  };

  const handleUpdate = (type, updatedItem) => {
    switch (type) {
      case "drivers":
        setDrivers((prev) =>
          prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
        );
        break;
      case "routes":
        setRoutes((prev) =>
          prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
        );
        break;
      case "orders":
        setOrders((prev) =>
          prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
        );
        break;
      default:
        break;
    }
    setMessage({
      type: "success",
      text: `${type.slice(0, -1)} updated successfully!`,
    });
  };

  const handleDelete = (type, id) => {
    switch (type) {
      case "drivers":
        setDrivers((prev) => prev.filter((item) => item.id !== id));
        break;
      case "routes":
        setRoutes((prev) => prev.filter((item) => item.id !== id));
        break;
      case "orders":
        setOrders((prev) => prev.filter((item) => item.id !== id));
        break;
      default:
        break;
    }
    setMessage({
      type: "success",
      text: `${type.slice(0, -1)} deleted successfully!`,
    });
  };

  const renderContent = () => {
    switch (currentView) {
      case "dashboard":
        return <Dashboard kpis={kpis} simulationHistory={simulationHistory} />;
      case "simulation":
        return (
          <Simulation
            runSimulation={runSimulation}
            drivers={drivers}
            kpis={kpis}
          />
        );
      case "drivers":
        return (
          <ManagementPage
            title="Drivers"
            data={drivers}
            onCreate={(item) => handleCreate("drivers", item)}
            onUpdate={(item) => handleUpdate("drivers", item)}
            onDelete={(id) => handleDelete("drivers", id)}
            fields={["id", "name", "currentShiftHours", "past7DayHours"]}
            formFields={[
              { name: "name", label: "Name", type: "text" },
              {
                name: "currentShiftHours",
                label: "Current Shift Hours",
                type: "number",
              },
              {
                name: "past7DayHours",
                label: "Past 7-Day Hours",
                type: "number",
              },
            ]}
          />
        );
      case "routes":
        return (
          <ManagementPage
            title="Routes"
            data={routes}
            onCreate={(item) => handleCreate("routes", item)}
            onUpdate={(item) => handleUpdate("routes", item)}
            onDelete={(id) => handleDelete("routes", id)}
            fields={["id", "distance", "trafficLevel", "baseTime"]}
            formFields={[
              { name: "distance", label: "Distance (km)", type: "number" },
              { name: "trafficLevel", label: "Traffic Level", type: "text" },
              { name: "baseTime", label: "Base Time (min)", type: "number" },
            ]}
          />
        );
      case "orders":
        return (
          <ManagementPage
            title="Orders"
            data={orders}
            onCreate={(item) => handleCreate("orders", item)}
            onUpdate={(item) => handleUpdate("orders", item)}
            onDelete={(id) => handleDelete("orders", id)}
            fields={["id", "value_rs", "assignedRoute"]}
            formFields={[
              { name: "value_rs", label: "Value (₹)", type: "number" },
              {
                name: "assignedRoute",
                label: "Assigned Route ID",
                type: "text",
              },
            ]}
          />
        );
      default:
        return null;
    }
  };

  if (!authState.isAuthenticated) {
    return <Login onLogin={handleLogin} message={message} />;
  }

  return (
    <div className="bg-gray-100 font-inter min-h-screen">
      <Navbar
        onViewChange={setCurrentView}
        currentView={currentView}
        authState={authState}
        onLogout={handleLogout}
      />
      {message && (
        <div
          className={`p-4 rounded-xl text-white font-bold text-center mt-4 mx-auto w-11/12 md:w-2/3 ${
            message.type === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {message.text}
        </div>
      )}
      <main className="container mx-auto p-4 md:p-8">{renderContent()}</main>
    </div>
  );
};

// =========================================================
// Navbar Component
// =========================================================
const Navbar = ({ onViewChange, currentView, authState, onLogout }) => (
  <nav className="bg-gray-800 p-4 shadow-lg sticky top-0 z-50">
    <div className="container mx-auto flex justify-between items-center flex-wrap">
      <div className="text-white font-bold text-2xl tracking-wide">
        GreenCart Logistics
      </div>
      <div className="flex space-x-2 sm:space-x-4 mt-2 sm:mt-0">
        <button
          onClick={() => onViewChange("dashboard")}
          className={`px-3 py-2 rounded-lg text-sm font-medium ${
            currentView === "dashboard"
              ? "bg-green-600 text-white shadow-md"
              : "text-gray-300 hover:bg-gray-700 hover:text-white"
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => onViewChange("simulation")}
          className={`px-3 py-2 rounded-lg text-sm font-medium ${
            currentView === "simulation"
              ? "bg-green-600 text-white shadow-md"
              : "text-gray-300 hover:bg-gray-700 hover:text-white"
          }`}
        >
          Simulation
        </button>
        <button
          onClick={() => onViewChange("drivers")}
          className={`px-3 py-2 rounded-lg text-sm font-medium ${
            currentView === "drivers"
              ? "bg-green-600 text-white shadow-md"
              : "text-gray-300 hover:bg-gray-700 hover:text-white"
          }`}
        >
          Drivers
        </button>
        <button
          onClick={() => onViewChange("routes")}
          className={`px-3 py-2 rounded-lg text-sm font-medium ${
            currentView === "routes"
              ? "bg-green-600 text-white shadow-md"
              : "text-gray-300 hover:bg-gray-700 hover:text-white"
          }`}
        >
          Routes
        </button>
        <button
          onClick={() => onViewChange("orders")}
          className={`px-3 py-2 rounded-lg text-sm font-medium ${
            currentView === "orders"
              ? "bg-green-600 text-white shadow-md"
              : "text-gray-300 hover:bg-gray-700 hover:text-white"
          }`}
        >
          Orders
        </button>
        {authState.isAuthenticated && (
          <button
            onClick={onLogout}
            className="px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-700 hover:text-white"
          >
            Logout
          </button>
        )}
      </div>
    </div>
  </nav>
);

// =========================================================
// Login Component
// =========================================================
const Login = ({ onLogin, message }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(username, password);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          GreenCart Login
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-green-500 focus:border-green-500 transition duration-200"
              placeholder="manager"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-green-500 focus:border-green-500 transition duration-200"
              placeholder="password"
            />
          </div>
          {message && (
            <div
              className={`p-3 rounded-xl text-white text-center font-bold ${
                message.type === "success" ? "bg-green-500" : "bg-red-500"
              }`}
            >
              {message.text}
            </div>
          )}
          <button
            type="submit"
            className="w-full py-3 px-4 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-700 transition duration-200"
          >
            Log In
          </button>
        </form>
      </div>
    </div>
  );
};

// =========================================================
// ManagementPage Component
// =========================================================
const ManagementPage = ({
  title,
  data,
  onCreate,
  onUpdate,
  onDelete,
  fields,
  formFields,
}) => {
  const [editingItem, setEditingItem] = useState(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (editingItem) {
      reset(editingItem);
    } else {
      reset({});
    }
  }, [editingItem, reset]);

  const onSubmit = (formData) => {
    if (editingItem) {
      onUpdate(formData);
    } else {
      onCreate(formData);
    }
    setEditingItem(null);
    reset();
  };

  const handleEditClick = (item) => {
    setEditingItem(item);
  };

  const handleDeleteClick = (id) => {
    onDelete(id);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">
          {title} Management
        </h2>

        <div className="bg-white p-6 rounded-2xl shadow-xl mb-8">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">
            {editingItem ? "Edit" : "Create"} {title.slice(0, -1)}
          </h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {formFields.map((field) => (
              <div key={field.name} className="flex flex-col">
                <label className="text-gray-600 mb-1">{field.label}</label>
                <input
                  type={field.type || "text"}
                  {...register(field.name, {
                    required: `${field.label} is required`,
                  })}
                  className="p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200"
                />
                {errors[field.name] && (
                  <span className="text-red-500 text-sm mt-1">
                    {errors[field.name].message}
                  </span>
                )}
              </div>
            ))}
            <div className="flex space-x-4">
              <button
                type="submit"
                className="px-6 py-3 bg-green-500 text-white rounded-xl font-bold shadow-lg hover:bg-green-600 transition duration-200"
              >
                {editingItem ? "Update" : "Create"}
              </button>
              {editingItem && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingItem(null);
                    reset();
                  }}
                  className="px-6 py-3 bg-gray-400 text-white rounded-xl font-bold hover:bg-gray-500 transition duration-200"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-xl">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">
            {title} List
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-xl">
              <thead>
                <tr className="bg-gray-100 text-left text-gray-600 uppercase text-sm leading-normal">
                  {fields.map((field) => (
                    <th key={field} className="py-3 px-6 text-left">
                      {field}
                    </th>
                  ))}
                  <th className="py-3 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm font-light">
                {data.map((item, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-200 hover:bg-gray-100"
                  >
                    {fields.map((field) => (
                      <td
                        key={field}
                        className="py-3 px-6 text-left whitespace-nowrap"
                      >
                        {item[field.toLowerCase().replace(/ /g, "")]}
                      </td>
                    ))}
                    <td className="py-3 px-6 text-center">
                      <div className="flex item-center justify-center space-x-2">
                        <button
                          onClick={() => handleEditClick(item)}
                          className="w-8 h-8 rounded-full bg-blue-100 text-blue-500 hover:bg-blue-200 transition duration-200"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mx-auto"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(item.id)}
                          className="w-8 h-8 rounded-full bg-red-100 text-red-500 hover:bg-red-200 transition duration-200"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mx-auto"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================
// Dashboard Component
// =========================================================
const Dashboard = ({ kpis, simulationHistory }) => {
  const COLORS = ["#82ca9d", "#ff8042"];
  const TRAFFIC_COLORS = { Low: "#4ade80", Medium: "#facc15", High: "#ef4444" };

  const onTimeData = [
    { name: "On-time", value: kpis.onTimeDeliveries },
    { name: "Late", value: kpis.lateDeliveries },
  ];

  const hasData = kpis.onTimeDeliveries + kpis.lateDeliveries > 0;

  return (
    <div className="space-y-8">
      <h2 className="text-4xl font-extrabold text-gray-800 mb-6">
        KPI Dashboard
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <h3 className="text-xl font-semibold text-gray-700">Total Profit</h3>
          <p className="text-4xl font-bold text-green-600 mt-2">
            ₹{kpis.totalProfit.toFixed(2)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <h3 className="text-xl font-semibold text-gray-700">
            Efficiency Score
          </h3>
          <p className="text-4xl font-bold text-green-600 mt-2">
            {kpis.efficiencyScore.toFixed(2)}%
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <h3 className="text-xl font-semibold text-gray-700">
            On-Time Deliveries
          </h3>
          <p className="text-4xl font-bold text-green-600 mt-2">
            {kpis.onTimeDeliveries}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <h3 className="text-xl font-semibold text-gray-700">
            Late Deliveries
          </h3>
          <p className="text-4xl font-bold text-red-600 mt-2">
            {kpis.lateDeliveries}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-xl">
          <h3 className="text-2xl font-semibold text-gray-700 mb-4 text-center">
            On-time vs Late Deliveries
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            {hasData ? (
              <PieChart>
                <Pie
                  data={onTimeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {onTimeData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-lg">
                No delivery data available. Run a simulation!
              </div>
            )}
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-xl">
          <h3 className="text-2xl font-semibold text-gray-700 mb-4 text-center">
            Fuel Cost Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={kpis.fuelCostBreakdown}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
              <Legend />
              <Bar dataKey="value" name="Fuel Cost">
                {kpis.fuelCostBreakdown.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={TRAFFIC_COLORS[entry.name]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-xl">
        <h3 className="text-2xl font-semibold text-gray-700 mb-4">
          Simulation History
        </h3>
        {simulationHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-xl">
              <thead>
                <tr className="bg-gray-100 text-left text-gray-600 uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left">Timestamp</th>
                  <th className="py-3 px-6 text-left">Inputs</th>
                  <th className="py-3 px-6 text-left">Profit</th>
                  <th className="py-3 px-6 text-left">Efficiency</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm font-light">
                {simulationHistory.map((sim, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-200 hover:bg-gray-100"
                  >
                    <td className="py-3 px-6 text-left whitespace-nowrap">
                      {sim.timestamp}
                    </td>
                    <td className="py-3 px-6 text-left">{`Drivers: ${sim.inputs.numDrivers}, Start Time: ${sim.inputs.routeStartTime}`}</td>
                    <td className="py-3 px-6 text-left">
                      ₹{sim.kpis.totalProfit.toFixed(2)}
                    </td>
                    <td className="py-3 px-6 text-left">
                      {sim.kpis.efficiencyScore.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">
            No past simulations found. Run a simulation to see history here.
          </p>
        )}
      </div>
    </div>
  );
};

// =========================================================
// Simulation Component
// =========================================================
const Simulation = ({ runSimulation, drivers, kpis }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = (data) => {
    runSimulation({ ...data, numDrivers: Number(data.numDrivers) });
  };

  return (
    <div className="space-y-8">
      <h2 className="text-4xl font-extrabold text-gray-800 mb-6">
        Run Simulation
      </h2>

      <div className="bg-white p-6 rounded-2xl shadow-xl">
        <h3 className="text-2xl font-semibold text-gray-700 mb-4">
          Simulation Inputs
        </h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-gray-700">
              Number of Available Drivers
            </label>
            <input
              type="number"
              {...register("numDrivers", {
                required: "Number of drivers is required",
                min: { value: 1, message: "Must be at least 1" },
                max: {
                  value: drivers.length,
                  message: `Cannot exceed ${drivers.length} available drivers`,
                },
              })}
              className="mt-1 block w-full p-3 border rounded-xl focus:ring-green-500 focus:border-green-500 transition duration-200"
              defaultValue={drivers.length}
            />
            {errors.numDrivers && (
              <span className="text-red-500 text-sm">
                {errors.numDrivers.message}
              </span>
            )}
          </div>
          <div>
            <label className="block text-gray-700">
              Route Start Time (HH:MM)
            </label>
            <input
              type="time"
              {...register("routeStartTime", {
                required: "Start time is required",
              })}
              className="mt-1 block w-full p-3 border rounded-xl focus:ring-green-500 focus:border-green-500 transition duration-200"
              defaultValue="09:00"
            />
            {errors.routeStartTime && (
              <span className="text-red-500 text-sm">
                {errors.routeStartTime.message}
              </span>
            )}
          </div>
          <div>
            <label className="block text-gray-700">
              Max Hours per Driver per Day
            </label>
            <input
              type="number"
              {...register("maxHours", {
                required: "Max hours is required",
                min: { value: 1, message: "Must be at least 1" },
              })}
              className="mt-1 block w-full p-3 border rounded-xl focus:ring-green-500 focus:border-green-500 transition duration-200"
              defaultValue={8}
            />
            {errors.maxHours && (
              <span className="text-red-500 text-sm">
                {errors.maxHours.message}
              </span>
            )}
          </div>
          <button
            type="submit"
            className="w-full py-3 px-4 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-700 transition duration-200"
          >
            Run Simulation
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-xl">
        <h3 className="text-2xl font-semibold text-gray-700 mb-4">
          Latest Simulation Results
        </h3>
        <p className="text-gray-600">
          The dashboard has been updated with the latest results. You can also
          see a detailed breakdown on the Dashboard page.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div className="p-4 rounded-xl bg-green-100">
            <h4 className="font-medium text-green-800">Total Profit</h4>
            <p className="text-2xl font-bold text-green-600">
              ₹{kpis.totalProfit.toFixed(2)}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-blue-100">
            <h4 className="font-medium text-blue-800">Efficiency Score</h4>
            <p className="text-2xl font-bold text-blue-600">
              {kpis.efficiencyScore.toFixed(2)}%
            </p>
          </div>
          <div className="p-4 rounded-xl bg-purple-100">
            <h4 className="font-medium text-purple-800">On-Time</h4>
            <p className="text-2xl font-bold text-purple-600">
              {kpis.onTimeDeliveries}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-red-100">
            <h4 className="font-medium text-red-800">Late</h4>
            <p className="text-2xl font-bold text-red-600">
              {kpis.lateDeliveries}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export the main App component as the only default export
export default App;
