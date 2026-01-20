const admin = require("firebase-admin");

if (!admin.apps.length) {
  // Decode the Base64 key
  const encodedKey = process.env.FIREBASE_PRIVATE_KEY_BASE64;
  const privateKey = Buffer.from(encodedKey, 'base64').toString('ascii');

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  });
}

const db = admin.firestore();
// ... rest of the code is the same

exports.handler = async (event, context) => {
  // Good practice: allow both GET (to test in browser) and POST for this test script
  try {
    // 2. Reference the collection and document
    const ref = db.collection("leads_test").doc("netlify_write_test");

    // 3. Perform the write
    await ref.set({
      ok: true,
      ts: new Date().toISOString(),
      source: "netlify-function-updated",
      status: "It worked!"
    }, { merge: true });

    // 4. Success Response
    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" // Allows testing from your local machine
      },
      body: JSON.stringify({ 
        message: "Successfully wrote to Firestore!",
        timestamp: new Date().toISOString()
      }),
    };

  } catch (err) {
    // 5. Error Response - This will help you see EXACTLY what went wrong in the browser
    console.error("Function Error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        ok: false, 
        error: err.message,
        stack: err.stack // Only for debugging
      }),
    };
  }
};
