import { useState, useEffect, useContext } from "react";
import API from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import "./FacultyManager.css";

const FacultyManager = () => {
  const { token } = useContext(AuthContext);

  const [masterFacultyList, setMasterFacultyList] = useState([]); // NEW: full original list
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUploadsModal, setShowUploadsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedFaculty, setSelectedFaculty] = useState(null);

  const defaultForm = {
    employeeId: "",
    name: "",
    email: "",
    designation: "",
    password: "",
    confirmPassword: "",
  };
  const [formData, setFormData] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [uploads, setUploads] = useState([]);
  const [uploadsLoading, setUploadsLoading] = useState(false);

  const [searchText, setSearchText] = useState(""); // NEW: search state

  const fetchFaculty = async () => {
    setLoading(true);
    try {
      const res = await API.get("/admin/faculty", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data || [];
      setMasterFacultyList(data); // store full list
      setFacultyList(data); // visible list
    } catch (err) {
      console.error("Error fetching faculty", err);
      setError("Failed to fetch faculty");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchFaculty();
  }, [token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = (isAdd = false) => {
    const { employeeId, name, email, designation, password, confirmPassword } =
      formData;
    const newErrors = {};

    if (!employeeId) newErrors.employeeId = "Employee ID is required";
    if (!name) newErrors.name = "Name is required";
    if (!email) newErrors.email = "Email is required";
    if (!designation) newErrors.designation = "Designation is required";

    if (isAdd || password || confirmPassword) {
      if (!password) newErrors.password = "Password is required";
      if (!confirmPassword)
        newErrors.confirmPassword = "Confirm password is required";
      if (password && confirmPassword && password !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
      if (password && password.length < 6)
        newErrors.password = "Password must be at least 6 characters";
    }

    // checking dups in frontend – use masterFacultyList (NOT filtered list)
    const emailExists = masterFacultyList.some(
      (f) =>
        f.email === email && (!selectedFaculty || f._id !== selectedFaculty._id)
    );
    if (emailExists) newErrors.email = "Email already exists";

    const idExists = masterFacultyList.some(
      (f) =>
        f.employeeId === employeeId &&
        (!selectedFaculty || f._id !== selectedFaculty._id)
    );
    if (idExists) newErrors.employeeId = "Employee ID already exists";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddFaculty = async () => {
    if (!validateForm(true)) return;
    setSubmitting(true);
    try {
      await API.post("/admin/faculty", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowAddModal(false);
      setFormData(defaultForm);
      fetchFaculty();
    } catch (err) {
      console.error("Add faculty error", err);
      setErrors({
        general: err.response?.data?.message || "Failed to add faculty",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditFaculty = async () => {
    if (!validateForm(false)) return;
    setSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        designation: formData.designation,
      };
      if (formData.password) payload.password = formData.password;

      await API.put(`/admin/faculty/${selectedFaculty._id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setShowEditModal(false);
      setSelectedFaculty(null);
      setFormData(defaultForm);
      fetchFaculty();
    } catch (err) {
      console.error("Edit faculty error", err);
      setErrors({
        general: err.response?.data?.message || "Failed to edit faculty",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFaculty = async () => {
    if (!selectedFaculty) return;
    setSubmitting(true);
    try {
      await API.delete(`/admin/faculty/${selectedFaculty._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowDeleteModal(false);
      setSelectedFaculty(null);
      fetchFaculty();
    } catch (err) {
      console.error("Delete faculty error", err);
      alert(err.response?.data?.message || "Failed to delete faculty");
    } finally {
      setSubmitting(false);
    }
  };

  const fetchUploads = async (facultyId) => {
    setUploadsLoading(true);
    try {
      const res = await API.get(`/admin/faculty/${facultyId}/uploads`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUploads(res.data || []);
    } catch (err) {
      console.error("Error fetching uploads", err);
      alert("Failed to fetch uploads");
    } finally {
      setUploadsLoading(false);
    }
  };

  const openUploadsModal = (faculty) => {
    setSelectedFaculty(faculty);
    setUploads([]);
    setShowUploadsModal(true);
    fetchUploads(faculty._id);
  };

  const openAddModal = () => {
    setFormData(defaultForm);
    setErrors({});
    setShowAddModal(true);
  };

  const openEditModal = (faculty) => {
    setSelectedFaculty(faculty);
    setFormData({
      employeeId: faculty.employeeId || "",
      name: faculty.name || "",
      email: faculty.email || "",
      designation: faculty.designation || "",
      password: "",
      confirmPassword: "",
    });
    setErrors({});
    setShowEditModal(true);
  };

  // ---- Search handlers (NEW) ----
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchText(value);

    const query = value.trim().toLowerCase();
    if (!query) {
      setFacultyList(masterFacultyList);
      return;
    }

    const filtered = masterFacultyList.filter((f) =>
      f.name.toLowerCase().includes(query)
    );
    setFacultyList(filtered);
  };

  const handleClearSearch = () => {
    setSearchText("");
    setFacultyList(masterFacultyList);
  };

  return (
    <div className="faculty-manager-container">
      <h2>Faculty Manager (Admin)</h2>

      {/* Top row: Add + Search */}
      <div className="faculty-top-row">
        <button className="add-btn" onClick={openAddModal}>
          Add Faculty
        </button>

        <div className="faculty-search-wrapper">
          <input
            type="text"
            className="faculty-search-input"
            placeholder="Search faculty by name..."
            value={searchText}
            onChange={handleSearchChange}
          />
          {searchText && (
            <button
              type="button"
              className="faculty-search-clear"
              onClick={handleClearSearch}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {error && <p className="error-msg">{error}</p>}
      <div className="table-container">
        {loading ? (
          <p>Loading faculty...</p>
        ) : facultyList.length === 0 ? (
          <p>No faculty found</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Designation</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {facultyList.map((f) => (
                <tr key={f._id}>
                  <td>{f.employeeId}</td>
                  <td>{f.name}</td>
                  <td>{f.email}</td>
                  <td>{f.designation}</td>
                  <td>
                    <button
                      className="action-btn"
                      onClick={() => openUploadsModal(f)}
                    >
                      Uploads
                    </button>
                    <button
                      className="action-btn"
                      onClick={() => openEditModal(f)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-danger action-btn"
                      onClick={() => {
                        setSelectedFaculty(f);
                        setShowDeleteModal(true);
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {/* add modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Add Faculty</h3>
            {errors.general && <p className="modal-error">{errors.general}</p>}

            {errors.employeeId && (
              <p className="field-error">{errors.employeeId}</p>
            )}
            <input
              name="employeeId"
              placeholder="Employee ID"
              value={formData.employeeId}
              onChange={handleInputChange}
              autoComplete="off"
            />

            {errors.name && <p className="field-error">{errors.name}</p>}
            <input
              name="name"
              placeholder="Name"
              value={formData.name}
              onChange={handleInputChange}
              autoComplete="off"
            />

            {errors.email && <p className="field-error">{errors.email}</p>}
            <input
              name="email"
              placeholder="Email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              autoComplete="off"
            />

            {errors.designation && (
              <p className="field-error">{errors.designation}</p>
            )}
            <input
              name="designation"
              placeholder="Designation"
              value={formData.designation}
              onChange={handleInputChange}
              autoComplete="off"
            />

            {errors.password && (
              <p className="field-error">{errors.password}</p>
            )}
            <input
              name="password"
              placeholder="Password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              autoComplete="off"
            />

            {errors.confirmPassword && (
              <p className="field-error">{errors.confirmPassword}</p>
            )}
            <input
              name="confirmPassword"
              placeholder="Confirm Password"
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              autoComplete="off"
            />

            <div className="modal-actions">
              <button
                onClick={() => setShowAddModal(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button onClick={handleAddFaculty} disabled={submitting}>
                {submitting ? "Adding..." : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* modal edit */}
      {showEditModal && selectedFaculty && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Edit Faculty</h3>
            {errors.general && <p className="modal-error">{errors.general}</p>}

            {errors.employeeId && (
              <p className="field-error">{errors.employeeId}</p>
            )}
            <input
              name="employeeId"
              placeholder="Employee ID"
              value={formData.employeeId}
              onChange={handleInputChange}
              disabled
              autoComplete="off"
            />

            {errors.name && <p className="field-error">{errors.name}</p>}
            <input
              name="name"
              placeholder="Name"
              value={formData.name}
              onChange={handleInputChange}
              autoComplete="off"
            />

            {errors.email && <p className="field-error">{errors.email}</p>}
            <input
              name="email"
              placeholder="Email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              autoComplete="off"
            />

            {errors.designation && (
              <p className="field-error">{errors.designation}</p>
            )}
            <input
              name="designation"
              placeholder="Designation"
              value={formData.designation}
              onChange={handleInputChange}
              autoComplete="off"
            />

            {errors.password && (
              <p className="field-error">{errors.password}</p>
            )}
            <input
              name="password"
              placeholder="New Password (leave blank to keep current)"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              autoComplete="off"
            />

            {errors.confirmPassword && (
              <p className="field-error">{errors.confirmPassword}</p>
            )}
            <input
              name="confirmPassword"
              placeholder="Confirm New Password"
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              autoComplete="off"
            />

            <div className="modal-actions">
              <button
                onClick={() => setShowEditModal(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button onClick={handleEditFaculty} disabled={submitting}>
                {submitting ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* delete modal */}
      {showDeleteModal && selectedFaculty && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Delete Faculty</h3>
            <p>
              Are you sure you want to delete <b>{selectedFaculty.name}</b>?
            </p>
            <div className="modal-actions">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={handleDeleteFaculty}
                disabled={submitting}
              >
                {submitting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* uploads modal */}
      {showUploadsModal && selectedFaculty && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{selectedFaculty.name}'s Uploads</h3>
            {uploadsLoading ? (
              <p>Loading uploads...</p>
            ) : uploads.length > 0 ? (
              <ul>
                {uploads.map((n) => (
                  <li key={n._id}>
                    {n.title} ({n.subject?.name || "No Subject"} -{" "}
                    {n.branch?.name || "No Branch"})
                  </li>
                ))}
              </ul>
            ) : (
              <p>No uploads</p>
            )}
            <div className="modal-actions">
              <button onClick={() => setShowUploadsModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyManager;
