import { useState, useEffect, useRef } from 'react';
import '../../assets/context-menu.css';

const MessageContextMenu = ({ 
  message, 
  position, 
  onClose, 
  onEdit, 
  onDelete, 
  onPin, 
  onReply,
  onCopy,
  canEdit,
  canDelete,
  canPin
}) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleAction = (action) => {
    action();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{
        top: position.y,
        left: position.x
      }}
    >
      <button onClick={() => handleAction(() => onReply(message))}>
        💬 Reply in Thread
      </button>
      
      {canEdit && (
        <button onClick={() => handleAction(() => onEdit(message))}>
          ✏️ Edit Message
        </button>
      )}
      
      {canPin && (
        <button onClick={() => handleAction(() => onPin(message))}>
          📌 {message.isPinned ? 'Unpin' : 'Pin'} Message
        </button>
      )}
      
      <button onClick={() => handleAction(() => onCopy(message.text))}>
        📋 Copy Text
      </button>
      
      {canDelete && (
        <>
          <div className="context-menu-divider"></div>
          <button 
            className="context-menu-danger" 
            onClick={() => handleAction(() => onDelete(message))}
          >
            🗑️ Delete Message
          </button>
        </>
      )}
    </div>
  );
};

export default MessageContextMenu;
