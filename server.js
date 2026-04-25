const express = require("express");
const admin = require("firebase-admin");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
app.use(express.json());

// 🔐 Firebase config (ENV থেকে)
const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// 🧾 Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// 🧪 Health Check
app.get("/", (req, res) => {
  res.status(200).send("🔥 SOS Server Running");
});


// 🚨 SEND SOS (FCM Notification)
app.post("/send-sos", async (req, res) => {
  let { token, tokens } = req.body;

  let targetTokens = [];
  if (token) targetTokens.push(token);
  if (Array.isArray(tokens)) targetTokens = targetTokens.concat(tokens);

  if (!targetTokens.length) {
    return res.status(400).json({ error: "No token(s) provided" });
  }

  targetTokens = [...new Set(targetTokens)];

  try {
    const message = {
      notification: {
        title: "🚨 SOS ALERT",
        body: "Emergency! Open app now",
      },
      android: {
        priority: "high",
        notification: {
          sound: "default",
          channelId: "sos_channel",
        },
      },
      data: {
        type: "sos",
        click_action: "FLUTTER_NOTIFICATION_CLICK",
      },
      tokens: targetTokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    res.json({
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    });

  } catch (e) {
    console.error("❌ FCM ERROR:", e);
    res.status(500).json({ error: "Server Error" });
  }
});


// 📍 HTTP LOCATION (backup API)
app.post("/location", (req, res) => {
  const { lat, lng, userId } = req.body;

  console.log("📍 Location:", lat, lng, userId);

  res.json({ success: true });
});


// =====================================
// 🔥 REAL-TIME SOCKET.IO SECTION
// =====================================

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  console.log("🟢 Connected:", socket.id);

  // join room (userId)
  socket.on("join", (userId) => {
    socket.join(userId);
    console.log("📌 Joined:", userId);
  });

  // receive location
  socket.on("sendLocation", (data) => {
    const { userId, lat, lng } = data;

    console.log("📡 Live:", lat, lng);

    // send to receiver
    io.to(userId).emit("receiveLocation", { lat, lng });
  });

  socket.on("disconnect", () => {
    console.log("🔴 Disconnected");
  });
});


// 🔥 Render PORT
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});