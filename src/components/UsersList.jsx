import React, { useEffect, useState } from "react";
import "./profile.css";
import Profile from "./Profile";
import LoadingSpinner from "./LoadingSpinner";

function UsersList({ ids }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    const fetchUsers = async () => {
      try {
        const usersData = await Promise.all(
          ids.map(async (id) => {
            const response = await fetch(`${apiUrl}/api/members/${id}`);
            if (!response.ok) {
              return response.json().then((data) => {
                throw new Error(data.message || "Network response was not ok");
              });
            }
            return response.json();
          })
        );
        setUsers(usersData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching users data:", error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchUsers();
  }, [ids]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <h1>Error: {error}</h1>;
  }

  return (
    <div className="profile-container" id="corefamily">
      {users.map((user) => (
        <Profile
          key={user._id}
          name={user.name}
          id={user._id}
          dob={user.dob}
          phone={user.phone}
          occupation={user.occupation}
          address={user.address}
        />
      ))}
    </div>
  );
}

export default UsersList;
