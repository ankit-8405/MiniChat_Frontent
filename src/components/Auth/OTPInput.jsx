import { useState, useRef, useEffect } from 'react';
import './OTPInput.css';

const OTPInput = ({ length = 6, onComplete, loading = false, initialValue = '' }) => { // eslint-disable-line react/prop-types
  const [otp, setOtp] = useState(new Array(length).fill(''));
  const inputRefs = useRef([]);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; });

  useEffect(() => {
    // Auto-fill if initialValue provided (dev mode)
    if (initialValue && initialValue.length === length) {
      const digits = initialValue.split('');
      setOtp(digits);
      // Delay auto-submit slightly so UI renders the filled boxes first
      const t = setTimeout(() => onCompleteRef.current(initialValue), 300);
      return () => clearTimeout(t);
    }
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, [initialValue, length]);

  const handleChange = (index, value) => {
    // Only allow digits 0-9
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    // Take only the last character if multiple are pasted
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Move to next input if value is entered
    if (value && index < length - 1) {
      inputRefs.current[index + 1].focus();
    }

    // Call onComplete when all digits are filled
    const otpString = newOtp.join('');
    if (otpString.length === length) {
      onComplete(otpString);
    }
  };

  const handleKeyDown = (index, e) => {
    // Move to previous input on backspace if current is empty
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, length);
    
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = pastedData.split('');
    setOtp([...newOtp, ...new Array(length - newOtp.length).fill('')]);

    // Focus last filled input or last input
    const focusIndex = Math.min(newOtp.length, length - 1);
    inputRefs.current[focusIndex].focus();

    // Call onComplete if all digits are filled
    if (pastedData.length === length) {
      onComplete(pastedData);
    }
  };

  return (
    <div className="otp-input-container">
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(ref) => (inputRefs.current[index] = ref)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={loading}
          className="otp-input"
          autoComplete="off"
        />
      ))}
    </div>
  );
};

export default OTPInput;
