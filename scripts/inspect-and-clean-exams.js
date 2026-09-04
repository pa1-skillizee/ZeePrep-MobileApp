const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs, doc, updateDoc } = require("firebase/firestore");

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

async function inspectExams() {
  const snap = await getDocs(collection(db, "exams"));
  console.log(`Found ${snap.size} exams in Firestore:`);
  snap.forEach(d => {
    const data = d.data();
    console.log(`ID: ${d.id} | Title: "${data.title}" | Grade: "${data.grade}" | Status: "${data.status}" | Subject: "${data.subject}"`);
  });
}

inspectExams().catch(console.error);
