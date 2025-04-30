import React, { useState, useEffect } from "react";
import "./nearbyfamilies.css";
import LoadingSpinner from "./LoadingSpinner";

const Dialog = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="dialog-overlay">
      <div className="dialog-content">
        <h2>Location Access Required</h2>
        <p>
          Location access was denied. Please enable location permissions in your
          browser settings and refresh the page.
        </p>
        <div className="dialog-buttons">
          <button onClick={onClose} className="dialog-button cancel">
            Close
          </button>
          <button
            onClick={() => window.location.reload()}
            className="dialog-button confirm"
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  );
};

const NearbyFamilies = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showLocationDialog, setShowLocationDialog] = useState(false);

  // Auto-fetch on component mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const handleLocationError = (error) => {
    console.error("Geolocation error:", error);
    let errorMessage = "";

    switch (error.code) {
      case error.PERMISSION_DENIED:
        setShowLocationDialog(true);
        setError(""); // Clear error state
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage =
          "Unable to detect your location. Please check your device settings.";
        break;
      case error.TIMEOUT:
        errorMessage = "Location request timed out. Please try again.";
        break;
      default:
        errorMessage = "An error occurred while getting your location.";
    }

    if (errorMessage) setError(errorMessage);
    setLoading(false);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Location services are not supported by your browser.");
      return;
    }

    setLoading(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        fetchNearbyFamilies(lat, lng);
      },
      handleLocationError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const fetchNearbyFamilies = async (lat, lng) => {
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    setError("");

    try {
      const response = await fetch(
        `${apiUrl}/api/nearby?lat=${lat}&lng=${lng}`
      );
      if (!response.ok) throw new Error("Network response was not ok");

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

  return (
    <div className="nearby-families-container">
      <h1>Families Nearby</h1>

      {error && !showLocationDialog && (
        <div className="error-message">
          {error}
          <button onClick={getCurrentLocation} className="retry-button">
            Try Again
          </button>
        </div>
      )}

      {loading && <LoadingSpinner message="Finding nearby families" />}

      <Dialog
        isOpen={showLocationDialog}
        onClose={() => {
          setShowLocationDialog(false);
          setError("");
        }}
        onConfirm={() => window.location.reload()}
      />

      <div className="member-list">
        {members.map((member) => (
          <div key={member._id} className="member-card">
            {member.image && (
              <img
                src={member.image}
                alt={member.name}
                className="member-image"
              />
            )}
            <div className="member-details">
              <div className="member-info">
                <h3 className="member-name">{member.name}</h3>
                <p className="member-distance">
                  {member.distance?.toFixed(2)} km away
                </p>
              </div>
              <a
                href={`https://www.google.com/maps?q=${member.location.coordinates[1]},${member.location.coordinates[0]}`}
                target="_blank"
                rel="noopener noreferrer"
                className="location-button"
              >
                <i className="bi bi-geo-alt-fill" /> View Location
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NearbyFamilies;
