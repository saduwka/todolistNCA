import { useState, useEffect } from "react";
import TaskApp from "./Components/TaskApp/TaskApp";
import AuthForm from "./Components/AuthForm/AuthForm";
import { getToken } from "./api/auth";
import { BrowserRouter } from "react-router-dom";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (getToken()) setIsAuthenticated(true);
  }, []);

  return (
    <BrowserRouter>
      <TaskApp />
    </BrowserRouter>
  );
}