import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import ProfileModal from '../Profile/ProfileModal';
import { MenuIcon, UserIcon, MoonIcon, SunIcon } from '../Icons/Icons';

const Navbar = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button className="menu-toggle" onClick={onMenuToggle} title="Toggle Menu">
          <MenuIcon size={24} />
        </button>
        <div className="navbar-brand">
          <h1>Chat App</h1>
        </div>
      </div>
      <div className="navbar-user">
        <span>Welcome, {user?.username}</span>
        <button 
          onClick={() => setShowProfile(true)} 
          className="btn-profile"
          title="Edit Profile"
        >
          {user?.avatar ? (
            <img src={user.avatar} alt="Avatar" className="profile-avatar-small" />
          ) : (
            <UserIcon size={22} />
          )}
        </button>
        <button 
          onClick={toggleTheme} 
          className="btn-theme-toggle"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <MoonIcon size={20} /> : <SunIcon size={20} />}
        </button>
        <button onClick={handleLogout} className="btn-logout">
          Logout
        </button>
      </div>
      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
    </nav>
  );
};

export default Navbar;
