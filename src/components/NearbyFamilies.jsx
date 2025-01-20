import React, { useState, useEffect } from "react";
import "./nearbyfamilies.css";

const NearbyFamilies = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Function to get the user's current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          fetchNearbyFamilies(lat, lng);
        },
        (error) => {
          setError(
            "Failed to retrieve your location. Please enable location services."
          );
          console.error(error);
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
    }
  };

  // Fetch nearby families using the current location
  const fetchNearbyFamilies = async (lat, lng) => {
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${apiUrl}/api/nearby?lat=${lat}&lng=${lng}`
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new TypeError("Received non-JSON response");
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setMembers(data);
      } else {
        setError("Unexpected response format.");
      }
    } catch (err) {
      setError("Error fetching nearby families. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch nearby families on component mount
  useEffect(() => {
    getCurrentLocation();
    console.log(members);
  }, []);

  return (
    <div className="nearby-families-container">
      <h1>Find Families Nearby</h1>
      <div className="member-list">
        {members.map((member) => (
          <div key={member._id} className="member-card">
            <img
              src={member.image}
              alt={member.name}
              className="member-image"
            />
            <div className="member-details">
              <div className="member-info">
                <h3 className="member-name">{member.name}</h3>
                <p className="member-distance">
                  {member.distance.toFixed(2)} Km's away
                </p>
              </div>
              <a
                href={`https://www.google.com/maps?q=${member.location.coordinates[1]},${member.location.coordinates[0]}`}
                target="_blank"
                rel="noopener noreferrer"
                className="location-button"
              >
                <i class="bi bi-geo-alt-fill" /> View Location
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NearbyFamilies;
