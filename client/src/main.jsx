import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './App.jsx'
import AdminPanel from './AdminPanel.jsx'
import ProjectorQA from './ProjectorQA.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <Router>
            <Routes>
                <Route path="/" element={<App />} />
                <Route path="/admin" element={<AdminPanel />} />
                {/* New Route for Projector Mode */}
                <Route path="/projector" element={<ProjectorQA />} />
            </Routes>
        </Router>
    </React.StrictMode>,
)
