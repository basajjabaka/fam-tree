import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Profile from "./Profile";
import ErrorPage from "./ErrorPage";
import "./profile.css";

function GetProfiles() {
  const { id } = useParams();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState(null);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    fetch(`${apiUrl}/api/members/${id}`)
      .then((response) => {
        setResponse(response);
        if (!response.ok) {
          return response.json().then((data) => {
            throw new Error(data.message || "Network response was not ok");
          });
        }
        return response.json();
      })
      .then((data) => {
        console.log("Fetched member data:", data);
        setMember(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching member data:", error);
        setError(error.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <h1>Loading...</h1>;
  }

  if (error) {
    return (
      <ErrorPage message={error} code={response ? response.status : 500} />
    );
  }

  if (!member) {
    return <h1>Member not found</h1>;
  }

  const spouse = member.spouse;
  const children = member.children || [];

  return (
    <div className="container">
      <h1 className="family-heading">{member.name}'s Family</h1>
      {member.location && (
        <a
          href={member.location}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-location"
        >
          <i className="bi bi-geo-alt-fill" /> View Location
        </a>
      )}
      {member.image && (
        <div className="family-photo">
          <img src={member.image} alt={`${member.name}'s Family`} />
        </div>
      )}
      {member.about && <p className="about">{member.about}</p>}
      <div className="profile-container-main">
        <Profile
          key={member._id}
          name={member.name}
          id={member._id}
          dob={member.dob}
          phone={member.phone}
          occupation={member.occupation}
          address={member.address}
        />
        {spouse && (
          <Profile
            key={spouse._id}
            name={spouse.name}
            id={spouse._id}
            dob={spouse.dob}
            phone={spouse.phone}
            occupation={spouse.occupation}
            address={spouse.address}
          />
        )}
      </div>
      {children.length > 0 && (
        <>
          <h2>Children</h2>
          <div className="profile-container">
            {children.map((child) => (
              <Profile
                key={child._id}
                name={child.name}
                id={child._id}
                dob={child.dob}
                phone={child.phone}
                occupation={child.occupation}
                address={child.address}
                ismarried={Boolean(child.spouse)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default GetProfiles;
