import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import GetProfiles from "./components/GetProfiles";
import HomePage from "./components/HomePage";
import AdminPanel from "./components/AdminPanel";
import NearbyFamilies from "./components/NearbyFamilies";
import ErrorPage from "./components/ErrorPage";
import ScrollToTop from "./components/ScrollToTop";
import Header from "./components/Header";
import Footer from "./components/Footer";

const AppHeader = () => {
  const location = useLocation();
  if (location.pathname === "/") {
    return null;
  }
  return <Header />;
};

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <AppHeader />
      <div style={{ paddingBottom: "80px" }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/fam/:id" element={<GetProfiles />} />
          <Route path="/nearby-families" element={<NearbyFamilies />} />
          <Route path="*" element={<ErrorPage message="Page Not Found" />} />
        </Routes>
      </div>
      <Footer />
    </Router>
  );
}
