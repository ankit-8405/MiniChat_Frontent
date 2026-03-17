import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import OTPInput from '../components/Auth/OTPInput';
import '../assets/auth.css';

const Login = () => {
  const [step, setStep] = useState(1); // 1: Request OTP, 2: Verify OTP
  const [mobile, setMobile] = useState('');
  const [userId, setUserId] = useState('');
  const [username, setUsername] = useState('');
  const [devOTP, setDevOTP] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!mobile.trim() || !/^[0-9]{10}$/.test(mobile)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      const data = await authService.requestLoginOTP(mobile);
      setUserId(data.userId);
      setUsername(data.username);
      if (data.devOTP) setDevOTP(data.devOTP);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (otp) => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const data = await authService.verifyLoginOTP(userId, otp);
      login({ userId: data.userId, username: data.username }, data.token);
      if (data.requiresProfileSetup) {
        navigate('/profile-setup');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const data = await authService.resendOTP(userId);
      if (data.devOTP) setDevOTP(data.devOTP);
      setSuccess('OTP resent successfully! Check your mobile.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep(1);
    setError('');
    setSuccess('');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Login</h1>

        {step === 1 ? (
          <form onSubmit={handleRequestOTP}>
            <input
              type="tel"
              placeholder="Mobile Number (10 digits)"
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
              required
              autoFocus
            />

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
              Enter the 6-digit OTP sent to <strong>{mobile}</strong>
            </p>
            <p className="otp-hint">📱 Check your mobile for the OTP</p>

            {devOTP && (
              <div className="dev-otp-banner">
                🔐 <strong>Dev Mode OTP:</strong> {devOTP}
              </div>
            )}
            <OTPInput key={`login-otp-${step}`} onComplete={handleVerifyOTP} loading={loading} initialValue={devOTP} />

            {error && <div className="error">{error}</div>}
            {success && <div className="success-msg">{success}</div>}

            <button type="button" onClick={handleResendOTP} disabled={loading} className="resend-btn">
              {loading ? 'Resending...' : 'Resend OTP'}
            </button>
            <button type="button" onClick={handleBack} className="back-btn">
              ← Back
            </button>
          </div>
        )}

        <p>
          Don&apos;t have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
