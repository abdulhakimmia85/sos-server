const express = require("express");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");

const app = express();
app.use(bodyParser.json());

// 🔐 Firebase Service Account
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// 🧪 Health Check
app.get("/", (req, res) => {
  res.status(200).send("🔥 SOS Server Running");
});

// 🧾 Simple request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// 🚨 SEND SOS (single or multiple tokens)
app.post("/send-sos", async (req, res) => {
  const { token, tokens } = req.body;

  // 🔍 Normalize input
  let targetTokens = [];
  if (token) targetTokens.push(token);
  if (Array.isArray(tokens)) targetTokens = targetTokens.concat(tokens);

  // ❌ Validation
  if (targetTokens.length === 0) {
    return res.status(400).json({ error: "No token(s) provided" });
  }

  // 🔁 Remove duplicates
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
      tokens: targetTokens, // 👈 multicast
    };

    // 🔥 Send to multiple devices
    const response = await admin.messaging().sendEachForMulticast(message);

    console.log("✅ SUCCESS:", response.successCount);
    console.log("❌ FAIL:", response.failureCount);

    // 🔍 Log failed tokens
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.log("❌ Token error:", targetTokens[idx], resp.error);
        }
      });
    }

    return res.json({
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    });

  } catch (e) {
    console.error("❌ FCM ERROR:", e);
    return res.status(500).json({ error: "Server Error" });
  }
});

// 🔥 Render PORT FIX
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});