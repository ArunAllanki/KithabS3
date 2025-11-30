import React, { useState } from "react";
import "./Card.css";

const Card = ({ note }) => {
  const [downloading, setDownloading] = useState(false);
  const [viewing, setViewing] = useState(false);

  // const handleView = () => {
  //   setViewing(true);
  //   if (note.fileUrl) window.open(note.fileUrl, "_blank");
  //   else alert("File URL not available");
  //   setViewing(false);
  // };

  // const handleView = (note) => {
  //   if (note.mimeType === "application/pdf") {
  //     window.open(note.fileUrl, "_blank");
  //   } else {
  //     const a = document.createElement("a");
  //     a.href = note.fileUrl;
  //     a.download = note.title;
  //     document.body.appendChild(a);
  //     a.click();
  //     a.remove();
  //   }
  // };

  const handleView = (note) => {
    console.log("NOTE RECEIVED:", note); // ❤️ Debug test
    if (!note || !note.fileUrl) {
      alert("File missing or note undefined");
      return;
    }

    const mime = note.mimeType?.toLowerCase() || "";

    try {
      if (mime === "application/pdf") {
        // Force open — popup safe
        const newTab = window.open(note.fileUrl, "_blank", "noopener");
        if (!newTab) alert("Popup blocked! Allow popups for this site.");
      } else {
        const a = document.createElement("a");
        a.href = note.fileUrl;
        a.download = note.title;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (error) {
      console.error("View Failed:", error);
      alert("File could not be opened");
    }
  };

  const handleDownload = () => {
    if (!note.fileUrl) return;

    const mime = note.mimeType?.toLowerCase() || "";

    if (mime === "application/pdf") {
      // Open PDF viewer
      window.open(note.fileUrl, "_blank");
    } else {
      // Download non-PDF files
      const a = document.createElement("a");
      a.href = note.fileUrl;
      a.download = note.title;
      document.body.appendChild(a);
      a.click();
      a.remove();
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
        {/* <button
          className="view-btn action-btn"
          onClick={() => handleView(note)}
          disabled={viewing}
        >
          {viewing ? "Opening..." : "View"}
        </button> */}
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
