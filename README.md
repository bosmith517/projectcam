# 📱 ProjectCam - CompanyCam Clone

A professional construction photo documentation platform with unlimited photo capture capabilities, built with React and Node.js.

## 🚀 Live Demo

**Frontend**: [https://projectcam-cx5buh8yo-bosmith517s-projects.vercel.app](https://projectcam-cx5buh8yo-bosmith517s-projects.vercel.app)

**Camera Test**: [https://projectcam-cx5buh8yo-bosmith517s-projects.vercel.app/gps-photo](https://projectcam-cx5buh8yo-bosmith517s-projects.vercel.app/gps-photo)

## ✨ Features

### 📸 **Core Functionality**
- **Unlimited Photo Capture** - HTTPS-enabled camera access
- **GPS Location Tracking** - Automatic location tagging
- **Real-time Photo Preview** - Instant photo review and retake
- **Mobile-Optimized Interface** - Perfect for field work

### 🏗️ **Construction-Focused**
- **Project Management** - Organize photos by project
- **Trade-Specific Workflows** - Customized for different trades
- **Team Collaboration** - Multi-user project access
- **Professional UI** - CompanyCam-quality interface

### 🔧 **Technical Features**
- **React Frontend** - Modern, responsive UI
- **Node.js Backend** - RESTful API architecture
- **JWT Authentication** - Secure user sessions
- **Socket.io Integration** - Real-time updates
- **Progressive Web App** - Install on mobile devices

## 🛠️ Tech Stack

### **Frontend**
- React 18 with TypeScript
- Tailwind CSS for styling
- React Router for navigation
- Axios for API calls
- Lucide React for icons

### **Backend**
- Node.js with Express
- MongoDB for database
- JWT for authentication
- Socket.io for real-time features
- Multer for file uploads

### **Deployment**
- Frontend: Vercel
- Backend: Multiple options (Vercel, Heroku, Render)
- Database: MongoDB Atlas

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- MongoDB (local or Atlas)

### **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/projectcam.git
   cd projectcam
   ```

2. **Install dependencies**
   ```bash
   # Install client dependencies
   cd client
   npm install

   # Install server dependencies
   cd ../server
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Server environment
   cd server
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development servers**
   ```bash
   # Start backend (from server directory)
   npm run dev

   # Start frontend (from client directory)
   cd ../client
   npm start
   ```

5. **Open your browser**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📱 Camera Testing

The camera functionality is already working with HTTPS! Test it immediately:

1. **Visit the camera page**: [Camera Test](https://projectcam-cx5buh8yo-bosmith517s-projects.vercel.app/gps-photo)
2. **Grant camera permissions** when prompted
3. **Take unlimited photos** with instant preview
4. **Test GPS location** detection

## 🏗️ Project Structure

```
projectcam/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   ├── utils/         # Utility functions
│   │   └── types/         # TypeScript types
│   └── package.json
├── server/                # Node.js backend
│   ├── routes/           # API routes
│   ├── models/           # Database models
│   ├── middleware/       # Express middleware
│   ├── config/           # Configuration files
│   └── package.json
├── netlify-backend/      # Alternative backend
└── README.md
```

## 🔧 Configuration

### **Environment Variables**

**Server (.env)**
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/projectcam
JWT_SECRET=your-secret-key
CLIENT_URL=http://localhost:3000
```

**Client (.env.production)**
```env
REACT_APP_API_URL=https://your-backend-url.com/api
GENERATE_SOURCEMAP=false
```

## 🚀 Deployment

### **Frontend (Vercel)**
```bash
cd client
npm run build
npx vercel --prod
```

### **Backend Options**

#### **Option 1: Heroku**
1. Connect GitHub repository
2. Enable automatic deployments
3. Add environment variables
4. Deploy

#### **Option 2: Render.com**
1. Connect GitHub repository
2. Auto-deploy on push
3. Free tier includes database

#### **Option 3: Railway**
```bash
cd server
railway up
```

## 📸 Features in Detail

### **Camera Functionality**
- **HTTPS Required** - Secure camera access
- **Multiple Formats** - JPEG, PNG support
- **High Resolution** - Full camera resolution
- **Instant Preview** - Review before saving
- **Retake Option** - Easy photo retaking

### **GPS Integration**
- **Automatic Location** - GPS coordinates
- **Address Lookup** - Reverse geocoding
- **Location History** - Track photo locations
- **Privacy Controls** - Optional location sharing

### **Project Management**
- **Create Projects** - Organize by job site
- **Team Access** - Invite collaborators
- **Photo Organization** - Sort by date, location
- **Progress Tracking** - Visual project timeline

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by CompanyCam's excellent construction photo management
- Built with modern web technologies for optimal performance
- Designed for real-world construction workflows

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/projectcam/issues)
- **Documentation**: [Wiki](https://github.com/yourusername/projectcam/wiki)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/projectcam/discussions)

---

**🎉 Ready to revolutionize construction photo management!** 

**Test the camera functionality now**: [Camera Demo](https://projectcam-cx5buh8yo-bosmith517s-projects.vercel.app/gps-photo) 📸
