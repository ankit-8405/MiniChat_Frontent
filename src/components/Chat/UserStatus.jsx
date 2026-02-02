const UserStatus = ({ userId, onlineUsers }) => {
  const isOnline = onlineUsers.includes(userId);

  return (
    <span className={`user-status ${isOnline ? 'online' : 'offline'}`}>
      <span className="status-dot"></span>
    </span>
  );
};

export default UserStatus;
