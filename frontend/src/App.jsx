import { useState } from "react";
import axios from "axios";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [file, setFile] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadError, setUploadError] = useState(null); // NEW: holds a clean error message, separate from success status
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;

    setUploadError(null);
    setUploadStatus("");
    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(`${API_URL}/upload`, formData);
      setSessionId(res.data.session_id);
      setUploadStatus(res.data.message);
    } catch (err) {
      // The backend returns a clean { "error": "..." } body on 400 —
      // surface that message directly instead of a generic failure string.
      const backendMessage = err.response?.data?.error;
      setUploadError(
        backendMessage || "Something went wrong while uploading this PDF. Please try again."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleAsk = async () => {
    if (!question.trim() || !sessionId) return;

    const userMessage = { role: "user", text: question };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("session_id", sessionId);
      formData.append("question", question);

      const res = await axios.post(`${API_URL}/chat`, formData);
      const botMessage = { role: "bot", text: res.data.answer };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <h1>Chat with your PDF</h1>

      <div className="upload-section">
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => {
            setFile(e.target.files[0]);
            setUploadError(null); // clear any previous error when a new file is chosen
            setUploadStatus("");
          }}
        />
        <button onClick={handleUpload} disabled={isUploading}>
          {isUploading ? "Processing..." : "Upload"}
        </button>

        {uploadStatus && <p className="upload-success">{uploadStatus}</p>}

        {uploadError && (
          <div className="upload-error-banner" role="alert">
            <span className="upload-error-icon">⚠</span>
            <div className="upload-error-text">
              <strong>Couldn't process this PDF</strong>
              <p>{uploadError}</p>
            </div>
            <button
              className="upload-error-dismiss"
              onClick={() => setUploadError(null)}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {sessionId && (
        <div className="chat-section">
          <div className="messages">
            {messages.map((msg, i) => (
              <div key={i} className={`message ${msg.role}`}>
                {msg.text}
              </div>
            ))}
            {loading && <div className="message bot">Thinking...</div>}
          </div>

          <div className="input-row">
            <input
              type="text"
              value={question}
              placeholder="Ask a question about the document..."
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAsk()}
            />
            <button onClick={handleAsk}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;