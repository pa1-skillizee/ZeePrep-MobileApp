const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyCe8dpGyUuOsTGiNmPbDoCTC04N8yVl914",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "zeeprep01.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "zeeprep01",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "zeeprep01.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1032565153081",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:1032565153081:web:48015a20f9cb2ad345dce8",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function inspectResources() {
  console.log("--- study_resources ---");
  const snap1 = await getDocs(collection(db, "study_resources"));
  console.log(`Found ${snap1.size} in study_resources`);
  snap1.forEach(d => {
    const data = d.data();
    console.log(`ID: ${d.id} | Title: "${data.title}" | Grade: "${data.grade}" | Subject: "${data.subject}" | Section: "${data.section}"`);
  });

  console.log("--- resources ---");
  const snap2 = await getDocs(collection(db, "resources"));
  console.log(`Found ${snap2.size} in resources`);
  snap2.forEach(d => {
    const data = d.data();
    console.log(`ID: ${d.id} | Title: "${data.title}" | Grade: "${data.grade}" | Subject: "${data.subject}" | Section: "${data.section}"`);
  });
}

inspectResources().catch(console.error);
