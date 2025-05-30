  import { Link } from "react-router";
  import "./errorpage.css";

  function ErrorPage({ message, code }) {
    return (
      <div className="error-container">
        <h1>Error {code}</h1>
        <p>{message}</p>
        <Link to="/" className="btn btn-primary">
          Go Back Home
        </Link>
      </div>
    );
  }

  export default ErrorPage;
