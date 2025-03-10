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
      <div className="card-body">
        <h5 className="card-title">{name}</h5>
        {dob && (
          <p className="card-text">DOB: {moment(dob).format("DD-MM-YYYY")}</p>
        )}
        {phone && <p className="card-text">Phone: {phone}</p>}
        {occupation && <p className="card-text">Occupation: {occupation}</p>}
        {address && (
          <p className="card-text">
            {address.split("\n").map((line, index) => (
              <React.Fragment key={index}>
                {line}
                <br />
              </React.Fragment>
            ))}
          </p>
        )}
        {ismarried && (
          <Link to={`/fam/${id}`} className="btn btn-primary">
            View Family
          </Link>
        )}
      </div>
    </div>
  );
}

export default Profile;
