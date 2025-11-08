import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import logo from "../Assets/kithabImg.png";
import RCE from "../Assets/RCE_logo.png";
import "./Login.css";

const Login = () => {
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [invalidLogin, setInvalidLogin] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotRole, setForgotRole] = useState("faculty");
  const [forgotId, setForgotId] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (user.role === "admin") navigate("/admin");
    else if (user.role === "faculty") navigate("/faculty");
    else if (user.role === "student") navigate("/student");
  }, [user, navigate]);

  const clearFields = () => {
    setId("");
    setPassword("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setInvalidLogin(false);
    setLoading(true);

    try {
      const result = await login(id, password);
      if (!result.success) {
        setInvalidLogin(true);
        clearFields();
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error(err);
      setInvalidLogin(true);
      clearFields();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="background">
        {[...Array(8)].map((_, i) => (
          <span key={i} className="ball" />
        ))}
      </div>

      <div className="form-container">
        <form className="form" onSubmit={handleSubmit}>
          <div className="logos">
            <img className="RCE" src={RCE} alt="RCE" />
            <span className="seperator"></span>
            <img className="logo" src={logo} alt="logo" />
          </div>
          <input
            type="text"
            placeholder="Login Id"
            value={id}
            onChange={(e) => setId(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="forgot-link" onClick={() => setShowForgotModal(true)}>
            Forgot Password ?
          </div>

          {invalidLogin && (
            <p className="para error">Invalid login credentials !!</p>
          )}

          <div className="login-btn-wrapper">
            <button type="submit" disabled={loading}>
              {loading ? <span className="spinner" /> : "Login"}
            </button>
          </div>
        </form>
      </div>

      {showForgotModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Forgot Password</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!forgotRole || !forgotId) {
                  setForgotMessage("Please select role and enter ID");
                  setForgotSuccess(false);
                  return;
                }
                setForgotLoading(true);
                setForgotMessage("");
                try {
                  const res = await fetch(
                    `${process.env.REACT_APP_BACKEND_URL}/auth/forgot-password`,
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ role: forgotRole, id: forgotId }),
                    }
                  );
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.message || "Error");

                  setForgotMessage(data.message);
                  setForgotSuccess(true);
                  setForgotRole("");
                  setForgotId("");
                } catch (err) {
                  setForgotMessage(err.message);
                  setForgotSuccess(false);
                } finally {
                  setForgotLoading(false);
                }
              }}
            >
              {/* <select
                value={forgotRole}
                onChange={(e) => setForgotRole(e.target.value)}
                required
              >
                <option value="">Select Role</option>
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
              </select> */}

              <input
                type="text"
                placeholder="Emplyee ID"
                // {
                //   forgotRole === "faculty" ? "Employee ID" : "Roll Number"
                // }
                value={forgotId}
                onChange={(e) => setForgotId(e.target.value)}
                required
              />

              <div className="modal-btn-group">
                <button type="submit" disabled={forgotLoading || forgotSuccess}>
                  {forgotLoading ? <span className="spinner" /> : "Reset"}
                </button>
                <button
                  type="button"
                  className="close-btn"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotRole("");
                    setForgotId("");
                    setForgotMessage("");
                    setForgotSuccess(false);
                  }}
                >
                  Close
                </button>
              </div>
            </form>

            {forgotMessage && (
              <p
                style={{
                  marginTop: "10px",
                  color: forgotSuccess ? "green" : "red",
                  fontWeight: "500",
                }}
              >
                {forgotMessage}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="illustration" />
    </div>
  );
};

export default Login;
