
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import '../styles/sidebar.css';

const Sidebar = () => {
    const [moviesOpen, setMoviesOpen] = useState(false);

    const toggleMovies = () => {
        setMoviesOpen(!moviesOpen);
    };

    return (
        <div className="sidebar">
            <Link to="/admin/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>
                <h2>LuminaTV Admin</h2>
            </Link>
            <ul>
                <li>
                    <NavLink to="/admin/dashboard" end className={({ isActive }) => (isActive ? "sidebar-link active" : "sidebar-link")}>
                        Dashboard
                    </NavLink>
                </li>
                <li>
                    <div className="sidebar-link menu-item-with-arrow" onClick={toggleMovies}>
                        Movies <span>{moviesOpen ? '▲' : '▼'}</span>
                    </div>
                    <div className={`dropdown-container ${moviesOpen ? 'show' : ''}`}>
                        <NavLink to="/admin/dashboard/movies/add" className="dropdown-item">
                            Add Movie
                        </NavLink>
                        <NavLink to="/admin/dashboard/movies/delete" className="dropdown-item">
                            Delete Movie
                        </NavLink>
                        <NavLink to="/admin/dashboard/movies/edit" className="dropdown-item">
                            Edit Movie
                        </NavLink>
                        <NavLink to="/admin/dashboard/movies/update" className="dropdown-item">
                            Update Movie
                        </NavLink>
                    </div>
                </li>
                {/* Add more menu items here as needed */}
            </ul>
        </div>
    );
};

export default Sidebar;
