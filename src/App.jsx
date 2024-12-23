import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import GetProfiles from "./components/GetProfiles";
import HomePage from "./components/HomePage";
import AdminPanel from "./components/adminpanel";
import ErrorPage from "./components/ErrorPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/fam/:id" element={<GetProfiles />} />
        <Route path="*" element={<ErrorPage message={"Page Not Found"}/>} />
      </Routes>
    </Router>
  );
}

export default App;
