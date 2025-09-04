import React, { useEffect, useState } from "react";
import "./profile.css";
import Profile from "./Profile";
import LoadingSpinner from "./LoadingSpinner";

function UsersList({ ids }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get the API URL from environment variables
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    console.log('API URL:', apiUrl);
    console.log('User IDs:', ids);
    
    const fetchUsers = async () => {
      try {
        const usersData = await Promise.all(
          ids.map(async (id) => {
            try {
              console.log(`Fetching user with ID: ${id}`);
              // Ensure the URL is correctly formatted
              // The VITE_API_BASE_URL already includes '/api/' so we don't need to add it again
              const url = apiUrl.endsWith('/') ? `${apiUrl}members/${id}` : `${apiUrl}/members/${id}`;
              console.log('Request URL:', url);
              
              const response = await fetch(url);
              console.log(`Response status for ID ${id}:`, response.status);
              
              // Check if response is JSON
              const contentType = response.headers.get("content-type");
              console.log(`Content-Type for ID ${id}:`, contentType);
              
              if (!contentType || !contentType.includes("application/json")) {
                console.warn(`Response for ID ${id} is not JSON. Content-Type:`, contentType);
                return null; // Skip this user
              }
              
              if (!response.ok) {
                const data = await response.json();
                console.warn(`User with ID ${id} not found:`, data.message);
                return null; // Return null for non-existent users instead of throwing
              }
              
              const userData = await response.json();
              console.log(`User data for ID ${id}:`, userData);
              return userData;
            } catch (err) {
              console.warn(`Error fetching user with ID ${id}:`, err);
              return null; // Return null for this user instead of failing the whole request
            }
          })
        );
        
        // Filter out null values (failed requests)
        const validUsers = usersData.filter(user => user !== null);
        console.log('Valid users:', validUsers);
        setUsers(validUsers);
        setLoading(false);
        
        if (validUsers.length === 0 && ids.length > 0) {
          console.error('No valid users found from IDs:', ids);
          setError("No valid users found. The user IDs provided in VITE_USER_IDS may not exist in the database.");
        }
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
