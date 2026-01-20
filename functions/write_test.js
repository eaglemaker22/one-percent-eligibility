const admin = require("firebase-admin");

if (!admin.apps.length) {
  try {
    const b64 = process.env.FIREBASE_PRIVATE_KEY_BASE64;
    
    // 1. Decode the Base64 string into a text string
    const decodedString = Buffer.from(b64, 'base64').toString('utf8');

    // 2. Turn that text string into a JavaScript Object
    const serviceAccount = JSON.parse(decodedString);

    // 3. THE CRITICAL FIX: The "Deep Unjammer"
    // This looks inside the 'private_key' field and fixes the formatting
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    
    console.log("Admin initialized with fixed JSON object.");
  } catch (error) {
    console.error("Init Error:", error.message);
  }
}

const db = admin.firestore();

exports.handler = async () => {
  try {
    const ref = db.collection("leads_test").doc("decoder_fix_test");
    await ref.set({
      success: true,
      method: "Deep Unjammer Fix",
      timestamp: new Date().toISOString()
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, message: "Victory! Firestore write successful." }),
    };
  } catch (err) {
    console.error("Runtime Error:", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: err.message }),
    };
  }
};
