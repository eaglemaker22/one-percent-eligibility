const admin = require("firebase-admin");

if (!admin.apps.length) {
  try {
    const encodedKey = process.env.FIREBASE_PRIVATE_KEY_BASE64;

    if (!encodedKey) {
      throw new Error("Missing FIREBASE_PRIVATE_KEY_BASE64");
    }

    // 1. Decode Base64 to string
    let privateKey = Buffer.from(encodedKey, 'base64').toString('utf8');

    // 2. THE FIX: Force literal "\n" text to become real newlines
    // This is the most common reason for "Invalid PEM" errors
    privateKey = privateKey.replace(/\\n/g, '\n');

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
    console.log("Firebase initialized successfully.");
  } catch (error) {
    console.error("Initialization error:", error.message);
  }
}

const db = admin.firestore();

exports.handler = async (event) => {
  try {
    const testRef = db.collection("leads_test").doc("final_format_test");
    await testRef.set({
      status: "Success",
      message: "PEM format fixed.",
      timestamp: new Date().toISOString()
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Success! Firestore write complete." }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message, stack: err.stack }),
    };
  }
};
