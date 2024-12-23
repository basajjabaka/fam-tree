import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import moment from "moment";
import "./Homepage.css";
import UsersList from "./UsersList";

function HomePage() {
  const [isSticky, setIsSticky] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);
  const userIds = [
    "6766874803208904176ad60c",
    "6766c645b21d6e73b029068d",
    "6766cd7edb5c1b6cd1540a84",
  ];

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
        </div>
      </header>
      <div className={`header-box ${isSticky ? "visible" : ""}`}>
        <h1 className="header-box-title">Anchery Family</h1>
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
                    <div className="dropdown-item-name">{result.name}</div>
                    <div className="dropdown-item-dob">
                      {moment(result.dob).format("DD-MM-YYYY")}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
        <UsersList ids={userIds} />
      </section>
    </div>
  );
}

export default HomePage;
