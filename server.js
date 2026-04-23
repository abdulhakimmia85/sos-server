const express = require("express");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");

const app = express();
app.use(bodyParser.json());

// 🔐 Service Account
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// 🔥 TEST ROUTE (browser-এ open করলে দেখাবে)
app.get("/", (req, res) => {
  res.send("🔥 SOS Server Running");
});

// 🚨 SOS SEND
app.post("/send-sos", async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).send("❌ Token missing");
  }

  try {
    const message = {
      token: token,

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
      },
    };

    await admin.messaging().send(message);

    console.log("✅ SOS SENT");
    res.send("SOS Sent ✅");

  } catch (e) {
    console.log("❌ ERROR:", e);
    res.status(500).send("Server Error");
  }
});

// 🔥 IMPORTANT (Render fix)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});