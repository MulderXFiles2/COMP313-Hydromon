/**
 * AppShell.jsx
 *
 * Top-level layout component for the application.
 * Defines the overall page structure (navigation + content area).
 *
 * All pages are rendered inside this shell to ensure consistent layout.
 */

import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import './AppShell.css';
import AlertToastHost from "../alerts/AlertToastHost";

const AppShell = () => {
    return (
        <div className="app-shell">
            <Navbar />
            <AlertToastHost />
            <main className="content-area">
                <Outlet />
            </main>
        </div>
    );
}

export default AppShell;
