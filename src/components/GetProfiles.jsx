import { useEffect, useState } from "react";
import { useParams } from "react-router";
import Profile from "./Profile";
import ErrorPage from "./ErrorPage";
import LoadingSpinner from "./LoadingSpinner";
import "./profile.css";

function GetProfiles() {
  const { id } = useParams();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState(null);

  useEffect(() => {
    if (!id) return;

    setLoading(true); // Show spinner initially

    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    fetch(`${apiUrl}/api/members/${id}`)
      .then((res) => {
        setResponse(res);
        if (!res.ok) {
          return res.json().then((data) => {
            throw new Error(data.message || "Network response was not ok");
          });
        }
        return res.json();
      })
      .then((data) => {
        setMember(data); // Set the member data
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false); // Hide spinner on error
      });
  }, [id]);

  useEffect(() => {
    if (member) {
      if (member.image) {
        const img = new Image();
        img.src = member.image;
        img.onload = () => {
          setLoading(false);
        };
        img.onerror = () => {
          console.warn("Image failed to load");
          setLoading(false);
        };
      } else {
        setLoading(false);
      }
    }
  }, [member]);

  if (loading) {
    return <LoadingSpinner message="Loading Family Details" />;
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
          <img
            src={
              member.image +
              (member.updatedAt
                ? `?v=${new Date(member.updatedAt).getTime()}`
                : `?v=${Date.now()}`)
            }
            alt={`${member.name}'s Family`}
          />
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
