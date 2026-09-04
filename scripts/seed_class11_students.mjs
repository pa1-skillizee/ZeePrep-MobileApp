import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, updateDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCe8dpGyUuOsTGiNmPbDoCTC04N8yVl914",
  authDomain: "zeeprep01.firebaseapp.com",
  projectId: "zeeprep01",
  storageBucket: "zeeprep01.firebasestorage.app",
  messagingSenderId: "1032565153081",
  appId: "1:1032565153081:web:48015a20f9cb2ad345dce8",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const DEMO_STUDENTS = [
  {
    name: "Rohan Sharma",
    email: "student11a@zeeprep.com",
    loginId: "ZP-STU-1101",
    password: "Password@123",
    grade: "11",
    section: "A",
    board: "CBSE",
    stream: "Science",
  },
  {
    name: "Ananya Verma",
    email: "student11b@zeeprep.com",
    loginId: "ZP-STU-1102",
    password: "Password@123",
    grade: "11",
    section: "A",
    board: "CBSE",
    stream: "Science",
  },
  {
    name: "Aarav Patel",
    email: "student11c@zeeprep.com",
    loginId: "ZP-STU-1103",
    password: "Password@123",
    grade: "11",
    section: "A",
    board: "CBSE",
    stream: "Science",
  },
  {
    name: "Diya Sen",
    email: "student11d@zeeprep.com",
    loginId: "ZP-STU-1104",
    password: "Password@123",
    grade: "11",
    section: "A",
    board: "CBSE",
    stream: "Science",
  },
];

async function seed() {
  console.log("=== Seeding / Verifying 4 Class 11 Demo Students ===");

  for (const stu of DEMO_STUDENTS) {
    let uid = "";
    try {
      // Try signing in
      const res = await signInWithEmailAndPassword(auth, stu.email, stu.password);
      uid = res.user.uid;
      console.log(`[EXISTING USER] ${stu.email} signed in successfully (UID: ${uid})`);
    } catch (err) {
      if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
        try {
          const res = await createUserWithEmailAndPassword(auth, stu.email, stu.password);
          uid = res.user.uid;
          console.log(`[NEW USER CREATED] ${stu.email} (UID: ${uid})`);
        } catch (createErr) {
          console.error(`Error creating user ${stu.email}:`, createErr.message);
          continue;
        }
      } else {
        console.error(`Auth error for ${stu.email}:`, err.message);
        continue;
      }
    }

    if (uid) {
      // Save User Profile in Firestore
      const userProfile = {
        uid,
        name: stu.name,
        email: stu.email,
        loginId: stu.loginId,
        role: "student",
        grade: stu.grade,
        section: stu.section,
        board: stu.board,
        stream: stu.stream,
        status: "active",
        approvalStatus: "approved",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "users", uid), userProfile, { merge: true });

      // Save LoginID mapping
      await setDoc(
        doc(db, "loginIds", stu.loginId),
        {
          uid,
          email: stu.email,
          role: "student",
          name: stu.name,
          grade: stu.grade,
        },
        { merge: true }
      );

      console.log(`✓ Firestore Profile & LoginId mapped for ${stu.loginId} -> ${stu.email}`);
    }
  }

  // Update all Class 11 Exams to have maxAttempts: "unlimited"
  console.log("\n=== Ensuring Class 11 Math Exams have maxAttempts: 'unlimited' ===");
  const examsSnap = await getDocs(collection(db, "exams"));
  for (const docSnap of examsSnap.docs) {
    const data = docSnap.data();
    if (String(data.grade).includes("11") || data.subject === "Mathematics" || data.subject === "Class 11 Mathematics") {
      await updateDoc(doc(db, "exams", docSnap.id), {
        maxAttempts: "unlimited",
      });
      console.log(`✓ Exam updated to unlimited attempts: "${data.title}" (ID: ${docSnap.id})`);
    }
  }

  console.log("\n=== Complete! All 4 Students are live and ready to test! ===");
}

seed().catch(console.error);
