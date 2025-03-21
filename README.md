

---
📌 MERN Chat App**  
A **real-time chat application** built with the **MERN stack (MongoDB, Express.js, React, Node.js)** and **Socket.io** for instant messaging.  

![Chat App Preview](https://via.placeholder.com/800x400?text=Chat+App+Preview)

---

## **🚀 Features**  
✅ Real-time messaging with **Socket.io**  
✅ Secure authentication with **JWT**  
✅ User **signup/login/logout** functionality  
✅ Private & Group Chats  
✅ Online/Offline user status  
✅ Modern **UI with Tailwind CSS**  
✅ MongoDB database for chat storage  

---

## **📂 Tech Stack**  
- **Frontend**: React.js, Tailwind CSS  
- **Backend**: Node.js, Express.js  
- **Database**: MongoDB (Mongoose)  
- **Real-time**: Socket.io  
- **Authentication**: JWT (JSON Web Token)  

---

## **⚡ Installation & Setup**  

### **1️⃣ Clone the repository**  
```sh
git clone https://github.com/manavgarg-source3/MERN-Chatapp.git
cd MERN-Chatapp
```

### **2️⃣ Install dependencies**  

#### **Backend Setup**  
```sh
cd backend
npm install
```

#### **Frontend Setup**  
```sh
cd ../frontend
npm install
```

### **3️⃣ Set Up Environment Variables**  
Create a `.env` file in the **backend** folder and add:  
```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

### **4️⃣ Start the Server**  
```sh
cd backend
npm start
```

### **5️⃣ Start the Frontend**  
```sh
cd ../frontend
npm start
```

### **6️⃣ Open the App**  
Visit **`http://localhost:3000`** in your browser.

---

## **🔌 WebSocket Events (Socket.io)**  
| Event Name       | Description                      |
|-----------------|----------------------------------|
| `message`       | Send & receive messages         |
| `user-joined`   | Notify when a user joins chat   |
| `typing`        | Show typing indicator           |
| `disconnect`    | Notify when a user leaves       |

---

## **🛠️ API Endpoints**  
| Method | Endpoint       | Description          |
|--------|---------------|----------------------|
| POST   | `/api/auth/register` | User registration  |
| POST   | `/api/auth/login`    | User login        |
| GET    | `/api/users`         | Get all users     |
| GET    | `/api/messages/:id`  | Get chat messages |

---

## **🛡️ Security & Best Practices**  
🔒 **JWT Authentication** for secure user sessions.  
🔒 **Password Hashing** with bcrypt.js.  
🔒 **CORS Policy** for cross-origin requests.  

---

## **📜 License**  
This project is **open-source** under the **MIT License**.

---

## **📬 Contact**  
📧 **Manav Garg** - [LinkedIn](https://linkedin.com/in/manavgarg)  
📂 **GitHub** - [@manavgarg-source3](https://github.com/manavgarg-source3)  

---

### 🎉 **Enjoy chatting in real-time! 🚀🔥**  

Let me know if you want any changes! 😊
