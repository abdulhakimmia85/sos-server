const express = require("express");
const admin = require("firebase-admin");

const app = express();
app.use(express.json());

// 🔐 Firebase
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

// 🚨 SEND SOS
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


// 📍 LOCATION API (👉 এটা তোমার missing ছিল)
app.post("/location", (req, res) => {
  const { lat, lng, userId } = req.body;

  if (!lat || !lng) {
    return res.status(400).json({ error: "Location missing" });
  }

  console.log("📍 Location received:", lat, lng, userId);

  res.json({
    success: true,
    message: "Location received successfully",
  });
});


// 🔥 Render Port
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});