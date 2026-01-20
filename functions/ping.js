export async function handler() {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        hasKey: !!privateKey,
        keyStartsWith: privateKey.slice(0, 30)
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}
