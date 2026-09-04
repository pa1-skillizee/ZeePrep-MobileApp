const { initializeApp } = require("firebase/app");
const { getFirestore, doc, updateDoc } = require("firebase/firestore");

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

async function cleanExams() {
  // Update Test Grade 6 to draft & grade 6
  await updateDoc(doc(db, "exams", "3e4be3a1-073d-455e-bc2a-d75e4b6736fd"), {
    status: "draft",
    grade: "6",
    isArchived: true,
  });
  console.log("Updated Test Grade 6 to draft/archived");

  // Update Test 3 12 to draft & grade 12
  await updateDoc(doc(db, "exams", "c7eb476a-7d22-4dae-aef7-9de428c966ce"), {
    status: "draft",
    grade: "12",
    isArchived: true,
  });
  console.log("Updated Test 3 12 to draft/archived");
}

cleanExams().catch(console.error);
