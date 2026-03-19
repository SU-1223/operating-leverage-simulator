import { useRef, useState, useCallback } from 'react';

export default function UploadArea({ onFilesSelected, statusMessage, statusType }) {
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  }, [onFilesSelected]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e) => {
    if (e.target.files.length > 0) {
      onFilesSelected(e.target.files);
    }
  }, [onFilesSelected]);

  return (
    <>
      <div
        className={`upload-area${dragOver ? ' drag-over' : ''}`}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="upload-icon">&#128196;</div>
        <p className="upload-text">
          Drop 10-K PDFs here or{' '}
          <span className="upload-link" onClick={(e) => { e.stopPropagation(); handleClick(); }}>
            browse
          </span>
        </p>
        <p className="upload-hint">Upload multiple filings to compare companies side by side</p>
        <input
          type="file"
          ref={fileInputRef}
          accept=".pdf"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
      {statusMessage && (
        <div
          className={`upload-status ${statusType}`}
          dangerouslySetInnerHTML={{ __html: statusMessage }}
        />
      )}
    </>
  );
}
