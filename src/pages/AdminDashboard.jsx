import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import MetaManager from "../Components/Admin/MetaManager.jsx";
import NotesManager from "../Components/Admin/NotesManager.jsx";
// import UserManager from "../Components/Admin/UserManager.jsx";
import "./AdminDashboard.css";
import logo from "../Assets/kithabImg.png";
import RCE from "../Assets/RCE_logo.png";
import FacultyManager from "../Components/Admin/FacultyManager.jsx";

const AdminDashboard = () => {
  const { token, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState("dashboard");
  const [activeSubsection, setActiveSubsection] = useState("");

  useEffect(() => {
    if (!token || user?.role !== "admin") {
      logout();
      navigate("/login");
    }
  }, [token, user, logout, navigate]);

  const handleSubsectionClick = (section, subsection) => {
    setActiveSection(section);
    setActiveSubsection(subsection);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <h2>Welcome, Admin 👋</h2>;
      case "manageData":
        if (!activeSubsection) return <h2>Select a subsection</h2>;
        return <MetaManager token={token} subsection={activeSubsection} />;
      case "manageNotes":
        return <NotesManager token={token} />;
      case "manageFaculty":
        return <FacultyManager token={token} userType="faculty" />;
      case "analytics":
        return <h2>Analytics Dashboard (Coming Soon)</h2>;
      case "settings":
        return <h2>Settings (Coming Soon)</h2>;
      default:
        return <h2>Select a section</h2>;
    }
  };

  return (
    <div className="admin-dashboard">
      <aside className="sidebar">
        <div className="sidebar-logos">
          <img className="sidebar-RCE" src={RCE} alt="RCE" />
          <img className="sidebar-logo" src={logo} alt="Logo" />
        </div>
        <h1 className="sidebar-title">Admin Panel</h1>
        <ul className="sidebar-list">
          <li
            className={activeSection === "dashboard" ? "active-section" : ""}
            onClick={() => {
              setActiveSection("dashboard");
              setActiveSubsection("");
            }}
          >
            Dashboard (Home)
          </li>

          <li>
            Manage Data
            <ul className="sidebar-sublist">
              <li
                className={activeSubsection === "regulations" ? "active" : ""}
                onClick={() =>
                  handleSubsectionClick("manageData", "regulations")
                }
              >
                Regulations
              </li>
              <li
                className={activeSubsection === "branches" ? "active" : ""}
                onClick={() => handleSubsectionClick("manageData", "branches")}
              >
                Branches
              </li>
              <li
                className={activeSubsection === "subjects" ? "active" : ""}
                onClick={() => handleSubsectionClick("manageData", "subjects")}
              >
                Subjects
              </li>
            </ul>
          </li>

          <li
            className={activeSection === "manageNotes" ? "active-section" : ""}
            onClick={() => {
              setActiveSection("manageNotes");
              setActiveSubsection("");
            }}
          >
            Manage Notes
          </li>

          <li
            className={
              activeSection === "manageFaculty" ? "active-section" : ""
            }
            onClick={() => {
              setActiveSection("manageFaculty");
              setActiveSubsection("");
            }}
          >
            Manage Faculty
          </li>

          {/* <li
            className={activeSection === "analytics" ? "active-section" : ""}
            onClick={() => setActiveSection("analytics")}
          >
            Analytics
          </li>

          <li
            className={activeSection === "settings" ? "active-section" : ""}
            onClick={() => setActiveSection("settings")}
          >
            Settings
          </li> */}
        </ul>

        <div className="sidebar-logout" onClick={handleLogout}>
          Logout
        </div>
      </aside>

      <main className="dashboard-content">{renderContent()}</main>
    </div>
  );
};

export default AdminDashboard;
