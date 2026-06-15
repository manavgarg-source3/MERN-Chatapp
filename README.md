# 🚀 MERN Chat App

A full-stack real-time chat application built using the **MERN stack** (MongoDB, Express, React, Node.js) with **Socket.io** for instant messaging. This app enables real-time communication with user authentication, friend management, video calling, and a responsive UI.

**Live Demo:** [https://gargx.onrender.com/](https://gargx.onrender.com/)

---

## ✨ Features

### Core Features
- 🔐 **User Authentication** - Sign up, login, email verification, and password reset
- 💬 **Real-time Messaging** - Instant messaging with Socket.io
- 👥 **Friend Management** - Add, remove, and manage friends
- 🎥 **Video Calling** - WebRTC-based video call functionality
- 🎨 **Dark/Light Theme** - Toggle between dark and light modes
- 📱 **Responsive UI** - Works seamlessly on desktop and mobile devices
- 🔔 **Real-time Notifications** - Live updates for messages and friend requests
- 👤 **User Profiles** - View and update user profiles with profile pictures
- 🏞️ **Image Upload** - Upload images using Cloudinary integration

### Security Features
- JWT-based authentication
- Password hashing with bcryptjs
- Email verification for new accounts
- Password reset via email
- HTTP-only cookies for token storage

---

## 🏗️ Project Structure

```
MERN-Chatapp/
├── backend/                      # Node.js + Express backend
│   ├── src/
│   │   ├── index.js             # Main server file
│   │   ├── routes/              # API route handlers
│   │   │   ├── auth.route.js    # Authentication endpoints
│   │   │   ├── friend.route.js  # Friend management endpoints
│   │   │   ├── message.route.js # Messaging endpoints
│   │   │   └── webrtc.route.js  # WebRTC endpoints
│   │   ├── models/              # MongoDB models (schemas)
│   │   ├── controllers/         # Business logic
│   │   ├── lib/
│   │   │   ├── db.js            # MongoDB connection
│   │   │   ├── socket.js        # Socket.io setup
│   │   │   └── runtime.js       # Utility functions
│   │   └── middleware/          # Authentication & validation middleware
│   ├── .env.example             # Environment variables template
│   └── package.json             # Backend dependencies
│
├── frontend/vite-project/       # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx              # Main app component
│   │   ├── pages/               # Page components
│   │   │   ├── HomePage.jsx     # Chat interface
│   │   │   ├── LoginPage.jsx    # Login page
│   │   │   ├── SignUpPage.jsx   # Registration page
│   │   │   ├── ProfilePage.jsx  # User profile
│   │   │   ├── SettingsPage.jsx # Settings
│   │   │   └── ...
│   │   ├── components/          # Reusable components
│   │   ├── store/               # Zustand state management
│   │   │   ├── useAuthStore.js  # Auth state
│   │   │   ├── useCallStore.js  # Call state
│   │   │   └── useThemeStore.js # Theme state
│   │   ├── lib/                 # Utilities
│   │   └── App.css              # Global styles
│   ├── vite.config.js           # Vite configuration
│   ├── tailwind.config.js       # Tailwind CSS configuration
│   └── package.json             # Frontend dependencies
│
├── package.json                 # Root package.json
└── README.md                    # This file

```

---

## 🛠️ Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **Socket.io** - Real-time communication
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **Cloudinary** - Image hosting
- **Nodemailer** - Email sending

### Frontend
- **React 19** - UI library
- **Vite** - Build tool
- **React Router DOM** - Client-side routing
- **Zustand** - State management
- **Tailwind CSS** - Utility-first CSS framework
- **DaisyUI** - UI component library
- **Socket.io Client** - Real-time communication client
- **Axios** - HTTP client
- **Lucide React** - Icons
- **React Hot Toast** - Toast notifications

### Deployment
- **Render** - Hosting platform
- **MongoDB Atlas** - Cloud database (optional)

---

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB** (local or MongoDB Atlas)
- **Git**

### Third-party Services (Optional)
- **Cloudinary** - For image uploads
- **Gmail App Password** - For email functionality
- **Metered.ca** - For WebRTC video calling

---

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/manavgarg-source3/MERN-Chatapp.git
cd MERN-Chatapp
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Update .env with your configuration
# Edit backend/.env with appropriate values
```

**Backend .env Configuration:**

```env
# Database
MONGODB_URI=mongodb://127.0.0.1:27017/gargx

# Server
PORT=5001
NODE_ENV=development

# JWT
JWT_SECRET=replace-with-a-long-random-secret

# URLs
DEV_CLIENT_URL=http://localhost:5173
CLIENT_URL=https://your-production-domain.example
COOKIE_SECURE=false

# Email Configuration (Gmail SMTP)
EMAIL_SERVICE=gmail
EMAIL_USER=your-account@gmail.com
EMAIL_PASS=your-16-character-app-password

# Image Upload (Cloudinary)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# WebRTC (Metered.ca)
METERED_DOMAIN=your-metered-domain
METERED_API_KEY=your-metered-api-key
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend/vite-project

# Install dependencies
npm install
```

### 4. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Server runs on http://localhost:5001
```

**Terminal 2 - Frontend:**
```bash
cd frontend/vite-project
npm run dev
# App runs on http://localhost:5173
```

### 5. Access the Application

Open your browser and navigate to: **http://localhost:5173**

---

## 🎯 Usage

### 1. Create an Account
- Click "Sign Up" and fill in the registration form
- Verify your email by entering the code sent to your email

### 2. Login
- Use your email and password to log in

### 3. Send Messages
- Select a friend from the sidebar
- Type your message and hit Enter to send
- Messages appear in real-time

### 4. Add Friends
- Click the "Add Friend" button
- Enter a friend's email
- Accept friend requests to connect

### 5. Video Call
- Click the video call icon next to a friend's name
- Accept or reject the incoming call
- Video streams in real-time

### 6. Settings
- Change your theme (Dark/Light)
- Update your profile picture
- Manage account settings

---

## 📦 Available Scripts

### Root Directory
```bash
npm run build      # Build frontend and install all dependencies
npm start          # Start the backend server
```

### Backend
```bash
npm run dev        # Run backend with nodemon (auto-reload)
npm run start      # Start backend server in production
npm run test       # Run backend tests
npm run check:email # Check email configuration
```

### Frontend
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run lint       # Run ESLint
npm run preview    # Preview production build
```

---

## 🗄️ Database Schema

### User Model
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  profilePic: String (Cloudinary URL),
  isEmailVerified: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Message Model
```javascript
{
  _id: ObjectId,
  senderId: ObjectId (ref: User),
  receiverId: ObjectId (ref: User),
  content: String,
  image: String (Cloudinary URL),
  createdAt: Date
}
```

### Friend Model
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  friendId: ObjectId (ref: User),
  status: String (pending, accepted, blocked),
  createdAt: Date
}
```

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/verify-email` - Verify email address
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password/:token` - Reset password
- `GET /api/auth/me` - Get current user

### Friends
- `GET /api/friends` - Get user's friends
- `POST /api/friends/add` - Send friend request
- `POST /api/friends/accept/:id` - Accept friend request
- `DELETE /api/friends/remove/:id` - Remove friend

### Messages
- `GET /api/messages/:friendId` - Get messages with a friend
- `POST /api/messages/send` - Send a message

### WebRTC
- `POST /api/webrtc/offer` - Send call offer
- `POST /api/webrtc/answer` - Send call answer
- `POST /api/webrtc/ice-candidate` - Send ICE candidate

---

## 🚀 Deployment

### Deploy on Render

1. **Create a Render Account** - Visit [render.com](https://render.com)

2. **Connect Your Repository** - Link your GitHub account

3. **Create New Web Service** - Select your repository

4. **Configure Environment Variables**:
   - Set all `.env` variables in Render dashboard
   - Add `SERVE_FRONTEND=true` to serve frontend from backend

5. **Deploy** - Render will automatically build and deploy your app

### Deploy on Other Platforms

**Vercel (Frontend only):**
```bash
cd frontend/vite-project
vercel deploy
```

**Railway, Heroku, Netlify** - Follow their respective deployment guides

---

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running locally or MongoDB Atlas credentials are correct
- Check `MONGODB_URI` in `.env`

### Socket.io Connection Failed
- Verify backend is running on correct port
- Check CORS settings and allowed origins
- Ensure `DEV_CLIENT_URL` and `CLIENT_URL` are correct

### Email Not Sending
- Verify Gmail SMTP credentials
- Use App Password, not regular Gmail password
- Enable "Less secure app access" if needed

### Image Upload Not Working
- Check Cloudinary credentials
- Ensure API key and secret are correct
- Verify cloud name

### Frontend Not Connecting to Backend
- Check backend is running on `http://localhost:5001`
- Verify CORS is properly configured
- Check browser console for errors

---

## 📝 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/gargx` |
| `PORT` | Backend server port | `5001` |
| `JWT_SECRET` | Secret for JWT token generation | `your-secret-key` |
| `NODE_ENV` | Environment | `development` or `production` |
| `EMAIL_USER` | Gmail address for sending emails | `your-email@gmail.com` |
| `EMAIL_PASS` | Gmail app password | `xxxx xxxx xxxx xxxx` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `your-cloud-name` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `your-api-key` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `your-api-secret` |
| `DEV_CLIENT_URL` | Frontend URL for development | `http://localhost:5173` |
| `CLIENT_URL` | Frontend URL for production | `https://yourdomain.com` |

---

## 📚 Learning Resources

- [MERN Stack Tutorial](https://mern.io/)
- [Socket.io Documentation](https://socket.io/docs/)
- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zustand State Management](https://github.com/pmndrs/zustand)

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

---

## 👨‍💻 Author

**Manav Garg**
- GitHub: [@manavgarg-source3](https://github.com/manavgarg-source3)
- Portfolio: [https://gargx.onrender.com/](https://gargx.onrender.com/)

---

## 🙏 Acknowledgments

- Thanks to the MERN community for excellent documentation
- Socket.io for real-time communication capabilities
- All the open-source libraries used in this project
- Contributors and testers

---

## 📧 Support

If you have any questions or need help, feel free to:
- Open an issue on GitHub
- Create a discussion
- Contact via email

---

## 🗺️ Roadmap

- [ ] Add group chat functionality
- [ ] Implement message reactions
- [ ] Add message search feature
- [ ] Implement typing indicators
- [ ] Add message encryption
- [ ] Mobile app (React Native)
- [ ] Voice messages
- [ ] Message threading/replies
- [ ] User presence indicators
- [ ] Advanced user profiles

---

**Last Updated:** June 2026

**Repository:** [MERN-Chatapp](https://github.com/manavgarg-source3/MERN-Chatapp)
