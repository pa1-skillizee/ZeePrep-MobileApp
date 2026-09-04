const https = require("https");
require("dotenv").config();

const key1 = process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
const key2 = process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "";

async function testKey(name, key, model) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const data = JSON.stringify({
    contents: [{ parts: [{ text: "Respond with the word SUCCESS" }] }]
  });

  return new Promise((resolve) => {
    const req = https.request(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    }, (res) => {
      let body = "";
      res.on("data", chunk => body += chunk);
      res.on("end", () => {
        console.log(`[${name}] (${model}) Status: ${res.statusCode}`);
        if (res.statusCode === 200) {
          console.log(`[${name}] Response:`, body.substring(0, 150));
          resolve(true);
        } else {
          console.log(`[${name}] Error:`, body.substring(0, 150));
          resolve(false);
        }
      });
    });
    req.on("error", (e) => {
      console.log(`[${name}] Request error:`, e.message);
      resolve(false);
    });
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log("Testing Key 1 (AQ...):");
  await testKey("Key1", key1, "gemini-2.0-flash");
  await testKey("Key1", key1, "gemini-2.5-flash");
  await testKey("Key1", key1, "gemini-1.5-flash");

  console.log("\nTesting Key 2 (AIza...):");
  await testKey("Key2", key2, "gemini-2.0-flash");
  await testKey("Key2", key2, "gemini-1.5-flash");
}

run();
