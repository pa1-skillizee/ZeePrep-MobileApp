const https = require("https");
require("dotenv").config();

const key = process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;

const prompt = `You are a CBSE Mathematics Exam Setter for Class 11.
Generate 2 multiple-choice questions for Grade 11 on the topic "Trigonometric Functions".
Target Level: Level 2 (Application).
Return ONLY a valid JSON array of objects with keys: "text", "type" (value "mcq"), "options" (array of 4 strings), "correctAnswer", "explanation", "difficulty" ("medium"). No markdown codeblocks.`;

const req = https.request(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" }
}, (res) => {
  let body = "";
  res.on("data", chunk => body += chunk);
  res.on("end", () => {
    console.log(`Status: ${res.statusCode}`);
    console.log("Raw Response:", body);
  });
});

req.write(JSON.stringify({
  contents: [{ parts: [{ text: prompt }] }]
}));
req.end();
