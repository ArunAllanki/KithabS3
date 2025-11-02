import React, { useState } from "react";
import "./Card.css";

const Card = ({ note }) => {
  const [downloading, setDownloading] = useState(false);
  const [viewing, setViewing] = useState(false);

  const handleView = () => {
    setViewing(true);
    if (note.fileUrl) window.open(note.fileUrl, "_blank");
    else alert("File URL not available");
    setViewing(false);
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      if (!note.fileUrl) {
        alert("File URL not available");
        return;
      }

      const res = await fetch(note.fileUrl);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${note.title || "file"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Download failed");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <li className="note-card">
      <div className="note-info">
        <strong className="title">{note.title}</strong>
        <p className="metaData">
          Uploaded by <strong>{note.uploadedBy?.name || "Unknown"}</strong> on{" "}
          <strong>{new Date(note.createdAt).toLocaleDateString()}</strong>
        </p>
      </div>

      <div className="actions">
        <button
          className="view-btn action-btn"
          onClick={handleView}
          disabled={viewing}
        >
          {viewing ? "Opening..." : "View"}
        </button>
        <button
          className="download-btn action-btn"
          onClick={handleDownload}
          disabled={downloading}
        >
          {downloading ? <span className="spinner" /> : "Download"}
        </button>
      </div>
    </li>
  );
};

export default Card;
