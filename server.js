const express = require("express");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");

const app = express();
app.use(bodyParser.json());

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

app.post("/send-sos", async (req, res) => {
  const { token } = req.body;

  try {
    await admin.messaging().send({
      token: token,
      notification: {
        title: "🚨 SOS ALERT",
        body: "Emergency! Open app now",
      },
      android: {
        priority: "high",
      },
    });

    res.send("SOS Sent");
  } catch (e) {
    console.log(e);
    res.status(500).send("Error");
  }
});

app.listen(3000, () => {
  console.log("🔥 Server running on port 3000");
});