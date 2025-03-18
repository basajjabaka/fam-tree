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
      <div class="profile-header">
        <h1 class="name">{name}</h1>
        <span class="occupation">{occupation ? occupation : "\u00A0"}</span>
      </div>
      <div className="contact-info">
        {phone && (
          <Link to={`tel:${phone}`}>
            <div class="info-item">
              <div class="icon">
                <i class="fas fa-phone"></i>
              </div>
              <span class="info-text">{phone}</span>
            </div>
          </Link>
        )}
        {address && (
          <div class="info-item">
            <div class="icon">
              <i class="fas fa-map-marker-alt"></i>
            </div>
            <span class="info-text">{address}</span>
          </div>
        )}
        {dob && (
          <div class="info-item">
            <div class="icon">
              <i class="fas fa-birthday-cake"></i>
            </div>
            <span class="info-text">{moment(dob).format("DD-MM-YYYY")}</span>
          </div>
        )}
      </div>
      {ismarried && (
        <Link to={`/fam/${id}`}>
          <button className="view-family-btn">
            <i class="fas fa-users"></i>
            View Family
          </button>
        </Link>
      )}
    </div>
  );
}

export default Profile;
