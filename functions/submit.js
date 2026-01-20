const admin = require("firebase-admin");

// --- 1. THE CONNECTION (Copy-pasted from your working write_test) ---
if (!admin.apps.length) {
  try {
    const b64 = process.env.FIREBASE_PRIVATE_KEY_BASE64;
    const decodedString = Buffer.from(b64, 'base64').toString('utf8');
    const serviceAccount = JSON.parse(decodedString);
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    console.error("Firebase Init Error:", error.message);
  }
}

const db = admin.firestore();

exports.handler = async function (event) {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let data;
  try {
    data = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  // --- 2. YOUR EXISTING LOGIC ---
  const name = (data.name || "").trim();
  const email = (data.email || "").trim();
  const phone = (data.phone || "").trim();

  if (!name || !email) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, error: "Name and email are required." }),
    };
  }

  const price = Number(data.price || 0);
  const cash = Number(data.cash || 0);
  const incomeMonthly = Number(data.incomeMonthly || 0);
  const debtsMonthly = Number(data.debtsMonthly || 0);
  const openness = Number(data.openness || 0);

  const downPaymentNeeded = price > 0 ? price * 0.01 : 0;
  const downPaymentOk = cash >= downPaymentNeeded;
  const estPITI = price > 0 ? (price * 0.007) : 0;
  const estDTI = incomeMonthly > 0 ? (debtsMonthly + estPITI) / incomeMonthly : null;

  const score = Math.max(
    0,
    Math.min(100, Math.round((openness / 10) * 40 + (downPaymentOk ? 30 : 0) + (estDTI !== null && estDTI <= 0.45 ? 30 : 0)))
  );

  // Prepare the object for the database
  const leadPayload = {
    name,
    email,
    phone,
    price,
    cash,
    incomeMonthly,
    debtsMonthly,
    openness,
    calculations: {
      downPaymentNeeded: Math.round(downPaymentNeeded),
      downPaymentOk,
      estPITI: Math.round(estPITI),
      estDTI: estDTI === null ? null : Number(estDTI.toFixed(3)),
      score,
    },
    submittedAt: new Date().toISOString(),
  };

  // --- 3. THE SAVE STEP (New) ---
  try {
    // This saves the lead into a collection called 'leads'
    await db.collection("leads").add(leadPayload);
    console.log("LEAD_SAVED_TO_FIRESTORE", name);
  } catch (dbError) {
    // We log the error but still return the results to the user 
    // so the website doesn't "break" for them.
    console.error("FIRESTORE_SAVE_ERROR", dbError.message);
  }

  // --- 4. RETURN RESULTS TO FRONTEND ---
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ok: true,
      results: leadPayload.calculations,
    }),
  };
};
