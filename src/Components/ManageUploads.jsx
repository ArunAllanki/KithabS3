import { useState, useEffect } from "react";
import API from "../services/api";
import "./ManageUploads.css";

const ManageUploads = () => {
  const [uploads, setUploads] = useState([]);
  const [regulations, setRegulations] = useState([]);
  const [branches, setBranches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filters, setFilters] = useState({
    regulation: "",
    branch: "",
    semester: "",
    subject: "",
  });
  const [selectedNote, setSelectedNote] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false); // Spinner state

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [uploadRes, regRes, branchRes, subRes] = await Promise.all([
          API.get("/notes/my-uploads"),
          API.get("/meta/regulations"),
          API.get("/meta/branches"),
          API.get("/meta/subjects?populateBranch=true"),
        ]);

        setUploads(
          (uploadRes.data || []).sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          )
        );

        setRegulations(regRes.data.regulations || []);
        setBranches(branchRes.data.branches || []);
        setSubjects(subRes.data.subjects || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ regulation: "", branch: "", semester: "", subject: "" });
  };

  // Dynamic filtering
  const filteredUploads = uploads.filter((u) => {
    return (
      (!filters.regulation || u.regulation?._id === filters.regulation) &&
      (!filters.branch || u.branch?._id === filters.branch) &&
      (!filters.semester || String(u.semester) === String(filters.semester)) &&
      (!filters.subject || u.subject?._id === filters.subject)
    );
  });

  const handleDelete = async () => {
    if (!selectedNote) return;
    try {
      setDeleting(true);
      await API.delete(`/notes/${selectedNote._id}`);
      setUploads((prev) => prev.filter((u) => u._id !== selectedNote._id));
      setShowDeleteModal(false);
      setSelectedNote(null);
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Delete failed. Try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mu-container">
      {/* Filters */}
      <div className="mu-filters-card">
        <div className="mu-filters">
          <select
            value={filters.regulation}
            onChange={(e) => handleFilterChange("regulation", e.target.value)}
          >
            <option value="">All Regulations</option>
            {regulations.map((r) => (
              <option key={r._id} value={r._id}>
                {r.name}
              </option>
            ))}
          </select>

          <select
            value={filters.branch}
            onChange={(e) => handleFilterChange("branch", e.target.value)}
          >
            <option value="">All Branches</option>
            {branches
              .filter((b) =>
                filters.regulation
                  ? b.regulation?._id === filters.regulation
                  : true
              )
              .map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
          </select>

          <select
            value={filters.semester}
            onChange={(e) => handleFilterChange("semester", e.target.value)}
          >
            <option value="">All Semesters</option>
            {[...Array(8)].map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>

          <select
            value={filters.subject}
            onChange={(e) => handleFilterChange("subject", e.target.value)}
          >
            <option value="">All Subjects</option>
            {subjects
              .filter(
                (s) =>
                  (!filters.branch || s.branch?._id === filters.branch) &&
                  (!filters.semester ||
                    String(s.semester) === String(filters.semester))
              )
              .map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
          </select>

          <button className="mu-clear-btn" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="mu-cards">
        {filteredUploads.length === 0 ? (
          <p>No uploads found.</p>
        ) : (
          filteredUploads.map((u) => (
            <div className="mu-card" key={u._id}>
              <h4>{u.title}</h4>
              <p>
                <strong>Regulation:</strong> {u.regulation?.name}
              </p>
              <p>
                <strong>Branch:</strong> {u.branch?.name}
              </p>
              <p>
                <strong>Subject:</strong> {u.subject?.name}
              </p>
              <p>
                <strong>Semester:</strong> {u.semester}
              </p>

              <div className="mu-card-actions">
                <button
                  className="mu-view-btn"
                  onClick={() => window.open(u.fileUrl, "_blank")}
                >
                  View
                </button>
                <button
                  className="mu-delete-btn"
                  onClick={() => {
                    setSelectedNote(u);
                    setShowDeleteModal(true);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && selectedNote && (
        <div className="mu-modal-overlay">
          <div className="mu-modal-content">
            <h3>Confirm Delete?</h3>
            <p>Are you sure you want to delete "{selectedNote.title}"?</p>
            <div className="mu-modal-actions">
              <button
                className="mu-confirm-btn"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? <span className="btn-spinner" /> : "Delete"}
              </button>
              <button
                className="mu-cancel-btn"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUploads;
