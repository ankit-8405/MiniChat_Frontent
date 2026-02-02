import { useAuth } from '../../context/AuthContext';

const ReadReceipt = ({ message, channelMembers = [] }) => {
  const { user } = useAuth();
  
  // Only show for own messages
  if (message.sender._id !== user.userId) {
    return null;
  }

  const totalMembers = channelMembers.length - 1; // Exclude sender
  const deliveredCount = message.deliveredTo?.length || 0;
  const readCount = message.readBy?.length || 0;

  // Determine status
  let status = 'sent';
  let icon = '✓';
  let color = '#95a5a6'; // Gray

  if (readCount > 0) {
    status = 'read';
    icon = '✓✓';
    color = '#3498db'; // Blue
  } else if (deliveredCount > 0) {
    status = 'delivered';
    icon = '✓✓';
    color = '#95a5a6'; // Gray
  }

  return (
    <span 
      className={`read-receipt read-receipt-${status}`}
      style={{ color }}
      title={
        status === 'read' 
          ? `Read by ${readCount} ${readCount === 1 ? 'person' : 'people'}`
          : status === 'delivered'
          ? `Delivered to ${deliveredCount} ${deliveredCount === 1 ? 'person' : 'people'}`
          : 'Sent'
      }
    >
      {icon}
    </span>
  );
};

export default ReadReceipt;
