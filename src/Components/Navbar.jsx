import React, { useContext, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Navbar.css";
import logo from "../Assets/kithabImg.png";
import { AuthContext } from "../context/AuthContext";
import { GiHamburgerMenu } from "react-icons/gi";

const Navbar = ({ onNavigate }) => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const toggleDropdown = () => setDropdownOpen((prev) => !prev);

  const handleClickOutside = (e) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
      setDropdownOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <img src={logo} alt="Logo" className="navbar-logo" />
      </div>

      <div className="navbar-right" ref={dropdownRef}>
        <div className="breadcrumb" onClick={toggleDropdown}>
          <GiHamburgerMenu className="breadcrumb-icon" />
        </div>

        {dropdownOpen && (
          <div className="breadcrumb-dropdown">
            <div
              className="dropdown-item"
              onClick={() => {
                onNavigate("home");
                setDropdownOpen(false);
              }}
            >
              Home
            </div>
            <div
              className="dropdown-item"
              onClick={() => {
                onNavigate("manage");
                setDropdownOpen(false);
              }}
            >
              Manage Uploads
            </div>
            <div
              className="dropdown-item l-out"
              onClick={() => {
                handleLogout();
                setDropdownOpen(false);
              }}
            >
              Logout
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
