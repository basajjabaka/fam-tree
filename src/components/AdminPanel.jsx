import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import moment from "moment";
import "react-datepicker/dist/react-datepicker.css";
import "./adminpanel.css";

function AdminPanel() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState({
    name: "",
    dob: "",
    phone: "",
    image: null,
    occupation: "",
    address: "",
    spouse: "",
    parent: "",
    children: [],
    location: "",
    about: "",
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (isLoggedIn) {
      fetchMembers();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    setFilteredMembers(
      members.filter((member) =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [searchQuery, members]);

  const fetchMembers = async () => {
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    try {
      const response = await fetch(`${apiUrl}/api/members`);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      setMembers(data);
      setFilteredMembers(data);
    } catch (error) {
      console.error("Fetch members failed:", error);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (e.target[0].value === "admin" && e.target[1].value === "password@123") {
      setIsLoggedIn(true);
    } else {
      alert("Invalid credentials");
    }
  };

  const handleChange = (e) => {
    const { name, value, files, options } = e.target;
    if (name === "image") {
      setForm({ ...form, image: files[0] });
    } else if (name === "children") {
      const selectedChildren = Array.from(options)
        .filter((option) => option.selected)
        .map((option) => option.value);
      setForm({ ...form, children: selectedChildren });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleDateChange = (date) => {
    setForm({ ...form, dob: moment(date).format("DD-MM-YYYY") });
  };

  const handleClearChildren = () => {
    setForm({ ...form, children: [] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const apiUrl = import.meta.env.VITE_API_BASE_URL;

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("dob", form.dob);
    formData.append("phone", form.phone);
    formData.append("occupation", form.occupation);
    formData.append("address", form.address);
    formData.append("location", form.location);
    formData.append("about", form.about);
    if (form.spouse) {
      formData.append("spouse", form.spouse);
    }
    if (form.parent) {
      formData.append("parent", form.parent);
    }
    formData.append("children", form.children.join(","));
    if (form.image) {
      formData.append("image", form.image ? form.image : null);
    }

    const url = editingId
      ? `${apiUrl}/api/members/${editingId}`
      : `${apiUrl}/api/members`;
    const method = editingId ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Network response was not ok");
      }
      setForm({
        name: "",
        dob: "",
        phone: "",
        image: null,
        occupation: "",
        address: "",
        spouse: "",
        parent: "",
        children: [],
        location: "",
        about: "",
      });
      setEditingId(null);
      fetchMembers();
    } catch (fetchError) {
      console.error("Submit form failed:", fetchError);
      alert(fetchError.message);
    }
  };

  const handleEdit = (member) => {
    setForm({
      name: member.name || "",
      dob: member.dob ? moment(member.dob).format("DD-MM-YYYY") : "",
      phone: member.phone || "",
      image: member.image ? member.image : null,
      occupation: member.occupation || "",
      address: member.address || "",
      spouse: member.spouse ? member.spouse._id : "",
      parent: "",
      children: member.children.map((child) => child._id),
      location: member.location || "",
      about: member.about || "",
    });
    setEditingId(member._id);
  };

  const handleDelete = async (id) => {
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    const name = members.find((member) => member._id === id).name;
    const confirmed = confirm(`Are you sure to DELETE ${name} ?`);
    if (!confirmed) {
      return;
    }
    try {
      const response = await fetch(`${apiUrl}/api/members/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      fetchMembers();
    } catch (error) {
      console.error("Delete member failed:", error);
    }
  };

  const handleAutoResize = (e) => {
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  };

  if (!isLoggedIn) {
    return (
      <div className="container admin">
        <h1>Admin Login</h1>
        <form onSubmit={handleLogin}>
          <input type="text" placeholder="Username" required />
          <input type="password" placeholder="Password" required />
          <button type="submit">Login</button>
        </form>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Admin Panel</h1>
      <form onSubmit={handleSubmit}>
        <input
          name="name"
          type="text"
          value={form.name}
          onChange={handleChange}
          placeholder="Name"
          required
        />
        <DatePicker
          selected={form.dob ? moment(form.dob, "DD-MM-YYYY").toDate() : null}
          onChange={handleDateChange}
          dateFormat="dd-MM-yyyy"
          placeholderText="DOB (DD-MM-YYYY)"
          required
        />
        <input
          name="phone"
          type="tel"
          value={form.phone}
          onChange={handleChange}
          placeholder="Phone"
        />
        <input
          name="occupation"
          type="text"
          value={form.occupation}
          onChange={handleChange}
          placeholder="Occupation"
        />
        <textarea
          name="address"
          value={form.address}
          onInput={handleAutoResize}
          onChange={handleChange}
          placeholder="Address"
        />
        <input
          name="location"
          type="text"
          value={form.location}
          onChange={handleChange}
          placeholder="location"
        />
        <textarea
          name="about"
          value={form.about}
          onInput={handleAutoResize}
          onChange={handleChange}
          placeholder="About Family"
        />
        <input name="image" type="file" onChange={handleChange} />
        <div className="selects">
          <select
            name="spouse"
            value={form.spouse}
            onChange={handleChange}
            placeholder="Spouse"
          >
            <option value="">Select Spouse</option>
            {members.map((member) => (
              <option key={member._id} value={member._id}>
                {member.name}
              </option>
            ))}
          </select>
          <select
            name="parent"
            value={form.parent}
            onChange={handleChange}
            placeholder="Parent"
          >
            <option value="">Select Parent</option>
            {members.map((member) => (
              <option key={member._id} value={member._id}>
                {member.name}
              </option>
            ))}
          </select>
        </div>
        {/* <select
          name="children"
          value={form.children}
          onChange={handleChange}
          multiple
        >
          {members.map((member) => (
            <option key={member._id} value={member._id}>
              {member.name}
            </option>
          ))}
        </select>
        <button type="button" className="btn-clear" onClick={handleClearChildren}>
          Clear Children
        </button> */}
        <button type="submit" className="btn-submit">
          {editingId ? "Update" : "Add"} Member
        </button>
      </form>
      <input
        type="text"
        placeholder="Search members..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="search-input"
      />
      <ul className="member-list">
        {filteredMembers.map((member) => (
          <li key={member._id} className="member-item">
            <span>
              {member.name}
              {member.phone && ` - ${member.phone}`}
            </span>
            <div className="member-actions">
              <button onClick={() => handleEdit(member)}>Edit</button>
              <button onClick={() => handleDelete(member._id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AdminPanel;
