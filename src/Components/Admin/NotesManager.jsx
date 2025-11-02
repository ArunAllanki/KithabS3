// src/Components/Admin/NotesManager.jsx
import { useState, useEffect, useContext } from "react";
import API from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import "./NotesManager.css";

const NotesManager = () => {
  const { token, logout } = useContext(AuthContext);

  // Meta data
  const [regulations, setRegulations] = useState([]);
  const [branches, setBranches] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Filters
  const [selectedRegulation, setSelectedRegulation] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  // Notes
  const [notes, setNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [error, setError] = useState("");
  const [searchPerformed, setSearchPerformed] = useState(false);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Faculty modal
  const [showFacultyModal, setShowFacultyModal] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);

  // ===== Fetch meta data once =====
  useEffect(() => {
    if (!token) return;

    const fetchMeta = async () => {
      try {
        const [regsRes, branchesRes, subjectsRes] = await Promise.all([
          API.get("/admin/regulations", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          API.get("/admin/branches", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          API.get("/admin/subjects", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setRegulations(regsRes.data || []);

        const normBranches = (branchesRes.data || []).map((b) => ({
          ...b,
          regulation: b.regulation?._id || b.regulation || null,
        }));
        setBranches(normBranches);

        const normSubjects = (subjectsRes.data || []).map((s) => ({
          ...s,
          branch: s.branch?._id || s.branch || null,
          semester: Number(s.semester?.$numberInt ?? s.semester ?? 0),
        }));
        setSubjects(normSubjects);
      } catch (err) {
        console.error("Error fetching meta:", err);
        if (err.response?.status === 401) logout();
        else setError("Failed to load meta data");
      }
    };

    fetchMeta();
  }, [token, logout]);

  // ===== Derived lists for filters =====
  const filteredBranches = branches.filter(
    (b) => String(b.regulation) === String(selectedRegulation)
  );

  const selectedRegObj = regulations.find(
    (r) => String(r._id) === String(selectedRegulation)
  );

  const semesterOptions = selectedRegObj
    ? Array.from(
        { length: Number(selectedRegObj.numberOfSemesters || 0) },
        (_, i) => i + 1
      )
    : [];

  const filteredSubjects = subjects.filter(
    (s) =>
      String(s.branch) === String(selectedBranch) &&
      Number(s.semester) === Number(selectedSemester)
  );

  // ===== Fetch notes =====
  const fetchNotes = async () => {
    if (
      !selectedRegulation ||
      !selectedBranch ||
      !selectedSemester ||
      !selectedSubject
    )
      return;

    setLoadingNotes(true);
    setSearchPerformed(true);
    setError("");

    try {
      const { data } = await API.get(
        `/admin/notes?regulation=${selectedRegulation}&branch=${selectedBranch}&semester=${selectedSemester}&subject=${selectedSubject}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotes(data || []);
    } catch (err) {
      console.error("Error fetching notes:", err);
      if (err.response?.status === 401) logout();
      else setError("Failed to fetch notes");
      setNotes([]);
    } finally {
      setLoadingNotes(false);
    }
  };

  // ===== Download / View note =====
  const handleDownloadOrView = async (noteId) => {
    if (!noteId) return;

    try {
      const res = await API.get(`/admin/notes/${noteId}/file`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const fileUrl = res.data?.url;
      if (fileUrl) window.open(fileUrl, "_blank");
      else alert("File not available");
    } catch (err) {
      console.error("Error fetching file URL:", err);
      if (err.response?.status === 401) logout();
      else alert("Cannot open file");
    }
  };

  // ===== Delete note =====
  const handleDeleteClick = (note) => {
    setNoteToDelete(note);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!noteToDelete) return;

    setDeleting(true);
    try {
      await API.delete(`/admin/notes/${noteToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotes((prev) => prev.filter((n) => n._id !== noteToDelete._id));
    } catch (err) {
      console.error("Error deleting note:", err);
      if (err.response?.status === 401) logout();
      else setError("Failed to delete note");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setNoteToDelete(null);
    }
  };

  useEffect(() => {
    // Reset notes when filters change
    setNotes([]);
    setSearchPerformed(false);
  }, [selectedRegulation, selectedBranch, selectedSemester, selectedSubject]);

  // ===== Faculty modal =====
  const handleFacultyClick = (faculty) => {
    setSelectedFaculty(faculty || null);
    setShowFacultyModal(true);
  };

  // ===== Clear filters =====
  const clearFilters = () => {
    setSelectedRegulation("");
    setSelectedBranch("");
    setSelectedSemester("");
    setSelectedSubject("");
    setNotes([]);
    setSearchPerformed(false);
    setError("");
  };

  const allFiltersSelected =
    selectedRegulation && selectedBranch && selectedSemester && selectedSubject;

  return (
    <div className="notes-manager-container">
      <h2>Notes Manager (Admin)</h2>

      {/* Filters */}
      <div className="filters">
        <select
          value={selectedRegulation}
          onChange={(e) => {
            setSelectedRegulation(e.target.value);
            setSelectedBranch("");
            setSelectedSemester("");
            setSelectedSubject("");
          }}
        >
          <option value="">Select Regulation</option>
          {regulations.map((r) => (
            <option key={r._id} value={r._id}>
              {r.name}
            </option>
          ))}
        </select>

        <select
          value={selectedBranch}
          onChange={(e) => {
            setSelectedBranch(e.target.value);
            setSelectedSemester("");
            setSelectedSubject("");
          }}
          disabled={!filteredBranches.length}
        >
          <option value="">Select Branch</option>
          {filteredBranches.map((b) => (
            <option key={b._id} value={b._id}>
              {b.name}
            </option>
          ))}
        </select>

        <select
          value={selectedSemester}
          onChange={(e) => {
            setSelectedSemester(e.target.value);
            setSelectedSubject("");
          }}
          disabled={!semesterOptions.length}
        >
          <option value="">Select Semester</option>
          {semesterOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          disabled={!filteredSubjects.length}
        >
          <option value="">Select Subject</option>
          {filteredSubjects.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>

        <button
          className="add-btn"
          onClick={fetchNotes}
          disabled={!allFiltersSelected}
        >
          Get Notes
        </button>
        <button className="add-btn" onClick={clearFilters}>
          Clear Filters
        </button>
      </div>

      {error && <p className="error-msg">{error}</p>}

      {/* Notes Table */}
      <div className="table-container">
        {loadingNotes ? (
          <p>Loading notes...</p>
        ) : searchPerformed && notes.length === 0 ? (
          <p>No notes found</p>
        ) : (
          notes.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Uploaded By</th>
                  <th>Uploaded Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {notes.map((note) => (
                  <tr key={note._id}>
                    <td>{note.title}</td>
                    <td
                      className="clickable"
                      onClick={() => handleFacultyClick(note.uploadedBy)}
                    >
                      {note.uploadedBy
                        ? `${note.uploadedBy.name} (${note.uploadedBy.designation})`
                        : "—"}
                    </td>
                    <td>{new Date(note.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="action-btn"
                        onClick={() => handleDownloadOrView(note._id)}
                        // disabled={!note.fileKey}
                      >
                        Download/View
                      </button>
                      <button
                        className="btn-danger action-btn"
                        onClick={() => handleDeleteClick(note)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Delete Note</h3>
            <p>
              Are you sure you want to delete <b>{noteToDelete?.title}</b>?
            </p>
            <div className="modal-actions">
              <button
                className="action-btn"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="btn-danger action-btn"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Faculty Modal */}
      {showFacultyModal && selectedFaculty && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Faculty Details</h2>
            <div className="faculty-dets-modal">
              <p>
                <b>Name:</b> {selectedFaculty.name || "—"}
              </p>
              <p>
                <b>Email:</b> {selectedFaculty.email || "—"}
              </p>
              <p>
                <b>Employee ID:</b> {selectedFaculty.employeeId || "—"}
              </p>
              <p>
                <b>Designation:</b> {selectedFaculty.designation || "—"}
              </p>
              <p>
                <b>Uploaded Notes:</b>{" "}
                {selectedFaculty.uploadedNotes?.length ?? "0"}
              </p>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowFacultyModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesManager;
