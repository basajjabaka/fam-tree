import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Search, MapPin } from "lucide-react";
import "./homepage.css";
import UsersList from "./UsersList";
import FamilyHistory from "./FamilyHistory";
import BirthdayNotification from "./BirthdayNotification";

function HomePage() {
  const [isSticky, setIsSticky] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);
  const userIds = import.meta.env.VITE_USER_IDS.split(",").map((id) =>
    id.trim()
  );

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 250);
    };

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearch = async (e) => {
    e?.preventDefault();
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/search?query=${searchQuery}`);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      setSearchResults(data);
      setIsDropdownVisible(true);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        handleSearch();
      } else {
        setSearchResults([]);
        setIsDropdownVisible(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="home-page">
      <header className="header">
        <div className="title-container">
          <h1 className="title">Malieakkal</h1>
          <h2 className="subtitle">Anchery Family</h2>
          <Link to="/nearby" className="nearby-button">
            <MapPin size={20} />
            <span>Find Nearby Families</span>
          </Link>
        </div>
      </header>
      <div className={`header-box ${isSticky ? "visible" : ""}`}>
        <h1 className="header-box-title">Malieakkal Anchery Family</h1>
      </div>
      <section className="content">
        <div className="search-container" ref={dropdownRef}>
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-wrapper">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search members..."
                className="search-input"
                onFocus={() => setIsDropdownVisible(true)}
              />
              <button
                type="submit"
                className="search-button"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="search-loading-spinner" />
                ) : (
                  "Search"
                )}
              </button>
            </div>
          </form>

          {isDropdownVisible && searchResults.length > 0 && (
            <div className="search-dropdown">
              {searchResults.map((result) => (
                <Link
                  to={`/fam/${result._id}`}
                  key={result._id}
                  className="dropdown-item-link"
                >
                  <div
                    className="dropdown-item"
                    onClick={() => {
                      setIsDropdownVisible(false);
                      setSearchQuery("");
                    }}
                  >
                    {result.image && (
                      <div className="dropdown-item-image">
                        <img src={result.image} alt={result.name} />
                      </div>
                    )}

                    <div className="dropdown-item-content">
                      <div className="dropdown-item-name">{result.name}</div>
                      {result.phone && (
                        <div className="dropdown-item-phone">
                          {result.phone}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
        <BirthdayNotification />
        <FamilyHistory />
        <UsersList ids={userIds} />
      </section>
    </div>
  );
}

export default HomePage;
