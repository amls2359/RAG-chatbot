import { useRef, useState } from "react";
import axios from "axios";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL;

function Icon({ children, size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function App() {
  const fileRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [file, setFile] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadError, setUploadError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [search, setSearch] = useState("");

  const handleNewChat = () => {
    setFile(null);
    setSessionId(null);
    setUploadStatus("");
    setUploadError(null);
    setMessages([]);
    setQuestion("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const uploadFile = async (selected) => {
    if (!selected) return;

    setUploadError(null);
    setUploadStatus("");
    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", selected);

    try {
      const res = await axios.post(`${API_URL}/upload`, formData);
      setSessionId(res.data.session_id);
      setUploadStatus(res.data.message);
    } catch (err) {
      const backendMessage = err.response?.data?.error;
      setUploadError(
        backendMessage ||
          "Something went wrong while uploading this PDF. Please try again."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    setUploadError(null);
    setUploadStatus("");
    if (selected) uploadFile(selected);
  };

  const handleAsk = async () => {
    if (!question.trim() || !sessionId || loading) return;

    const asked = question;
    const userMessage = { role: "user", text: asked };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("session_id", sessionId);
      formData.append("question", asked);

      const res = await axios.post(`${API_URL}/chat`, formData);
      const botMessage = { role: "bot", text: res.data.answer };
      setMessages((prev) => [...prev, botMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const chatTitles = messages
    .filter((m) => m.role === "user")
    .map((m) => m.text)
    .filter((t) => t.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="app">
      <aside className={`sidebar ${sidebarOpen ? "open" : "collapsed"}`}>
        {sidebarOpen && (
          <>
            <div className="sidebar-top">
              <div className="brand">
                <span className="brand-name">SmartPDF</span>
              </div>
              <div className="sidebar-actions">
                <button
                  className="icon-btn"
                  type="button"
                  title="New chat"
                  onClick={handleNewChat}
                >
                  <Icon>
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </Icon>
                </button>
                <button
                  className="icon-btn"
                  type="button"
                  title="Collapse sidebar"
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon>
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <path d="M9 4v16" />
                  </Icon>
                </button>
              </div>
            </div>

            <div className="search-wrap">
              <span className="search-icon">
                <Icon size={15}>
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3" />
                </Icon>
              </span>
              <input
                className="search-input"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <nav className="nav-list">
              <button className="nav-item active" type="button">
                <Icon size={16}>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </Icon>
                Chats
              </button>
              <button className="nav-item" type="button" onClick={handleNewChat}>
                <Icon size={16}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                </Icon>
                New PDF chat
              </button>
            </nav>

            <div className="history">
              {chatTitles.length === 0 ? (
                <p className="history-empty">
                  Your questions will show up here after you start chatting.
                </p>
              ) : (
                chatTitles.map((title, i) => (
                  <button key={i} className="history-item" type="button">
                    <span className="history-title">{title}</span>
                    <span className="history-menu">···</span>
                  </button>
                ))
              )}
            </div>

            <div className="sidebar-footer">
              {/* <div className="plan-card">
                <Icon size={18}>
                  <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
                </Icon>
                <span>Chat with any PDF</span>
              </div> */}
            </div>
          </>
        )}
      </aside>

      <main className="main">
        <header className="main-header">
          {!sidebarOpen && (
            <div className="header-left">
              <button
                className="icon-btn"
                type="button"
                title="New chat"
                onClick={handleNewChat}
              >
                <Icon>
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </Icon>
              </button>
              <button
                className="icon-btn"
                type="button"
                title="Expand sidebar"
                onClick={() => setSidebarOpen(true)}
              >
                <Icon>
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <path d="M9 4v16" />
                </Icon>
              </button>
            </div>
          )}
          <div className="header-right">
            <div className="usage">
              <Icon size={14}>
                <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
              </Icon>
              {sessionId ? "Ready" : "No PDF"}
            </div>
            {/* <div className="avatar">U</div> */}
          </div>
        </header>

        <div className="chat-area">
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-brand">SmartPDF</div>
              <p className="empty-hint">
                Upload a PDF, then ask anything about it.
              </p>
              {isUploading && (
                <p className="status-line pending">Processing your PDF…</p>
              )}
              {uploadStatus && !uploadError && (
                <p className="status-line">{uploadStatus}</p>
              )}
            </div>
          ) : (
            <div className="messages">
              {messages.map((msg, i) => (
                <div key={i} className={`message ${msg.role}`}>
                  {msg.role === "bot" && <div className="bot-avatar">S</div>}
                  <div className="bubble">{msg.text}</div>
                </div>
              ))}
              {loading && (
                <div className="message bot">
                  <div className="bot-avatar">S</div>
                  <div className="bubble thinking">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="composer-wrap">
          {file && (
            <div className="attach-chip">
              <Icon size={14}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
              </Icon>
              <span>{file.name}</span>
              <span
                className={`chip-status ${
                  uploadStatus && !uploadError ? "ok" : ""
                }`}
              >
                {isUploading
                  ? "Uploading…"
                  : uploadError
                    ? "Failed"
                    : uploadStatus
                      ? "Ready"
                      : ""}
              </span>
            </div>
          )}

          {uploadStatus && !uploadError && messages.length > 0 && (
            <p className="upload-success">{uploadStatus}</p>
          )}

          {uploadError && (
            <div className="upload-error-banner" role="alert">
              <span className="upload-error-icon">⚠</span>
              <div className="upload-error-text">
                <strong>Couldn't process this PDF</strong>
                <p>{uploadError}</p>
              </div>
              <button
                className="upload-error-dismiss"
                type="button"
                onClick={() => setUploadError(null)}
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          )}

          <div className="composer">
            <input
              ref={fileRef}
              className="file-input"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
            />
            <button
              className="icon-btn composer-icon"
              type="button"
              title="Attach PDF"
              disabled={isUploading}
              onClick={() => fileRef.current?.click()}
            >
              <Icon>
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </Icon>
            </button>
            <input
              className="composer-input"
              type="text"
              value={question}
              placeholder={
                sessionId
                  ? "Ask me something"
                  : "Attach a PDF to start chatting"
              }
              disabled={!sessionId || loading || isUploading}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAsk()}
            />
            <button
              className="send-btn"
              type="button"
              disabled={!sessionId || !question.trim() || loading || isUploading}
              onClick={handleAsk}
              aria-label="Send"
            >
              <Icon size={18}>
                <path d="M5 12h14M13 5l7 7-7 7" />
              </Icon>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
