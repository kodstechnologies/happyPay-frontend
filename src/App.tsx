import { useEffect } from "react";
import { useRoutes, useLocation } from "react-router-dom";
import Router from "./routes/router";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  console.log("Router value:", Router);
  console.log("Router is array:", Array.isArray(Router));

  const routing = useRoutes(Router);
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith('/admin')) {
      document.title = "HappyPay · Admin Portal";
    } else {
      document.title = "HappyPay · Retailer Portal";
    }
  }, [location.pathname]);

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      {routing}
    </>
  );
}

export default App;