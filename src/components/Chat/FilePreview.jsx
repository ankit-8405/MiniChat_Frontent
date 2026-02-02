import { useState } from 'react';
import '../../assets/file-preview.css';

const FilePreview = ({ message }) => {
  const [showFullImage, setShowFullImage] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);

  const { fileUrl, fileName, fileSize, mimeType, messageType } = message;

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (mimeType) => {
    if (mimeType?.includes('pdf')) return '📄';
    if (mimeType?.includes('word')) return '📝';
    if (mimeType?.includes('excel') || mimeType?.includes('spreadsheet')) return '📊';
    if (mimeType?.includes('powerpoint') || mimeType?.includes('presentation')) return '📽️';
    if (mimeType?.includes('zip') || mimeType?.includes('rar')) return '🗜️';
    if (mimeType?.includes('text')) return '📃';
    return '📎';
  };

  // Image Preview
  if (messageType === 'image') {
    return (
      <>
        <div className="file-preview image-preview">
          <img 
            src={fileUrl} 
            alt={fileName}
            onClick={() => setShowFullImage(true)}
            loading="lazy"
          />
          <div className="image-info">
            <span className="file-name">{fileName}</span>
            <span className="file-size">{formatFileSize(fileSize)}</span>
          </div>
        </div>

        {/* Full Image Modal */}
        {showFullImage && (
          <div className="file-modal" onClick={() => setShowFullImage(false)}>
            <div className="file-modal-content">
              <button className="btn-close-modal" onClick={() => setShowFullImage(false)}>
                ✕
              </button>
              <img src={fileUrl} alt={fileName} />
              <div className="file-modal-info">
                <span>{fileName}</span>
                <a href={fileUrl} download={fileName} onClick={(e) => e.stopPropagation()}>
                  ⬇️ Download
                </a>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Video Preview
  if (messageType === 'video') {
    return (
      <div className="file-preview video-preview">
        <video controls preload="metadata">
          <source src={fileUrl} type={mimeType} />
          Your browser does not support video playback.
        </video>
        <div className="video-info">
          <span className="file-name">{fileName}</span>
          <span className="file-size">{formatFileSize(fileSize)}</span>
        </div>
      </div>
    );
  }

  // Audio Preview
  if (messageType === 'audio') {
    return (
      <div className="file-preview audio-preview">
        <div className="audio-icon">🎵</div>
        <div className="audio-details">
          <span className="file-name">{fileName}</span>
          <audio controls preload="metadata">
            <source src={fileUrl} type={mimeType} />
            Your browser does not support audio playback.
          </audio>
          <span className="file-size">{formatFileSize(fileSize)}</span>
        </div>
      </div>
    );
  }

  // PDF Preview
  if (mimeType === 'application/pdf') {
    return (
      <>
        <div className="file-preview pdf-preview">
          <div className="pdf-thumbnail" onClick={() => setShowPdfViewer(true)}>
            <span className="pdf-icon">📄</span>
            <div className="pdf-info">
              <span className="file-name">{fileName}</span>
              <span className="file-size">{formatFileSize(fileSize)}</span>
              <button className="btn-view-pdf">View PDF</button>
            </div>
          </div>
        </div>

        {/* PDF Viewer Modal */}
        {showPdfViewer && (
          <div className="file-modal" onClick={() => setShowPdfViewer(false)}>
            <div className="file-modal-content pdf-viewer" onClick={(e) => e.stopPropagation()}>
              <div className="pdf-viewer-header">
                <span>{fileName}</span>
                <div className="pdf-actions">
                  <a href={fileUrl} download={fileName} className="btn-download">
                    ⬇️ Download
                  </a>
                  <button className="btn-close-modal" onClick={() => setShowPdfViewer(false)}>
                    ✕
                  </button>
                </div>
              </div>
              <iframe 
                src={fileUrl} 
                title={fileName}
                width="100%"
                height="100%"
              />
            </div>
          </div>
        )}
      </>
    );
  }

  // Generic File Preview
  return (
    <div className="file-preview generic-file">
      <div className="file-icon">{getFileIcon(mimeType)}</div>
      <div className="file-details">
        <span className="file-name">{fileName}</span>
        <span className="file-size">{formatFileSize(fileSize)}</span>
        <a href={fileUrl} download={fileName} className="btn-download-file">
          ⬇️ Download
        </a>
      </div>
    </div>
  );
};

export default FilePreview;
