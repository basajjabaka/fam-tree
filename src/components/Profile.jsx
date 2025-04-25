import React from "react";
import { Link } from "react-router-dom";
import moment from "moment";
import "./profile.css";

function Profile({
  name,
  id,
  dob,
  phone,
  occupation,
  address,
  ismarried = true,
}) {
  return (
    <div className="card">
      <div className="profile-header">
        <h1 className="name">{name}</h1>
        <span className="occupation">{occupation ? occupation : "\u00A0"}</span>
      </div>
      <div className="contact-info">
        {phone && (
          <Link to={`tel:${phone}`}>
            <div className="info-item">
              <div className="icon">
                <i className="fas fa-phone"></i>
              </div>
              <span className="info-text">{phone}</span>
            </div>
          </Link>
        )}
        {address && (
          <div className="info-item">
            <div className="icon">
              <i className="fas fa-map-marker-alt"></i>
            </div>
            <span className="info-text">{address}</span>
          </div>
        )}
        {dob && (
          <div className="info-item">
            <div className="icon">
              <i className="fas fa-birthday-cake"></i>
            </div>
            <span className="info-text">
              {moment(dob).format("DD-MM-YYYY")}
            </span>
          </div>
        )}
      </div>
      {ismarried && (
        <Link to={`/fam/${id}`}>
          <button className="view-family-btn">
            <i className="fas fa-users"></i>
            View Family
          </button>
        </Link>
      )}
    </div>
  );
}

export default Profile;
