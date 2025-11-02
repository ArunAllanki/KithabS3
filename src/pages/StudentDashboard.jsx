import { useEffect, useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import API from "../services/api";
import logo from "../Assets/kithabImg.png";
import Card from "../Components/Card.jsx";
import Carousel from "../Components/Carousel.jsx";
import "./StudentDashboard.css";

const StudentDashboard = () => {
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [regulations, setRegulations] = useState([]);
  const [branches, setBranches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedRegulation, setSelectedRegulation] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [searchDone, setSearchDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);

  const backend = process.env.REACT_APP_BACKEND_URL;
  const token = localStorage.getItem("token");

  useEffect(() => {
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
    fetchMeta();
  }, []);

  const filteredBranches = branches.filter(
    (b) =>
      String(b.regulation?._id || b.regulation) === String(selectedRegulation)
  );

  const filteredSubjects = subjects.filter(
    (s) =>
      String(s.branch?._id || s.branch) === String(selectedBranch) &&
      String(s.semester) === String(selectedSemester)
  );

  const handleGetNotes = async () => {
    if (
      !selectedRegulation ||
      !selectedBranch ||
      !selectedSemester ||
      !selectedSubject
    ) {
      alert("Please select all fields");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${backend}/notes/subject/${selectedSubject}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch notes");
      const data = await res.json();
      setFilteredNotes(data.notes || []);
      setSearchDone(true);
    } catch (err) {
      console.error(err);
      setFilteredNotes([]);
      setSearchDone(true);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Download all notes as ZIP ----------------
  const handleDownloadAll = async () => {
    if (!filteredNotes.length) return;
    setDownloadingAll(true);

    try {
      for (const note of filteredNotes) {
        if (!note.uploadedFiles?.length) continue;

        for (const f of note.uploadedFiles) {
          if (!f.fileUrl) continue;

          const res = await fetch(f.fileUrl);
          if (!res.ok) throw new Error(`Failed to fetch ${f.originalName}`);
          const blob = await res.blob();

          const cleanName = f.originalName.replace(/[\\/:"*?<>|]+/g, "_");

          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = `${note.title}_${cleanName}`;
          document.body.appendChild(a);
          a.click();
          a.remove();

          await new Promise((r) => setTimeout(r, 300)); // small delay
        }
      }
    } catch (err) {
      console.error("Error downloading files:", err);
      alert("Failed to download all notes");
    } finally {
      setDownloadingAll(false);
    }
  };

  return (
    <div className="SD-container">
      <header className="header">
        <img className="kithab" src={logo} alt="Kithab-logo" />
      </header>

      <div className="background">
        {[...Array(8)].map((_, i) => (
          <span key={i} className="ball"></span>
        ))}
      </div>

      <div className="dashboard-wrapper">
        <div className="content-stack">
          {/* Filters */}
          <div className="search-section">
            <h2 className="search-title">Search Notes</h2>
            <div className="filters">
              <div className="filter-item">
                <select
                  value={selectedRegulation}
                  onChange={(e) => {
                    setSelectedRegulation(e.target.value);
                    setSelectedBranch("");
                    setSelectedSemester("");
                    setSelectedSubject("");
                    setFilteredNotes([]);
                    setSearchDone(false);
                  }}
                >
                  <option value="">Select Regulation</option>
                  {regulations.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-item">
                <select
                  value={selectedBranch}
                  onChange={(e) => {
                    setSelectedBranch(e.target.value);
                    setSelectedSemester("");
                    setSelectedSubject("");
                    setFilteredNotes([]);
                    setSearchDone(false);
                  }}
                  disabled={!selectedRegulation}
                >
                  <option value="">Select Branch</option>
                  {filteredBranches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-item">
                <select
                  value={selectedSemester}
                  onChange={(e) => {
                    setSelectedSemester(e.target.value);
                    setSelectedSubject("");
                    setFilteredNotes([]);
                    setSearchDone(false);
                  }}
                  disabled={!selectedBranch}
                >
                  <option value="">Select Semester</option>
                  {[...Array(8)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-item">
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  disabled={!selectedSemester}
                >
                  <option value="">Select Subject</option>
                  {filteredSubjects.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-item get-btn-wrapper">
                <button
                  className="get-btn"
                  onClick={handleGetNotes}
                  disabled={loading}
                >
                  {loading ? <span className="btn-spinner" /> : "Get"}
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className={`results-section ${searchDone ? "open" : ""}`}>
            <div className="results-inner">
              <h2 className="results-title">Search Results</h2>
              {searchDone && filteredNotes.length === 0 && !loading ? (
                <p className="no-results">No results found.</p>
              ) : (
                <>
                  <ul className="notes-list">
                    {filteredNotes.map((note) => (
                      <Card key={note._id} note={note} />
                    ))}
                  </ul>
                  {/* {filteredNotes.length > 0 && (
                    <div className="download-all-wrapper">
                      <button
                        className="download-all-btn"
                        onClick={handleDownloadAll}
                        disabled={downloadingAll}
                      >
                        {downloadingAll ? (
                          <span className="btn-spinner" />
                        ) : (
                          "Download All"
                        )}
                      </button>
                    </div>
                  )} */}
                </>
              )}
            </div>
          </div>

          <Carousel />
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
