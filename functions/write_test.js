const admin = require("firebase-admin");

if (!admin.apps.length) {
  try {
    // 1. Get the Base64 string
    const b64 = process.env.FIREBASE_PRIVATE_KEY_BASE64;
    // 2. Decode it
    const decryptedKey = Buffer.from(b64, 'base64').toString('utf8').replace(/\\n/g, '\n');

    // 3. Manually construct the credential object to ensure no hidden spaces/errors
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID.trim(),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL.trim(),
      privateKey: decryptedKey
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("Admin initialized for project:", serviceAccount.projectId);
  } catch (error) {
    console.error("Init Error:", error.message);
  }
}

const db = admin.firestore();

exports.handler = async () => {
  try {
    // We use a different doc name to ensure we are seeing a fresh write
    const ref = db.collection("leads_test").doc("unauthenticated_fix_test");
    await ref.set({
      success: true,
      timestamp: new Date().toISOString(),
      note: "If you see this, the 16 error is gone!"
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, message: "Connection Successful!" }),
    };
  } catch (err) {
    console.error("Runtime Error:", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        ok: false, 
        error: err.message,
        details: "Check if the Service Account has 'Cloud Datastore User' role in Google Cloud IAM." 
      }),
    };
  }
};
