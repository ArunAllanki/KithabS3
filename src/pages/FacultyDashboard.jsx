import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API, { setAuthToken } from "../services/api";
import { AuthContext } from "../context/AuthContext";
import Navbar from "../Components/Navbar";
import ManageUploads from "../Components/ManageUploads";
import "./FacultyDashboard.css";

const FacultyDashboard = () => {
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Persistent active section
  const [activeSection, setActiveSection] = useState(
    localStorage.getItem("facultyActiveSection") || "home"
  );

  const handleSectionChange = (section) => {
    setActiveSection(section);
    localStorage.setItem("facultyActiveSection", section);
  };

  const [regulations, setRegulations] = useState([]);
  const [branches, setBranches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [file, setFile] = useState(null);
  const [selectedRegulation, setSelectedRegulation] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadMessage, setUploadMessage] = useState("");

  useEffect(() => {
    if (!token || user.role !== "faculty") navigate("/login");
    setAuthToken(token);

    const fetchMeta = async () => {
      try {
        const [regRes, branchRes, subjectRes] = await Promise.all([
          API.get("/meta/regulations"),
          API.get("/meta/branches"),
          API.get("/meta/subjects?populateBranch=true"),
        ]);
        setRegulations(regRes.data.regulations || []);
        setBranches(branchRes.data.branches || []);
        setSubjects(subjectRes.data.subjects || []);
      } catch (err) {
        console.error(err);
      }
    };

    const fetchUploads = async () => {
      try {
        const res = await API.get("/notes/my-uploads");
        setUploads(res.data || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchMeta();
    fetchUploads();
  }, [token, user, navigate]);

  const filteredBranches = branches.filter(
    (b) => String(b.regulation?._id) === String(selectedRegulation)
  );

  const filteredSubjects = subjects.filter(
    (s) =>
      String(s.branch?._id) === String(selectedBranch) &&
      String(s.semester) === String(selectedSemester)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !selectedRegulation ||
      !selectedBranch ||
      !selectedSemester ||
      !selectedSubject
    )
      return alert("Please select all fields");
    if (!file) return alert("Please select a file");
    if (file.size > 50 * 1024 * 1024) {
      alert("File size exceeds 50MB, try after compressing file");
      setFile(null);
      return;
    }

    try {
      setLoading(true);
      setProgress(0);
      setUploadMessage("");

      const filesMeta = [{ originalName: file.name, fileType: file.type }];
      const uploadRes = await API.post("/notes/upload", { filesMeta });
      const fileData = uploadRes.data.files[0];

      const xhr = new XMLHttpRequest();
      xhr.open("PUT", fileData.uploadUrl, true);
      xhr.setRequestHeader("Content-Type", file.type);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      xhr.onload = async () => {
        if (xhr.status === 200) {
          await API.post("/notes/save-notes", {
            regulation: selectedRegulation,
            branch: selectedBranch,
            semester: selectedSemester,
            subject: selectedSubject,
            uploadedFiles: [{ ...fileData }],
          });

          const updatedUploads = await API.get("/notes/my-uploads");
          setUploads(updatedUploads.data || []);
          setUploadMessage(`✅ "${file.name}" uploaded successfully!`);
          setFile(null);
          setProgress(100);
        } else {
          setUploadMessage("❌ Upload failed. Try again.");
        }
        setLoading(false);
      };

      xhr.onerror = () => {
        setLoading(false);
        setUploadMessage("❌ Upload failed. Try again.");
      };

      xhr.send(file);
    } catch (err) {
      console.error(err);
      setLoading(false);
      setUploadMessage("❌ Upload failed. Try again.");
    }
  };

  const handleViewFile = (note) => {
    if (note.fileUrl) window.open(note.fileUrl, "_blank");
  };

  if (!token || user.role !== "faculty") return <p>Redirecting...</p>;

  return (
    <>
      <Navbar onNavigate={handleSectionChange} />

      <div className="FD-container">
        {activeSection === "manage" ? (
          <ManageUploads />
        ) : (
          <div className="hero-container">
            <div className="part upload">
              <h2>Welcome, {user?.name}</h2>
              <h3>Upload Notes</h3>

              <form className="upload-form" onSubmit={handleSubmit}>
                <select
                  value={selectedRegulation}
                  onChange={(e) => setSelectedRegulation(e.target.value)}
                  required
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
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  required
                  disabled={!selectedRegulation}
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
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  required
                  disabled={!selectedBranch}
                >
                  <option value="">Select Semester</option>
                  {[...Array(8)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  required
                  disabled={!selectedSemester}
                >
                  <option value="">Select Subject</option>
                  {filteredSubjects.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>

                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                  required
                  disabled={loading}
                />

                {uploadMessage && <p className="upload-msg">{uploadMessage}</p>}
                {/* {loading && <p className="progress">{progress}%</p>} */}
                  <p className="warning">The file name cannot be edited. Recheck before uploading.</p>
                <button className="upload-btn" type="submit" disabled={loading}>
                  {loading ? `Uploading ${progress}%` : "Upload"}
                </button>
              </form>
            </div>

            <div className="part uploads">
              <h3>📂 Recent Uploads</h3>
              {uploads.length === 0 ? (
                <p>No uploads yet.</p>
              ) : (
                <ul className="uploads-list">
                  {uploads
                    .slice(-5)
                    .reverse()
                    .map((note) => (
                      <li key={note._id} className="upload-card">
                        <h4>{note.title}</h4>
                        <p>
                          <b>{note.regulation?.name}</b> | <b>Branch:</b>{" "}
                          {note.branch?.name} | <b>Subject:</b>{" "}
                          {note.subject?.name} | <b>Sem:</b> {note.semester}
                        </p>
                        <button onClick={() => handleViewFile(note)}>
                          View
                        </button>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default FacultyDashboard;
