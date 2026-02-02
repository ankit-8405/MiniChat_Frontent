import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import OTPInput from '../components/Auth/OTPInput';
import '../assets/auth.css';

const Login = () => {
  const [step, setStep] = useState(1); // 1: Request OTP, 2: Verify OTP
  const [contactMethod, setContactMethod] = useState('mobile'); // 'mobile' or 'email'
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError('');

    // Validate contact method
    if (contactMethod === 'mobile') {
      if (!mobile.trim() || !/^[0-9]{10}$/.test(mobile)) {
        setError('Please enter a valid 10-digit mobile number');
        return;
      }
    } else {
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError('Please enter a valid email address');
        return;
      }
    }

    setLoading(true);

    try {
      const data = await authService.requestLoginOTP(
        contactMethod === 'mobile' ? mobile : null,
        contactMethod === 'email' ? email : null
      );
      
      setUserId(data.userId);
      setUsername(data.username);
      setStep(2); // Move to OTP verification step
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (otp) => {
    setError('');
    setLoading(true);

    try {
      const data = await authService.verifyLoginOTP(userId, otp);
      login({ userId: data.userId, username: data.username }, data.token);
      
      // Redirect to profile setup if not completed
      if (data.requiresProfileSetup) {
        navigate('/profile-setup');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setLoading(true);

    try {
      await authService.resendOTP(userId);
      setError(''); // Clear any previous errors
      alert('OTP resent successfully! Check your console.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Login</h1>
        
        {step === 1 ? (
          <form onSubmit={handleRequestOTP}>
            <div className="contact-method-selector">
              <label>
                <input
                  type="radio"
                  value="mobile"
                  checked={contactMethod === 'mobile'}
                  onChange={(e) => setContactMethod(e.target.value)}
                />
                Mobile Number
              </label>
              <label>
                <input
                  type="radio"
                  value="email"
                  checked={contactMethod === 'email'}
                  onChange={(e) => setContactMethod(e.target.value)}
                />
                Email Address
              </label>
            </div>

            {contactMethod === 'mobile' ? (
              <input
                type="tel"
                placeholder="Mobile Number (10 digits)"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                required
              />
            ) : (
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            )}

            {error && <div className="error">{error}</div>}
            
            <button type="submit" disabled={loading}>
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <div className="otp-verification">
            <p className="otp-message">
              Welcome back, <strong>{username}</strong>!
            </p>
            <p className="otp-message">
              Enter the 6-digit OTP sent to your {contactMethod === 'mobile' ? 'mobile' : 'email'}
            </p>
            <p className="otp-hint">
              📱 Check your console for OTP (Testing Mode)
            </p>
            
            <OTPInput onComplete={handleVerifyOTP} loading={loading} />
            
            {error && <div className="error">{error}</div>}
            
            <button 
              type="button" 
              onClick={handleResendOTP} 
              disabled={loading}
              className="resend-btn"
            >
              Resend OTP
            </button>
            
            <button 
              type="button" 
              onClick={() => setStep(1)}
              className="back-btn"
            >
              ← Back
            </button>
          </div>
        )}
        
        <p>
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
