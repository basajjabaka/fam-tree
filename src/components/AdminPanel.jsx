import { useState, useEffect, useRef } from "react";
import DatePicker from "react-datepicker";
import moment from "moment";
import {
  X,
  Edit3,
  Trash2,
  Image,
  CheckCircle,
  AlertCircle,
  Search,
  User,
  Calendar,
  Phone,
  Briefcase,
  LogOut,
  PlusCircle,
  RefreshCw,
  Clipboard,
} from "lucide-react";
import "react-datepicker/dist/react-datepicker.css";
import "./adminpanel.css";

// Custom hook for viewport scaling
function useViewportScale() {
  // Function to update the viewport meta tag's content
  const setViewportScale = (scale) => {
    let viewport = document.querySelector('meta[name="viewport"]');
    const content = `width=device-width, initial-scale=${scale}, maximum-scale=2, user-scalable=yes`;

    if (!viewport) {
      // Create viewport meta if it doesn't exist
      viewport = document.createElement("meta");
      viewport.name = "viewport";
      document.head.appendChild(viewport);
    }

    // Update the content attribute
    viewport.setAttribute("content", content);
  };

  // Function to save the original viewport settings
  const saveOriginalViewport = () => {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      return viewport.getAttribute("content");
    }
    return "width=device-width, initial-scale=1.0";
  };

  // Set scale based on screen width
  const updateScale = () => {
    const screenWidth = window.innerWidth;

    if (screenWidth <= 480) {
      setViewportScale(0.7); // Strong zoom out for very small screens
    } else if (screenWidth <= 768) {
      setViewportScale(0.8); // Moderate zoom out for medium-small screens
    } else {
      setViewportScale(1.0); // Normal scale for larger screens
    }
  };

  return { updateScale, saveOriginalViewport, setViewportScale };
}

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
  const [imagePreview, setImagePreview] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [notification, setNotification] = useState({ message: "", type: "" });
  const [activeTab, setActiveTab] = useState("form");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [sortOption, setSortOption] = useState("nameAsc");
  const [dragActive, setDragActive] = useState(false);
  const [originalViewport, setOriginalViewport] = useState(null);
  const fileInputRef = useRef(null);
  const { updateScale, saveOriginalViewport, setViewportScale } =
    useViewportScale();

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
    const adminExpiry = localStorage.getItem("adminExpiry");

    if (isAdmin === "true" && adminExpiry) {
      if (new Date().getTime() < parseInt(adminExpiry, 10)) {
        setIsLoggedIn(true);
      } else {
        localStorage.removeItem("isAdmin");
        localStorage.removeItem("adminExpiry");
      }
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchMembers();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (members.length === 0) return;

    let sortedMembers = [...members];

    switch (sortOption) {
      case "nameAsc":
        sortedMembers.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "nameDesc":
        sortedMembers.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "dobNewest":
        sortedMembers.sort((a, b) => {
          if (!a.dob) return 1;
          if (!b.dob) return -1;
          return new Date(b.dob) - new Date(a.dob);
        });
        break;
      case "dobOldest":
        sortedMembers.sort((a, b) => {
          if (!a.dob) return 1;
          if (!b.dob) return -1;
          return new Date(a.dob) - new Date(b.dob);
        });
        break;
      default:
        break;
    }

    setFilteredMembers(
      sortedMembers.filter((member) =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [sortOption, members, searchQuery]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isLoggedIn) return;

      if (
        e.ctrlKey &&
        e.key === "a" &&
        !e.target.matches("input, textarea, select")
      ) {
        e.preventDefault();
        setActiveTab("form");
        resetForm();
        document.getElementById("name")?.focus();
      }

      if (
        e.ctrlKey &&
        e.key === "l" &&
        !e.target.matches("input, textarea, select")
      ) {
        e.preventDefault();
        setActiveTab("list");
        document.querySelector(".search-input")?.focus();
      }

      if (e.ctrlKey && e.key === "s" && activeTab === "form") {
        const nameInput = document.getElementById("name");
        if (nameInput && nameInput.value.trim() !== "") {
          e.preventDefault();
          document.querySelector(".btn-submit")?.click();
        }
      }

      if (e.key === "Escape" && showShortcuts) {
        setShowShortcuts(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLoggedIn, activeTab, showShortcuts]);

  useEffect(() => {
    const savedViewport = saveOriginalViewport();
    setOriginalViewport(savedViewport);

    // Apply appropriate scaling based on screen size
    updateScale();

    // Listen for resize events to adjust scaling
    window.addEventListener("resize", updateScale);

    // Restore original viewport when component unmounts
    return () => {
      if (originalViewport) {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
          viewport.setAttribute("content", originalViewport);
        }
      }
      window.removeEventListener("resize", updateScale);
    };
  }, [originalViewport]);

  const fetchMembers = async () => {
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    try {
      setNotification({ message: "Loading members...", type: "info" });
      const response = await fetch(`${apiUrl}/api/members`);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      setMembers(data);
      setFilteredMembers(data);
      setNotification({ message: "", type: "" });
    } catch (error) {
      console.error("Fetch members failed:", error);
      setNotification({ message: "Failed to load members", type: "error" });
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (e.target[0].value === "admin" && e.target[1].value === "password@123") {
      const expiryTime = new Date().getTime() + 12 * 60 * 60 * 1000;
      localStorage.setItem("isAdmin", "true");
      localStorage.setItem("adminExpiry", expiryTime.toString());
      setIsLoggedIn(true);
    } else {
      setNotification({ message: "Invalid credentials", type: "error" });
      setTimeout(() => setNotification({ message: "", type: "" }), 3000);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("adminExpiry");
  };

  const handleChange = (e) => {
    const { name, value, files, options } = e.target;
    if (name === "image" && files.length > 0) {
      setForm({ ...form, image: files[0] });

      const fileReader = new FileReader();
      fileReader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      fileReader.readAsDataURL(files[0]);
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

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        setForm({ ...form, image: file });

        const fileReader = new FileReader();
        fileReader.onload = (e) => {
          setImagePreview(e.target.result);
        };
        fileReader.readAsDataURL(file);
      }
    }
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
    if (form.image instanceof File) {
      formData.append("image", form.image);
    }

    const url = editingId
      ? `${apiUrl}/api/members/${editingId}`
      : `${apiUrl}/api/members`;
    const method = editingId ? "PUT" : "POST";

    setNotification({ message: "Saving...", type: "info" });

    try {
      const response = await fetch(url, {
        method,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Network response was not ok");
      }

      setNotification({
        message: editingId
          ? "Member updated successfully!"
          : "Member added successfully!",
        type: "success",
      });

      resetForm();
      fetchMembers();

      setTimeout(() => setNotification({ message: "", type: "" }), 3000);
    } catch (fetchError) {
      console.error("Submit form failed:", fetchError);
      setNotification({ message: fetchError.message, type: "error" });
      setTimeout(() => setNotification({ message: "", type: "" }), 5000);
    }
  };

  const resetForm = () => {
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
    setImagePreview(null);
    setCurrentImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleEdit = (member) => {
    setActiveTab("form");
    window.scrollTo({ top: 0, behavior: "smooth" });

    setForm({
      name: member.name || "",
      dob: member.dob ? moment(member.dob).format("DD-MM-YYYY") : "",
      phone: member.phone || "",
      image: null,
      occupation: member.occupation || "",
      address: member.address || "",
      spouse: member.spouse ? member.spouse._id : "",
      parent: "",
      children: member.children?.map((child) => child._id) || [],
      location: member.location || "",
      about: member.about || "",
    });
    setEditingId(member._id);
    setImagePreview(null);
    setCurrentImage(member.image);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (id) => {
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    const name = members.find((member) => member._id === id).name;

    if (!window.confirm(`Are you sure you want to delete ${name}?`)) {
      return;
    }

    setNotification({ message: "Deleting member...", type: "info" });

    try {
      const response = await fetch(`${apiUrl}/api/members/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      setNotification({
        message: "Member deleted successfully!",
        type: "success",
      });
      fetchMembers();

      if (editingId === id) {
        resetForm();
      }

      setTimeout(() => setNotification({ message: "", type: "" }), 3000);
    } catch (error) {
      console.error("Delete member failed:", error);
      setNotification({ message: "Failed to delete member", type: "error" });
    }
  };

  const handleAutoResize = (e) => {
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  const clearImageSelection = () => {
    setForm({ ...form, image: null });
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSelectMember = (id) => {
    const newSelection = selectedMembers.includes(id)
      ? selectedMembers.filter((memberId) => memberId !== id)
      : [...selectedMembers, id];

    setSelectedMembers(newSelection);
    setShowBulkActions(newSelection.length > 0);
  };

  const handleSelectAll = () => {
    const willSelectAll = selectedMembers.length !== filteredMembers.length;

    const newSelection = willSelectAll
      ? filteredMembers.map((member) => member._id)
      : [];

    setSelectedMembers(newSelection);
    setShowBulkActions(newSelection.length > 0);
  };

  const handleBulkDelete = async () => {
    if (selectedMembers.length === 0) return;

    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedMembers.length} members?`
      )
    ) {
      return;
    }

    setNotification({ message: "Deleting members...", type: "info" });
    const apiUrl = import.meta.env.VITE_API_BASE_URL;

    try {
      for (const id of selectedMembers) {
        await fetch(`${apiUrl}/api/members/${id}`, {
          method: "DELETE",
        });
      }

      setNotification({
        message: `Successfully deleted ${selectedMembers.length} members`,
        type: "success",
      });

      setSelectedMembers([]);
      setShowBulkActions(false);
      fetchMembers();

      setTimeout(() => setNotification({ message: "", type: "" }), 3000);
    } catch (error) {
      console.error("Bulk delete failed:", error);
      setNotification({
        message: "Failed to delete some members",
        type: "error",
      });
    }
  };

  const exportMembersToCSV = () => {
    const headers = ["Name", "Date of Birth", "Phone", "Occupation", "Address"];
    const csvRows = [headers.join(",")];

    members.forEach((member) => {
      const row = [
        `"${member.name || ""}"`,
        `"${member.dob ? moment(member.dob).format("DD-MM-YYYY") : ""}"`,
        `"${member.phone || ""}"`,
        `"${member.occupation || ""}"`,
        `"${member.address || ""}"`,
      ];
      csvRows.push(row.join(","));
    });

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `family-members-${moment().format("YYYY-MM-DD")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setNotification({
      message: `Exported ${members.length} members to CSV`,
      type: "success",
    });
    setTimeout(() => setNotification({ message: "", type: "" }), 3000);
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case "add":
        setActiveTab("form");
        resetForm();
        document.getElementById("name")?.focus();
        break;
      case "refresh":
        fetchMembers();
        break;
      case "export":
        exportMembersToCSV();
        break;
      default:
        break;
    }
    setShowQuickMenu(false);
  };

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
  };

  if (!isLoggedIn) {
    // Restore normal viewport for login screen
    if (originalViewport) {
      setViewportScale(1.0);
    }

    return (
      <div className="admin-login-container">
        <div className="login-card">
          <h1>Admin Login</h1>
          {notification.message && (
            <div className={`notification ${notification.type}`}>
              {notification.type === "error" && <AlertCircle size={18} />}
              {notification.message}
            </div>
          )}
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="username">
                <User size={16} className="login-icon" />
                Username
              </label>
              <input
                id="username"
                type="text"
                placeholder="Enter username"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="login-icon"
                >
                  <rect
                    x="3"
                    y="11"
                    width="18"
                    height="11"
                    rx="2"
                    ry="2"
                  ></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Enter password"
                required
              />
            </div>
            <button type="submit" className="btn-primary">
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Apply scaled viewport for admin panel content
  updateScale();

  return (
    <div className="admin-wrapper">
      <header className="admin-header">
        <h1>Anchery Family Admin Panel</h1>
        <button onClick={handleLogout} className="btn-logout">
          <LogOut size={16} />
          Logout
        </button>
      </header>

      {notification.message && (
        <div className={`notification ${notification.type}`}>
          {notification.type === "error" && <AlertCircle size={18} />}
          {notification.type === "success" && <CheckCircle size={18} />}
          {notification.message}
        </div>
      )}

      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === "form" ? "active" : ""}`}
          onClick={() => setActiveTab("form")}
        >
          <User size={16} />
          {editingId ? "Edit Member" : "Add Member"}
        </button>
        <button
          className={`tab-button ${activeTab === "list" ? "active" : ""}`}
          onClick={() => setActiveTab("list")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="icon"
          >
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
          Members List
        </button>
      </div>

      <div className="admin-container">
        <section
          className={`form-section ${activeTab === "form" ? "active" : ""}`}
        >
          <div className="section-header">
            <h2>{editingId ? "Edit Member" : "Add New Member"}</h2>
            {editingId && (
              <button className="btn-cancel" onClick={resetForm}>
                <X size={16} />
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-section-title">Basic Information</div>

            <div className="form-group">
              <label htmlFor="name">
                <User size={16} />
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter full name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="dob">
                <Calendar size={16} />
                Date of Birth
              </label>
              <DatePicker
                id="dob"
                selected={
                  form.dob ? moment(form.dob, "DD-MM-YYYY").toDate() : null
                }
                onChange={handleDateChange}
                dateFormat="dd-MM-yyyy"
                placeholderText="Select date"
                className="date-picker"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">
                <Phone size={16} />
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
              />
            </div>

            <div className="form-group">
              <label htmlFor="occupation">
                <Briefcase size={16} />
                Occupation
              </label>
              <input
                id="occupation"
                name="occupation"
                type="text"
                value={form.occupation}
                onChange={handleChange}
                placeholder="Enter occupation"
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="address">Address</label>
              <textarea
                id="address"
                name="address"
                value={form.address}
                onChange={handleChange}
                onInput={handleAutoResize}
                placeholder="Enter address"
                rows="3"
              />
            </div>

            <div className="form-section-title full-width">
              Additional Information
            </div>

            <div className="form-group full-width">
              <label htmlFor="location">Google Maps Location</label>
              <input
                id="location"
                name="location"
                type="text"
                value={form.location}
                onChange={handleChange}
                placeholder="Paste Google Maps link"
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="about">About Family</label>
              <textarea
                id="about"
                name="about"
                value={form.about}
                onChange={handleChange}
                onInput={handleAutoResize}
                placeholder="Enter family details"
                rows="3"
              />
            </div>

            <div className="form-section-title full-width">Profile Image</div>

            <div
              className={`form-group full-width image-upload-container ${
                dragActive ? "drag-active" : ""
              }`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              {currentImage && !imagePreview && (
                <div className="current-image-container">
                  <p className="current-image-label">Current Image:</p>
                  <div className="image-preview">
                    <img src={currentImage} alt="Current profile" />
                  </div>
                </div>
              )}

              {imagePreview && (
                <div className="image-preview-container">
                  <p className="image-preview-label">New Image:</p>
                  <div className="image-preview">
                    <img src={imagePreview} alt="Preview" />
                    <button
                      type="button"
                      className="clear-image"
                      onClick={clearImageSelection}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}

              <div className="file-input-container">
                <label htmlFor="image" className="file-input-label">
                  <Image size={20} />
                  {imagePreview ? "Change Image" : "Select Image"}
                </label>
                <input
                  ref={fileInputRef}
                  id="image"
                  name="image"
                  type="file"
                  onChange={handleChange}
                  accept="image/*"
                  className="file-input"
                />
              </div>

              <p className="image-help-text">
                JPG or PNG, max 5MB. 16:9 ratio images work best. You can also
                drag and drop an image here.
              </p>
            </div>

            <div className="form-section-title full-width">
              Family Relationships
            </div>

            <div className="form-group">
              <label htmlFor="spouse">Spouse</label>
              <select
                id="spouse"
                name="spouse"
                value={form.spouse}
                onChange={handleChange}
              >
                <option value="">Select Spouse</option>
                {members.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="parent">Parent</label>
              <select
                id="parent"
                name="parent"
                value={form.parent}
                onChange={handleChange}
              >
                <option value="">Select Parent</option>
                {members.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group full-width">
              <button type="submit" className="btn-submit">
                {editingId ? "Update Member" : "Add Member"}
              </button>
            </div>
          </form>
        </section>

        <section
          className={`members-section ${activeTab === "list" ? "active" : ""}`}
        >
          <div className="section-header">
            <h2>
              Members List{" "}
              <span className="member-count">({filteredMembers.length})</span>
            </h2>
            <div className="list-controls">
              <div className="sort-controls">
                <label htmlFor="sort-select">Sort:</label>
                <select
                  id="sort-select"
                  value={sortOption}
                  onChange={handleSortChange}
                  className="sort-select"
                >
                  <option value="nameAsc">Name: A to Z</option>
                  <option value="nameDesc">Name: Z to A</option>
                  <option value="dobNewest">Date of Birth: Newest First</option>
                  <option value="dobOldest">Date of Birth: Oldest First</option>
                </select>
              </div>
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                <Search size={18} className="search-icon" />
              </div>
            </div>
          </div>

          {filteredMembers.length > 0 && (
            <div className="list-actions">
              <div className="select-all-wrapper">
                <input
                  type="checkbox"
                  id="select-all"
                  checked={selectedMembers.length === filteredMembers.length}
                  onChange={handleSelectAll}
                />
                <label htmlFor="select-all">Select All</label>
              </div>

              {showBulkActions && (
                <div className="bulk-actions">
                  <span className="selected-count">
                    {selectedMembers.length} selected
                  </span>
                  <button
                    onClick={handleBulkDelete}
                    className="bulk-action-btn delete"
                    title="Delete Selected"
                  >
                    <Trash2 size={14} />
                    Delete Selected
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="members-list">
            {filteredMembers.length > 0 ? (
              filteredMembers.map((member) => (
                <div key={member._id} className="member-card">
                  <div className="select-member">
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(member._id)}
                      onChange={() => handleSelectMember(member._id)}
                    />
                  </div>
                  {member.image && (
                    <div className="member-image">
                      <img src={member.image} alt={member.name} />
                    </div>
                  )}
                  <div className="member-details">
                    <h3 className="member-name">{member.name}</h3>
                    {member.dob && (
                      <p className="member-dob">
                        <Calendar size={14} />
                        {moment(member.dob).format("DD-MM-YYYY")}
                      </p>
                    )}
                  </div>
                  <div className="member-actions">
                    <button
                      onClick={() => handleEdit(member)}
                      className="action-btn edit"
                      title="Edit"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(member._id)}
                      className="action-btn delete"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-results">
                {searchQuery
                  ? "No members match your search"
                  : "No members found"}
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="quick-actions">
        <button
          className="quick-actions-toggle"
          onClick={() => setShowQuickMenu(!showQuickMenu)}
          title="Quick Actions"
        >
          +
        </button>

        {showQuickMenu && (
          <div className="quick-actions-menu">
            <button
              onClick={() => handleQuickAction("add")}
              className="quick-action-btn"
            >
              <PlusCircle size={16} />
              New Member
            </button>
            <button
              onClick={() => handleQuickAction("refresh")}
              className="quick-action-btn"
            >
              <RefreshCw size={16} />
              Refresh List
            </button>
            <button
              onClick={() => handleQuickAction("export")}
              className="quick-action-btn"
            >
              <Clipboard size={16} />
              Export CSV
            </button>
          </div>
        )}
      </div>

      <div className="keyboard-shortcuts-help">
        <button
          className="shortcuts-toggle"
          onClick={() => setShowShortcuts(!showShortcuts)}
          title="Keyboard Shortcuts"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
            <path d="M6 8h.01"></path>
            <path d="M10 8h.01"></path>
            <path d="M14 8h.01"></path>
            <path d="M18 8h.01"></path>
            <path d="M6 12h.01"></path>
            <path d="M10 12h.01"></path>
            <path d="M14 12h.01"></path>
            <path d="M18 12h.01"></path>
            <path d="M6 16h.01"></path>
            <path d="M10 16h.01"></path>
            <path d="M14 16h.01"></path>
            <path d="M18 16h.01"></path>
          </svg>
        </button>

        {showShortcuts && (
          <div className="shortcuts-panel">
            <h3>Keyboard Shortcuts</h3>
            <ul>
              <li>
                <kbd>Ctrl</kbd> + <kbd>A</kbd> New member
              </li>
              <li>
                <kbd>Ctrl</kbd> + <kbd>L</kbd> Member list
              </li>
              <li>
                <kbd>Ctrl</kbd> + <kbd>S</kbd> Save form
              </li>
              <li>
                <kbd>Esc</kbd> Close this panel
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
