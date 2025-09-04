import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./birthdaynotification.css";

const BirthdayNotification = () => {
  const [birthdays, setBirthdays] = useState([]);
  const [visible, setVisible] = useState(true);
  const viteapibaseurl = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchBirthdays = async () => {
      try {
        const response = await axios.get(
          `${viteapibaseurl}/api/members/birthdays/today`
        );
        const data = Array.isArray(response.data) ? response.data : [];
        console.log(response.data);
        setBirthdays(data);
      } catch (error) {
        console.error("Error fetching birthdays:", error);
        setBirthdays([]);
      }
    };

    fetchBirthdays();
    const interval = setInterval(fetchBirthdays, 3600000); // Refresh hourly
    return () => clearInterval(interval);
  }, []);

  if (!visible || !Array.isArray(birthdays) || birthdays.length === 0)
    return null;

  // // Calculate age based on birthdate
  // const calculateAge = (birthdate) => {
  //   const today = new Date();
  //   const birthDate = new Date(birthdate);
  //   let age = today.getFullYear() - birthDate.getFullYear();
  //   const monthDiff = today.getMonth() - birthDate.getMonth();
  //   if (
  //     monthDiff < 0 ||
  //     (monthDiff === 0 && today.getDate() < birthDate.getDate())
  //   ) {
  //     age--;
  //   }
  //   return age;
  // };

  return (
    <div className="birthday-card">
      <div className="birthday-content-container">
        <div className="birthday-header">
          <span className="icon">🎉</span>
          <h3>Today's Birthdays</h3>
          <button className="close-btn" onClick={() => setVisible(false)}>
            &times;
          </button>
        </div>

        <div className="birthday-list">
          {(birthdays || []).map((user) => (
            <Link
              to={`/fam/${user._id}`}
              key={user._id}
              className="birthday-item"
            >
              {user.image && (
                <img src={user.image} alt={user.name} className="avatar" />
              )}
              <div className="user-info" href={`/fam/${user._id}`}>
                <h4>{user.name}</h4>
                {/* <p>{calculateAge(user.dob)} years old today!</p> */}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BirthdayNotification;
