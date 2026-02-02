import { useCall } from '../../context/CallContext';
import './CallModal.css';

const IncomingCallModal = () => {
  const { incomingCall, acceptCall, rejectCall } = useCall();

  console.log('📱 IncomingCallModal render - incomingCall:', incomingCall);

  if (!incomingCall) {
    console.log('📱 No incoming call, returning null');
    return null;
  }

  console.log('📱 Showing incoming call modal for:', incomingCall.caller.username);

  return (
    <div className="call-modal-overlay">
      <div className="call-modal">
        <div className="caller-info">
          <div className="caller-avatar">
            {incomingCall.caller.username[0].toUpperCase()}
          </div>
          <h2>{incomingCall.caller.username}</h2>
          <p className="call-type">
            {incomingCall.callType === 'video' ? '📹 Video Call' : '📞 Audio Call'}
          </p>
          <p className="call-status">Incoming call...</p>
        </div>
        
        <div className="call-actions">
          <button onClick={rejectCall} className="btn-reject">
            ✕ Decline
          </button>
          <button onClick={acceptCall} className="btn-accept">
            ✓ Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;
