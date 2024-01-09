import { initializeApp } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-analytics.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-auth.js";
import { getFirestore, collection, addDoc, connectFirestoreEmulator, query, getDocs, getDoc, updateDoc, setDoc, doc, onSnapshot, deleteDoc, orderBy } from 'https://www.gstatic.com/firebasejs/9.10.0/firebase-firestore.js';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAvI3hLtCXY2wt2ub4-HSV6RuOsQLSxn24",
    authDomain: "attendance-73f9c.firebaseapp.com",
    projectId: "attendance-73f9c",
    storageBucket: "attendance-73f9c.appspot.com",
    messagingSenderId: "604516915514",
    appId: "1:604516915514:web:3d45ba93f938d45e5ed803",
    measurementId: "G-6J7XH07YNX"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);
const auth = getAuth();
console.log(app);

let userId, userRef, stud_classRef, attendanceRef, classListRef;

function sortByStudentName(a, b) {
    const nameA = a.student.toUpperCase(); // Convert names to uppercase for case-insensitive sorting
    const nameB = b.student.toUpperCase();

    if (nameA < nameB) {
        return -1;
    }
    if (nameA > nameB) {
        return 1;
    }
    return 0;
}


// Function to mark absent students and create absence records
async function markAbsentStudents() {
    let eventListenerAdded = false;
    const today = new Date();

    if ((today.getDay() === 4 || today.getDay() === 5) &&
        (today.getHours() <= 10 && today.getMinutes() <= 1)) {

        userId = "nHZNH5cNkiROddDcg9oY8M6wXPI3";
        userRef = collection(db, "Attendance_Monitoring");
        stud_classRef = collection(userRef, userId, "stud_class");
        attendanceRef = collection(userRef, userId, "attendance");
        classListRef = collection(userRef, userId, "class_list");


        // Reset studRefs and counter for each call
        let studRefs = [];
        let counter = 1;
        let stud_names = []; // Declare an array to store stud_names and studRefs
        let stud_name; // Declare stud_name outside the loop
        let class_name_sec;
        const filteredPromises = [];
        const filteredAttendance = [];

        // Retrieve data from the stud_class collection based on the selectedClass
        getDocs(stud_classRef)
            .then((studClassSnapshot) => {
                const promises = [];

                studClassSnapshot.forEach((studClassDoc) => {
                    const studClassData = studClassDoc.data();
                    const studentRef = studClassData.student;
                    const classRef = studClassData.class;

                    // Use a closure to capture the value of stud_name and studRef for each iteration
                    let studRef;

                    const promise = Promise.all([getDoc(studentRef), getDoc(classRef)]).then(
                        ([studentDoc, classDoc]) => {
                            if (
                                studentDoc.exists &&
                                classDoc.exists &&
                                classDoc.data().class_name_sec === "ITE184-IT4d"
                            ) {
                                stud_name = studentDoc.data().stud_name;
                                const class_name_sec = classDoc.data().class_name_sec;
                                studRef = studClassDoc.ref.path;
                                studRefs.push(studRef);
                                stud_names.push({ stud_name, studRef });
                                console.log(stud_name, class_name_sec);

                                // Add the promise to the filteredPromises array
                                filteredPromises.push({ stud_name, class_name_sec, studRef });
                            }
                        }
                    );

                    promises.push(promise);
                });

                // Wait for all promises to resolve before moving to the next step
                return Promise.all(promises).then(() => filteredPromises);
            })
            .then((filteredPromises) => {
                // Now, process attendanceRef documents
                console.log("filtered:", filteredPromises);

                getDocs(attendanceRef).then((attendanceSnapshot) => {
                    attendanceSnapshot.forEach((attendanceDoc) => {
                        const attendanceData = attendanceDoc.data();
                        const att_stud_class = attendanceData.student_class.path;
                        const status = attendanceData.status;
                        const date_time = attendanceData.date_time;
                        console.log("Attendance Data:", att_stud_class, status, date_time);


                        for (const filteredPromise of filteredPromises) {
                            const studRefer = filteredPromise.studRef;
                            const student = filteredPromise.stud_name;
                            const nonstat = "";
                            const nondate = "";

                            let date_time;

                            if (!attendanceData.date_time) {
                                date_time = 0;
                            } else {
                                date_time = attendanceData.date_time.toDate();
                            }

                            const existingIndex = filteredAttendance.findIndex(item => item.student === student);

                            if (att_stud_class === studRefer) {
                                // If att_stud_class === studRefer, update the array
                                if (existingIndex !== -1) {
                                    filteredAttendance[existingIndex].att_stud_class = att_stud_class;
                                    filteredAttendance[existingIndex].status = status;
                                    filteredAttendance[existingIndex].date_time = date_time;
                                } else {
                                    // If the student is not in the array, add a new entry with the provided values
                                    filteredAttendance.push({
                                        student: student,
                                        att_stud_class: att_stud_class,
                                        status: status,
                                        date_time: date_time
                                    });
                                }
                            } else {
                                // If att_stud_class !== studRefer and the student is not in the array, add a new entry with default values
                                if (existingIndex === -1) {
                                    filteredAttendance.push({
                                        student: student,
                                        att_stud_class: att_stud_class,
                                        status: nonstat,
                                        date_time: nondate
                                    });
                                }
                                // If att_stud_class !== studRefer and the student is already in the array, do nothing
                            }

                            console.log("existingIndex:", existingIndex);
                            console.log("filteredAttendance:", filteredAttendance);
                        }

                    });
                    const filteredAttendanceData = filteredAttendance;
                    return filteredAttendanceData;
                }).then((filteredAttendanceData) => {

                    // Sort the filteredAttendanceData array by student name
                    filteredAttendanceData.sort(sortByStudentName);
                    const rows = [];
                    for (const attendance of filteredAttendanceData) {

                        console.log("attendance:" + attendance);
                        const student = attendance.student;
                        const student_class = attendance.att_stud_class;
                        const status = attendance.status;
                        const date = attendance.date_time;


                        if (studRefs.includes(student_class)) {
                            continue;
                        } else {
                            if (!eventListenerAdded) {
                                const status = "Absent";
                                const att_stud_class = student_class;

                                const currentDate = new Date();
                                const hours = currentDate.getHours().toString().padStart(2, '0');
                                const minutes = currentDate.getMinutes().toString().padStart(2, '0');

                                // Set the time from the input on the current date
                                currentDate.setHours(hours);
                                currentDate.setMinutes(minutes);

                                // Now currentDate contains both date and time information

                                const attendanceDocRef = collection(db, 'Attendance_Monitoring', userId, 'attendance');

                                const newAttendanceData = {
                                    student_class: doc(db, ...att_stud_class.split('/')), // Convert the path to DocumentReference
                                    status: status,
                                    date_time: currentDate,
                                };

                                // Use addDoc to create the document
                                addDoc(attendanceDocRef, newAttendanceData)
                                    .then((docRef) => {
                                        console.log('New attendance document created successfully.');
                                    })
                                    .catch((error) => {
                                        alert('Error creating new attendance document. Try Again.');
                                    });
                                eventListenerAdded = true;
                            }
                        }
                    }
                    return rows;
                })
            })
    }
}
