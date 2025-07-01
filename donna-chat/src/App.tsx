import { Link, Outlet, useLoaderData } from "react-router-dom";
import "./App.css";

function App() {
  const data = useLoaderData();
  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              width="24"
              height="24"
            >
              <path d="M12 2.25a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3a.75.75 0 0 1 .75-.75zM12 18a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3a.75.75 0 0 1 .75-.75zM5.25 12a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 0 1.5h-3a.75.75 0 0 1-.75-.75zM15 12a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 0 1.5h-3a.75.75 0 0 1-.75-.75zM7.05 7.05a.75.75 0 0 1 1.06 0l2.122 2.121a.75.75 0 0 1-1.06 1.06L7.05 8.11a.75.75 0 0 1 0-1.06zm9.9 9.9a.75.75 0 0 1 1.06 0l2.121 2.121a.75.75 0 1 1-1.06 1.06l-2.121-2.12a.75.75 0 0 1 0-1.061zM16.95 7.05a.75.75 0 0 1 0 1.06l-2.121 2.121a.75.75 0 0 1-1.06-1.06l2.12-2.121a.75.75 0 0 1 1.061 0zm-9.9 9.9a.75.75 0 0 1 0 1.06l-2.121 2.12a.75.75 0 0 1-1.06-1.06l2.12-2.121a.75.75 0 0 1 1.06 0z" />
            </svg>
          </div>
          <h2>Donna</h2>
        </div>

        <nav className="sidebar-nav">
          <Link to="/" className="nav-button">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              width="20"
              height="20"
            >
              <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
              <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
            </svg>
            Home
          </Link>

          <Link to="/chat" className="nav-button">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              width="20"
              height="20"
            >
              <path
                fillRule="evenodd"
                d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z"
                clipRule="evenodd"
              />
            </svg>
            Chat
          </Link>
        </nav>
      </aside>

      <div className="chat-container">
        <main className="chat-content">
          <Outlet context={data} />
        </main>
      </div>
    </div>
  );
}

export default App;
