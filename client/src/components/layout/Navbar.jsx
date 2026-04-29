/**
 * Navbar.jsx
 *
 * Application navigation component.
 * Displays login/register or logout depending on auth state.
 */

import { NavLink, useNavigate } from "react-router-dom";
import { isAuthenticated, signout } from "../../api/auth.api";
import "./Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const loggedIn = isAuthenticated();

  const handleLogout = async () => {
    try {
      await signout();
    } catch (err) {
    } finally {
      navigate("/login");
    }
  };

  return (
    <nav className="navbar">
      <NavLink className="navbar-brand" to={loggedIn ? "/" : "/login"}>
        HydroMon
      </NavLink>

      <ul className="navbar-links">
        {loggedIn ? (
          <>
            <li><NavLink className="nav-btn" to="/">Dashboard</NavLink></li>
            <li><NavLink className="nav-btn" to="/devices">Devices</NavLink></li>
            <li><NavLink className="nav-btn" to="/alerts">Alerts</NavLink></li>
            <li>
              <button
                className="nav-btn nav-btn-accent"
                type="button"
                onClick={handleLogout}
              >
                Logout
              </button>
            </li>
          </>
        ) : (
          <>
            <li><NavLink className="nav-btn" to="/register">Register</NavLink></li>
            <li><NavLink className="nav-btn nav-btn-accent" to="/login">Login</NavLink></li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;