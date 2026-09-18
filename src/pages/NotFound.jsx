import { Link } from "react-router-dom";
export default function NotFound(){
  return <div className="page" style={{textAlign:"center", padding:40}}>
    <h2>404 — Not Found</h2>
    <p className="muted">This page is outside Receptionist scope.</p>
    <Link to="/dashboard" className="btn btn-primary">Back to Dashboard</Link>
  </div>
}
