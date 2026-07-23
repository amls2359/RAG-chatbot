import { useRef, useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [file, setFile] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleNewChat = () => {
    setFile(null);
    setSessionId(null);
    setUploadStatus("");
    setMessages([]);
    setQuestion("");
    setLoading(false);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileSelect = async (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setUploading(true);
    setUploadStatus("Processing document...");

    const formData = new FormData();
    formData.append("file", selected);

    try {
      const res = await axios.post(`${API_URL}/upload`, formData);
      setSessionId(res.data.session_id);
      setUploadStatus(res.data.message);
      setMessages([]);
    } catch {
      setUploadStatus("Upload failed. Check backend logs.");
      setSessionId(null);
    } finally {
      setUploading(false);
    }
  };

  const handleAsk = async () => {
    if (!question.trim() || !sessionId || loading) return;

    const currentQuestion = question;
    const userMessage = { role: "user", text: currentQuestion };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("session_id", sessionId);
      formData.append("question", currentQuestion);

      const res = await axios.post(`${API_URL}/chat`, formData);
      const botMessage = { role: "bot", text: res.data.answer };
      setMessages((prev) => [...prev, botMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Something went wrong." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const chatTitle = file?.name?.replace(/\.pdf$/i, "") || "New chat";

  return (
    <div className="app">
      <aside className={`sidebar ${sidebarOpen ? "open" : "collapsed"}`}>
        <div className="sidebar-top">
          <div className="brand">
            <span className="brand-mark">SP</span>
            {sidebarOpen && <span className="brand-name">SmartPDF</span>}
          </div>
          <div className="sidebar-actions">
            {/* <button
              className="icon-btn"
              onClick={handleNewChat}
              title="New chat"
              aria-label="New chat"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </button> */}
            <button
              className="icon-btn"
              onClick={() => setSidebarOpen((v) => !v)}
              title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              aria-label="Toggle sidebar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 3v18" />
              </svg>
            </button>
          </div>
        </div>

        {sidebarOpen && (
          <>
            <div className="search-wrap">
              <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input type="text" placeholder="Search" className="search-input" />
            </div>

            <nav className="nav-list">
              <button className="nav-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
                My projects
              </button>
              <button className="nav-item active">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                Chats
              </button>
              <button className="nav-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
                Templates
              </button>
              <button className="nav-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
                Settings
              </button>
              <button className="nav-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                Teams
              </button>
            </nav>

            <div className="history">
              {sessionId ? (
                <button className="history-item active">
                  <span className="history-title">{chatTitle}</span>
                  <span className="history-menu">···</span>
                </button>
              ) : (
                <p className="history-empty">Upload a PDF to start chatting</p>
              )}
            </div>

            <div className="sidebar-footer">
              {/* <div className="plan-card">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L5.7 21 8 14 2 9.4h7.6z" />
                </svg>
                <span>Update the plan</span>
              </div> */}
            </div>
          </>
        )}
      </aside>

      <main className="main">
        <header className="main-header">
          {!sidebarOpen && (
            <button
              className="icon-btn mobile-menu"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 3v18" />
              </svg>
            </button>
          )}
          {/* <div className="header-right">
            <div className="usage">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L5.7 21 8 14 2 9.4h7.6z" />
              </svg>
              <span>{sessionId ? "Ready" : "—"}</span>
            </div>
            <div className="avatar" aria-hidden="true">
              A
            </div>
          </div> */}
        </header>

        <div className="chat-area">
          {messages.length === 0 && !loading ? (
            <div className="empty-state">
              <h1 className="empty-brand">SmartPDF</h1>
              <p className="empty-hint">
                {sessionId
                  ? "Ask anything about your document"
                  : "Attach a PDF with the paperclip, then ask away"}
              </p>
              {/* {uploadStatus && (
                <p className={`status-line ${uploading ? "pending" : ""}`}>
                  {uploadStatus}
                </p>
              )} */}
            </div>
          ) : (
            <div className="messages">
              {messages.map((msg, i) => (
                <div key={i} className={`message ${msg.role}`}>
                  {msg.role === "bot" && (
                    <div className="bot-avatar" aria-hidden="true">
                      V
                    </div>
                  )}
                  <div className="bubble">{msg.text}</div>
                </div>
              ))}
              {loading && (
                <div className="message bot">
                  <div className="bot-avatar" aria-hidden="true">
                    V
                  </div>
                  <div className="bubble thinking">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="composer-wrap">
          {file && (
            <div className="attach-chip">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
              </svg>
              <span>{file.name}</span>
              {uploading && <span className="chip-status">Uploading…</span>}
              {!uploading && sessionId && <span className="chip-status ok">Ready</span>}
            </div>
          )}

          <div className="composer">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileSelect}
              className="file-input"
              id="pdf-upload"
            />
            <button
              className="icon-btn composer-icon"
              onClick={() => fileInputRef.current?.click()}
              title="Upload PDF"
              aria-label="Upload PDF"
              disabled={uploading}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </button>

            <input
              type="text"
              className="composer-input"
              value={question}
              placeholder="Ask me something"
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAsk()}
              disabled={!sessionId || uploading}
            />

            <button
              className="send-btn"
              onClick={handleAsk}
              disabled={!sessionId || !question.trim() || loading || uploading}
              aria-label="Send"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
