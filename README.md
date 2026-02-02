# Chat Application - Frontend

Real-time chat application built with React and Vite.

## Features

- User authentication (login/register)
- Real-time messaging
- Channel management
- Message history with scroll pagination
- Online/offline user presence
- Typing indicators
- Responsive design

## Security Features

- Input validation and sanitization
- XSS protection
- Token-based authentication
- Automatic token refresh handling
- Protected routes
- Request timeout handling

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
VITE_API_URL=http://localhost:5000
```

3. Start development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Project Structure

```
src/
├── assets/          # CSS and static files
├── components/      # Reusable components
│   ├── Auth/       # Login/Register forms
│   ├── Chat/       # Chat components
│   └── Layout/     # Layout components
├── context/        # React Context (Auth, Socket)
├── hooks/          # Custom hooks
├── pages/          # Page components
├── services/       # API services
├── utils/          # Utility functions
├── App.jsx         # Main app component
└── main.jsx        # Entry point
```

## Environment Variables

- `VITE_API_URL`: Backend API URL (default: http://localhost:5000)

## Input Validation

### Username
- 3-30 characters
- Alphanumeric and underscores only
- No spaces

### Password
- Minimum 6 characters
- Must contain uppercase, lowercase, and number

### Messages
- 1-2000 characters
- Trimmed whitespace

### Channel Names
- 1-50 characters
- Letters, numbers, spaces, hyphens, underscores

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Production Deployment

1. Update `VITE_API_URL` in `.env` to your production API URL
2. Build the application: `npm run build`
3. Deploy the `dist` folder to your hosting service (Vercel, Netlify, etc.)
4. Ensure CORS is properly configured on the backend

## Troubleshooting

### Socket connection issues
- Check that `VITE_API_URL` is correct
- Ensure backend server is running
- Check browser console for errors

### Authentication issues
- Clear localStorage and try again
- Check that JWT_SECRET matches on backend
- Verify token hasn't expired

### Message not sending
- Check network tab for API errors
- Verify you're a member of the channel
- Check message length (max 2000 chars)
"# MiniChat_Frontent" 
