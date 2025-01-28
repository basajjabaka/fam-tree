import React, { useState, useEffect } from "react";
import "./nearbyfamilies.css";

const Dialog = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="dialog-overlay">
      <div className="dialog-content">
        <h2>Location Access Required</h2>
        <p>
          To find families near you, we need access to your location. Please
          click "Allow" when prompted by your browser.
        </p>
        <div className="dialog-buttons">
          <button onClick={onClose} className="dialog-button cancel">
            Cancel
          </button>
          <button onClick={onConfirm} className="dialog-button confirm">
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

const NearbyFamilies = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showLocationDialog, setShowLocationDialog] = useState(false);

  const handleLocationError = (error) => {
    console.error("Geolocation error:", error);
    let errorMessage = "";

    switch (error.code) {
      case error.PERMISSION_DENIED:
        // Check if using mobile browser
        if (/Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
          errorMessage =
            "Please enable location access in your device settings and refresh the page.";
        } else {
          errorMessage = "Please allow location access and refresh the page.";
        }
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

    setError(errorMessage);
    setLoading(false);
  };

  const getCurrentLocation = (isRetry = false) => {
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

  const handleEnableLocation = () => {
    setShowLocationDialog(false);
    getCurrentLocation(true);
  };

  const fetchNearbyFamilies = async (lat, lng) => {
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
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

  useEffect(() => {
    getCurrentLocation();
  }, []);

  return (
    <div className="nearby-families-container">
      <h1>Find Families Nearby</h1>
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => getCurrentLocation()} className="retry-button">
            Try Again
          </button>
        </div>
      )}
      {loading && (
        <div className="loading-message">Finding nearby families...</div>
      )}

      <Dialog
        isOpen={showLocationDialog}
        onClose={() => setShowLocationDialog(false)}
        onConfirm={handleEnableLocation}
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
                  {member.distance.toFixed(2)} Km's away
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
