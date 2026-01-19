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

  // Required fields
  const name = (data.name || "").trim();
  const email = (data.email || "").trim();
  const phone = (data.phone || "").trim(); // optional

  if (!name || !email) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, error: "Name and email are required." }),
    };
  }

  // --- BASIC OUTPUTS (placeholders we’ll refine) ---
  const price = Number(data.price || 0);             // purchase price estimate
  const cash = Number(data.cash || 0);               // cash available
  const incomeMonthly = Number(data.incomeMonthly || 0);
  const debtsMonthly = Number(data.debtsMonthly || 0);
  const openness = Number(data.openness || 0);

  const downPaymentNeeded = price > 0 ? price * 0.01 : 0;
  const downPaymentOk = cash >= downPaymentNeeded;

  // VERY rough payment estimate placeholder (we’ll replace with taxes/HOI/MI later)
  const estPITI = price > 0 ? (price * 0.007) : 0; // placeholder
  const estDTI = incomeMonthly > 0 ? (debtsMonthly + estPITI) / incomeMonthly : null;

  // Lead score (simple v1)
  const score = Math.max(
    0,
    Math.min(100, Math.round((openness / 10) * 40 + (downPaymentOk ? 30 : 0) + (estDTI !== null && estDTI <= 0.45 ? 30 : 0)))
  );

  // Log (shows up in Netlify function logs)
  console.log("LEAD_SUBMIT", {
    name,
    email,
    phone,
    price,
    cash,
    incomeMonthly,
    debtsMonthly,
    openness,
    downPaymentNeeded,
    downPaymentOk,
    estPITI,
    estDTI,
    score,
    ts: new Date().toISOString(),
  });

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ok: true,
      results: {
        downPaymentNeeded: Math.round(downPaymentNeeded),
        downPaymentOk,
        estPITI: Math.round(estPITI),
        estDTI: estDTI === null ? null : Number(estDTI.toFixed(3)),
        score,
      },
    }),
  };
};
