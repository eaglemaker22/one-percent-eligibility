import admin from "firebase-admin";

let app;
function getApp() {
  if (app) return app;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY");
  }

  app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  return app;
}

export async function handler() {
  try {
    getApp();
    const db = admin.firestore();

    const docRef = await db.collection("lead_submissions").add({
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      source: "netlify_function_test",
      name: "Test User",
      email: "test@example.com",
      phone: "",
      zip: "90210",
      opennessScore: 8,
      rawAnswers: {
        q1: "0-3 months",
        q4: "350-500k",
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, wroteDocId: docRef.id }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: err.message }),
    };
  }
}
