import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import GetProfiles from "./components/GetProfiles";
import HomePage from "./components/HomePage";
import AdminPanel from "./components/AdminPanel";
import NearbyFamilies from "./components/NearbyFamilies";
import ErrorPage from "./components/ErrorPage";
import ScrollToTop from "./components/ScrollToTop";

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/fam/:id" element={<GetProfiles />} />
        <Route path="/nearby" element={<NearbyFamilies />} />
        <Route path="*" element={<ErrorPage message={"Page Not Found"} />} />
      </Routes>
    </Router>
  );
}

export default App;
