export default async function handler(req, res) {
  // Allow CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const response = await fetch(
      "https://script.google.com/macros/s/AKfycbxE57zW3g5EIObV9rIz2Qj9Extb5U3BkhyWXkXH1fg1bvsEK18A3afgW2J7xECFf675iw/exec",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(req.body)
      }
    );

    const result = await response.json();
    return res.status(200).json(result);

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.toString()
    });
  }
}
