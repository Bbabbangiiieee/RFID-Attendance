const { onSchedule } = require("firebase-functions/v2/scheduler");
const { setGlobalOptions } = require("firebase-functions/v2");
setGlobalOptions({ maxInstances: 10 });
// Set OPENSSL_CONF environment variable
const puppeteer = require('puppeteer');
const jsPDF = require('jspdf');


const { initializeApp } = require("firebase/app");
const { getFirestore, collection, addDoc, getDocs, getDoc, updateDoc, setDoc, doc, onSnapshot, deleteDoc, orderBy } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: "AIzaSyAvI3hLtCXY2wt2ub4-HSV6RuOsQLSxn24",
    authDomain: "attendance-73f9c.firebaseapp.com",
    projectId: "attendance-73f9c",
    storageBucket: "attendance-73f9c.appspot.com",
    messagingSenderId: "604516915514",
    appId: "1:604516915514:web:3d45ba93f938d45e5ed803",
    measurementId: "G-6J7XH07YNX"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const nodemailer = require('nodemailer');

// Set up nodemailer transporter

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'capstonetestustp@gmail.com',
        pass: 'gdkf ndhx wasr ager'
    }
});

let userId, userRef, stud_classRef, attendanceRef, classListRef;

async function createAttendanceDocument(status, att_stud_class) {
    const currentDate = new Date();
    const hours = currentDate.getHours().toString().padStart(2, '0');
    const minutes = currentDate.getMinutes().toString().padStart(2, '0');

    currentDate.setHours(hours);
    currentDate.setMinutes(minutes);

    let date_time = currentDate;

    const attendanceDocRef = collection(db, 'Attendance_Monitoring', userId, 'attendance');

    const newAttendanceData = {
        student_class: doc(db, ...att_stud_class.split('/')),
        status: status,
        date_time: date_time,
    };

    console.log("Details " + status + att_stud_class + date_time);

    try {
        const docRef = await addDoc(attendanceDocRef, newAttendanceData);
        console.log('New attendance document created successfully.');
    } catch (error) {
        console.log('Error creating new attendance document. Try Again.');
    }
}


async function markAbsentStudents() {

    userId = "nHZNH5cNkiROddDcg9oY8M6wXPI3";
    userRef = collection(db, "Attendance_Monitoring");
    stud_classRef = collection(userRef, userId, "stud_class");
    attendanceRef = collection(userRef, userId, "attendance");
    classListRef = collection(userRef, userId, "class_list");

    let studRefs = [];
    let stud_names = [];
    let stud_name;

    const filteredPromises = [];
    const filteredAttendance = [];

    function sortByStudentName(a, b) {
        const nameA = a.student.toUpperCase();
        const nameB = b.student.toUpperCase();

        if (nameA < nameB) {
            return -1;
        }
        if (nameA > nameB) {
            return 1;
        }
        return 0;
    }

    try {
        const studClassSnapshot = await getDocs(stud_classRef);

        const promises = studClassSnapshot.docs.map(async (studClassDoc) => {
            const studClassData = studClassDoc.data();
            const studentRef = studClassData.student;
            const classRef = studClassData.class;

            let studRef;

            const [studentDoc, classDoc] = await Promise.all([getDoc(studentRef), getDoc(classRef)]);

            if (studentDoc.exists && classDoc.exists && classDoc.data().class_name_sec === "ITE184-IT4D") {
                stud_name = studentDoc.data().stud_name;
                stud_email = studentDoc.data().stud_email;
                const class_name_sec = classDoc.data().class_name_sec;
                studRef = studClassDoc.ref.path;
                studRefs.push(studRef);
                stud_names.push({ stud_name, stud_email, studRef });
                console.log(stud_name, class_name_sec, stud_email);

                filteredPromises.push({ stud_name, class_name_sec, stud_email, studRef });
            }
        });

        await Promise.all(promises);
    } catch (error) {
        console.error("Error fetching stud_class documents:", error);
        return;
    }

    try {
        const attendanceSnapshot = await getDocs(attendanceRef);

        for (const attendanceDoc of attendanceSnapshot.docs) {
            const attendanceData = attendanceDoc.data();
            const att_Id = attendanceDoc.id;
            const att_stud_class = attendanceData.student_class.path;
            const status = attendanceData.status;
            const date_time = attendanceData.date_time;
            console.log("Attendance Data:", att_stud_class, status, date_time);

            for (const filteredPromise of filteredPromises) {
                const studRefer = filteredPromise.studRef;
                console.log("studrefer:" + studRefer);
                const student = filteredPromise.stud_name;
                const email = filteredPromise.stud_email;
                const nonstat = "";
                const nondate = "";

                const currentDate = new Date();
                currentDate.setHours(0, 0, 0, 0);
                const selectedDateStart = new Date(currentDate);
                selectedDateStart.setHours(0, 0, 0, 0);
                const selectedDateEnd = new Date(currentDate);
                selectedDateEnd.setHours(23, 59, 59, 999);

                let date_time;

                if (!attendanceData.date_time) {
                    date_time = 0;
                } else {
                    date_time = attendanceData.date_time.toDate();
                    date_time.setHours(0, 0, 0, 0);
                }

                const existingIndex = filteredAttendance.findIndex(item => item.student === student);
                console.log("date_time:" + date_time);
                console.log("curDate: " + selectedDateStart + selectedDateEnd);

                if (att_stud_class === studRefer &&
                    date_time >= selectedDateStart &&
                    date_time <= selectedDateEnd) {
                    if (existingIndex !== -1) {
                        filteredAttendance[existingIndex].att_stud_class = studRefer;
                        filteredAttendance[existingIndex].status = status;
                        filteredAttendance[existingIndex].date_time = date_time;
                        filteredAttendance[existingIndex].att_Id = att_Id;
                        filteredAttendance[existingIndex].email = email;
                    } else {
                        filteredAttendance.push({
                            att_Id: att_Id,
                            student: student,
                            email: email,
                            att_stud_class: att_stud_class,
                            status: status,
                            date_time: date_time
                        });
                    }
                } else {
                    if (existingIndex === -1) {
                        filteredAttendance.push({
                            att_Id: att_Id,
                            student: student,
                            email: email,
                            att_stud_class: studRefer,
                            status: nonstat,
                            date_time: nondate
                        });
                    }
                }

                console.log("existingIndex:", existingIndex);
                console.log("filteredAttendance:", filteredAttendance);
            }

        }

        const filteredAttendanceData = filteredAttendance;
        filteredAttendanceData.sort(sortByStudentName);
        let emailBody;

        const rows = [];

        for (const attendance of filteredAttendanceData) {
            const att_Id = attendance.att_Id;
            const student = attendance.student;
            const email = attendance.email;
            const student_class = attendance.att_stud_class;
            const status = attendance.status;
            const date = attendance.date_time;

            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);
            const selectedDateStart = new Date(currentDate);
            selectedDateStart.setHours(0, 0, 0, 0);
            const selectedDateEnd = new Date(currentDate);
            selectedDateEnd.setHours(23, 59, 59, 999);

            if (studRefs.includes(student_class) &&
                date >= selectedDateStart &&
                date <= selectedDateEnd) {
                console.log("Attendance Checked at this point");
                const formattedDate = date.toISOString().split('T')[0]; // Get the date part
                // Prepare the email body
                const emailBody = collatedAttendance.map((attendance) => {
                    return `${attendance.student}: ${attendance.status} on ${formattedDate}`;
                }).join('\n');
                
            } else {
                console.log("Storing Absent Attendance");
                
            }
        }
        const mailOptions = {
            from: 'capstonetestustp@gmail.com',
            to: email, // Replace with the actual student's email
            subject: 'Collated Attendance Report',
            text: `Dear Instructor,\n\n${emailBody}\n\nSincerely,\nUSTP`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email: ', error);
            } else {
                console.log('Email sent: ', info.response);
            }
        });
    } catch (error) {
        console.error("Error fetching attendance documents:", error);
    }
}


// Function to generate PDF using jsPDF
const generatePDF = async (htmlContent) => {
    try {
        const pdf = new jsPDF();
        await pdf.html(htmlContent);
        return pdf.output('arraybuffer');
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    }
};

// Function to retrieve and display data based on the selected class
const sendMailStudents = async () => {
    const userId = "nHZNH5cNkiROddDcg9oY8M6wXPI3";
    const userRef = collection(db, "Attendance_Monitoring");
    const stud_classRef = collection(userRef, userId, "stud_class");
    const attendanceRef = collection(userRef, userId, "attendance");
    const classListRef = collection(userRef, userId, "class_list");
    const profileRef = collection(db, "Attendance_Monitoring", userId, 'profile');

    const studRefs = [];
    const stud_names = [];
    let stud_name;
    let counter = 1;

    const filteredPromises = [];
    const filteredAttendance = [];

    const sortByStudentName = (a, b) => {
        const nameA = a.student.toUpperCase();
        const nameB = b.student.toUpperCase();

        if (nameA < nameB) {
            return -1;
        }
        if (nameA > nameB) {
            return 1;
        }
        return 0;
    };

    try {
        const studClassSnapshot = await getDocs(stud_classRef);

        const promises = studClassSnapshot.docs.map(async (studClassDoc) => {
            const studClassData = studClassDoc.data();
            const studentRef = studClassData.student;
            const classRef = studClassData.class;

            const [studentDoc, classDoc] = await Promise.all([getDoc(studentRef), getDoc(classRef)]);

            if (studentDoc.exists && classDoc.exists && classDoc.data().class_name_sec === "ITE184-IT4D") {
                stud_name = studentDoc.data().stud_name;
                const class_name_sec = classDoc.data().class_name_sec;
                const studRef = studClassDoc.ref.path;
                studRefs.push(studRef);
                stud_names.push({ stud_name, studRef });
                console.log(stud_name, class_name_sec);

                filteredPromises.push({ stud_name, class_name_sec, studRef });
            }
        });

        await Promise.all(promises);
    } catch (error) {
        console.error("Error fetching stud_class documents:", error);
        return;
    }

    try {
        const attendanceSnapshot = await getDocs(attendanceRef);

        for (const attendanceDoc of attendanceSnapshot.docs) {
            const attendanceData = attendanceDoc.data();
            const att_Id = attendanceDoc.id;
            const att_stud_class = attendanceData.student_class.path;
            const status = attendanceData.status;
            const date_time = attendanceData.date_time;
            console.log("Attendance Data:", att_stud_class, status, date_time);

            for (const filteredPromise of filteredPromises) {
                const studRefer = filteredPromise.studRef;
                console.log("studrefer:" + studRefer);
                const student = filteredPromise.stud_name;
                const nonstat = "";
                const nondate = "";

                const currentDate = new Date();
                currentDate.setHours(0, 0, 0, 0);
                const selectedDateStart = new Date(currentDate);
                selectedDateStart.setHours(0, 0, 0, 0);
                const selectedDateEnd = new Date(currentDate);
                selectedDateEnd.setHours(23, 59, 59, 999);

                let date_time_value;

                if (!date_time) {
                    date_time_value = 0;
                } else {
                    date_time_value = date_time.toDate();
                    date_time_value.setHours(0, 0, 0, 0);
                }

                const existingIndex = filteredAttendance.findIndex(item => item.student === student);
                console.log("date_time:" + date_time_value);
                console.log("curDate: " + selectedDateStart + selectedDateEnd);

                if (att_stud_class === studRefer &&
                    date_time_value >= selectedDateStart &&
                    date_time_value <= selectedDateEnd) {
                    if (existingIndex !== -1) {
                        filteredAttendance[existingIndex] = {
                            att_Id,
                            student,
                            att_stud_class: studRefer,
                            status,
                            date_time: date_time_value
                        };
                    } else {
                        filteredAttendance.push({
                            att_Id,
                            student,
                            att_stud_class: studRefer,
                            status,
                            date_time: date_time_value
                        });
                    }
                } else {
                    if (existingIndex === -1) {
                        filteredAttendance.push({
                            att_Id,
                            student,
                            att_stud_class: studRefer,
                            status: nonstat,
                            date_time: nondate
                        });
                    }
                }

                console.log("existingIndex:", existingIndex);
                console.log("filteredAttendance:", filteredAttendance);
            }
        }

        const filteredAttendanceData = filteredAttendance.slice();
        filteredAttendanceData.sort(sortByStudentName);

        const rows = [];

        for (const attendance of filteredAttendanceData) {
            const att_Id = attendance.att_Id;
            const student = attendance.student;
            const student_class = attendance.att_stud_class;
            const status = attendance.status;
            const date = attendance.date_time;

            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);
            const selectedDateStart = new Date(currentDate);
            selectedDateStart.setHours(0, 0, 0, 0);
            const selectedDateEnd = new Date(currentDate);
            selectedDateEnd.setHours(23, 59, 59, 999);

            if (studRefs.includes(student_class) &&
                date >= selectedDateStart &&
                date <= selectedDateEnd) {
                // Format the date and time
                const formattedDate = date.toLocaleDateString(); // Adjust the format based on your preference
                const formattedTime = date.toLocaleTimeString(); // Adjust the format based on your preference

                const time_in = `${formattedTime}`;
                console.log(stud_name, time_in, status);
                const statusStyle = status === 'Absent' ? 'color: red;' : status === 'Present on time' ? 'color: green;' : status === 'Late' ? 'color: orange;' : status === 'Excuse' ? 'color: gray;' : '';

                const row = `<tr>
                    <td>${counter}</td>
                    <td>${student}</td>
                    <td>${time_in}</td>
                    <td style="${statusStyle}">${status}</td>
                </tr>`;

                // Push a promise for each row to the attendancePromises array
                rows.push(row);

                // Increment the counter for the next iteration
                counter++;
            } else {
                const time_in = '';
                const status = '';
                const row = `<tr>
                    <td>${counter}</td>
                    <td>${student}</td>
                    <td>${time_in}</td>
                    <td>${status}</td>
                </tr>`;
                rows.push(row);
                counter++;
            }
        }

        const formattedDate = new Date().toLocaleDateString(); // Adjust the format based on your preference

        const html = `<html lang="en">
            <head>
                <style>
                    /* Add any additional styling here */
                </style>
            </head>
            <body>
                <h1>Attendance Report - ${formattedDate}</h1>
                <table>
                <thead>
											<tr>
												<td>No. </td>
												<td>Name</td>
												<td>Time In</td>
												<td>Status</td>
											</tr>
										</thead>
                                        <tbody>
                    <!-- Your existing table structure goes here -->
                    ${rows.join('')}
                    </tbody>
                </table>
            </body>
        </html>`;

        // Generate PDF using jsPDF
        const pdfBuffer = await generatePDF(html);

        const profileRefSnapshot = await getDocs(profileRef);
        const user = profileRefSnapshot.docs[0].data(); // Assuming there is only one user
        const { fname, lname, email } = user;

        const currentDate = new Date();
        const formattedDateForSubject = currentDate.toISOString().split('T')[0];

        // Attach the PDF to the email
        const mailOptions = {
            from: 'capstonetestustp@gmail.com',
            to: email,
            subject: `${formattedDateForSubject} Attendance Report`,
            text: `Dear ${fname} ${lname},\n\nAttached here is the attendance report for your ITE184-IT4D class on ${formattedDateForSubject}. If you have received this email by mistake, please contact us.\n\nSincerely,\nUSTP`,
            attachments: [
                {
                    filename: 'Attendance_Report.pdf',
                    content: pdfBuffer,
                    encoding: 'base64',
                    contentType: 'application/pdf',
                },
            ],
        };

        // Send the email with the attached PDF
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email: ', error);
            } else {
                console.log('Email sent: ', info.response);
            }
        });
    } catch (error) {
        console.error("Error fetching attendance documents:", error);
    }
};

async function markAbsentCOMSYS1() {

    userId = "UWJ8xFUHj2Srv33QmeOHFdJkz7j1";
    userRef = collection(db, "Attendance_Monitoring");
    stud_classRef = collection(userRef, userId, "stud_class");
    attendanceRef = collection(userRef, userId, "attendance");
    classListRef = collection(userRef, userId, "class_list");

    let studRefs = [];
    let stud_names = [];
    let stud_name;

    const filteredPromises = [];
    const filteredAttendance = [];

    function sortByStudentName(a, b) {
        const nameA = a.student.toUpperCase();
        const nameB = b.student.toUpperCase();

        if (nameA < nameB) {
            return -1;
        }
        if (nameA > nameB) {
            return 1;
        }
        return 0;
    }

    try {
        const studClassSnapshot = await getDocs(stud_classRef);

        const promises = studClassSnapshot.docs.map(async (studClassDoc) => {
            const studClassData = studClassDoc.data();
            const studentRef = studClassData.student;
            const classRef = studClassData.class;

            let studRef;

            const [studentDoc, classDoc] = await Promise.all([getDoc(studentRef), getDoc(classRef)]);

            if (studentDoc.exists && classDoc.exists && classDoc.data().class_name_sec === "ECE415 - Communication System Analysis") {
                stud_name = studentDoc.data().stud_name;
                stud_email = studentDoc.data().stud_email;
                const class_name_sec = classDoc.data().class_name_sec;
                studRef = studClassDoc.ref.path;
                studRefs.push(studRef);
                stud_names.push({ stud_name, stud_email, studRef });
                console.log(stud_name, class_name_sec, stud_email);

                filteredPromises.push({ stud_name, class_name_sec, stud_email, studRef });
            }
        });

        await Promise.all(promises);
    } catch (error) {
        console.error("Error fetching stud_class documents:", error);
        return;
    }

    try {
        const attendanceSnapshot = await getDocs(attendanceRef);

        for (const attendanceDoc of attendanceSnapshot.docs) {
            const attendanceData = attendanceDoc.data();
            const att_Id = attendanceDoc.id;
            const att_stud_class = attendanceData.student_class.path;
            const status = attendanceData.status;
            const date_time = attendanceData.date_time;
            console.log("Attendance Data:", att_stud_class, status, date_time);

            for (const filteredPromise of filteredPromises) {
                const studRefer = filteredPromise.studRef;
                console.log("studrefer:" + studRefer);
                const student = filteredPromise.stud_name;
                const email = filteredPromise.stud_email;
                const nonstat = "";
                const nondate = "";

                const currentDate = new Date();
                currentDate.setHours(0, 0, 0, 0);
                const selectedDateStart = new Date(currentDate);
                selectedDateStart.setHours(0, 0, 0, 0);
                const selectedDateEnd = new Date(currentDate);
                selectedDateEnd.setHours(23, 59, 59, 999);

                let date_time;

                if (!attendanceData.date_time) {
                    date_time = 0;
                } else {
                    date_time = attendanceData.date_time.toDate();
                    date_time.setHours(0, 0, 0, 0);
                }

                const existingIndex = filteredAttendance.findIndex(item => item.student === student);
                console.log("date_time:" + date_time);
                console.log("curDate: " + selectedDateStart + selectedDateEnd);

                if (att_stud_class === studRefer &&
                    date_time >= selectedDateStart &&
                    date_time <= selectedDateEnd) {
                    if (existingIndex !== -1) {
                        filteredAttendance[existingIndex].att_stud_class = studRefer;
                        filteredAttendance[existingIndex].status = status;
                        filteredAttendance[existingIndex].date_time = date_time;
                        filteredAttendance[existingIndex].att_Id = att_Id;
                        filteredAttendance[existingIndex].email = email;
                    } else {
                        filteredAttendance.push({
                            att_Id: att_Id,
                            student: student,
                            email: email,
                            att_stud_class: att_stud_class,
                            status: status,
                            date_time: date_time
                        });
                    }
                } else {
                    if (existingIndex === -1) {
                        filteredAttendance.push({
                            att_Id: att_Id,
                            student: student,
                            email: email,
                            att_stud_class: studRefer,
                            status: nonstat,
                            date_time: nondate
                        });
                    }
                }

                console.log("existingIndex:", existingIndex);
                console.log("filteredAttendance:", filteredAttendance);
            }

        }

        const filteredAttendanceData = filteredAttendance;
        filteredAttendanceData.sort(sortByStudentName);

        const rows = [];

        for (const attendance of filteredAttendanceData) {
            const att_Id = attendance.att_Id;
            const student = attendance.student;
            const email = attendance.email;
            const student_class = attendance.att_stud_class;
            const status = attendance.status;
            const date = attendance.date_time;

            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);
            const selectedDateStart = new Date(currentDate);
            selectedDateStart.setHours(0, 0, 0, 0);
            const selectedDateEnd = new Date(currentDate);
            selectedDateEnd.setHours(23, 59, 59, 999);

            if (studRefs.includes(student_class) &&
                date >= selectedDateStart &&
                date <= selectedDateEnd) {
                console.log("Attendance Checked at this point");
                const formattedDate = date.toISOString().split('T')[0]; // Get the date part
                const mailOptions = {
                    from: 'capstonetestustp@gmail.com',
                    to: email, // Replace with the actual student's email
                    subject: 'Attendance Notification',
                    text: `Dear ${student},\n\nYou were marked ${status} on ${formattedDate} in  your ITE184-IT4D class. Please contact us if there is any discrepancy.\n\nSincerely,\nUSTP`
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error('Error sending email: ', error);
                    } else {
                        console.log('Email sent: ', info.response);
                    }
                });
            } else {
                console.log("Storing Absent Attendance");
                await createAttendanceDocument("Absent", student_class);
                const date = new Date();
                const formattedDate = date.toISOString().split('T')[0]; // Get the date part
                const mailOptions = {
                    from: 'capstonetestustp@gmail.com',
                    to: email, // Replace with the actual student's email
                    subject: 'Attendance Notification',
                    text: `Dear ${student},\n\nYou were marked Absent on ${formattedDate} in  your ITE184-IT4D class. Please contact us if there is any discrepancy.\n\nSincerely,\nUSTP`
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error('Error sending email: ', error);
                    } else {
                        console.log('Email sent: ', info.response);
                    }
                });
            }
        }
    } catch (error) {
        console.error("Error fetching attendance documents:", error);
    }
}

async function markAbsentMicro2() {

    userId = "6jOHKDfcdNgLg3gSoiP4QTMsmlE2";
    userRef = collection(db, "Attendance_Monitoring");
    stud_classRef = collection(userRef, userId, "stud_class");
    attendanceRef = collection(userRef, userId, "attendance");
    classListRef = collection(userRef, userId, "class_list");

    let studRefs = [];
    let stud_names = [];
    let stud_name;

    const filteredPromises = [];
    const filteredAttendance = [];

    function sortByStudentName(a, b) {
        const nameA = a.student.toUpperCase();
        const nameB = b.student.toUpperCase();

        if (nameA < nameB) {
            return -1;
        }
        if (nameA > nameB) {
            return 1;
        }
        return 0;
    }

    try {
        const studClassSnapshot = await getDocs(stud_classRef);

        const promises = studClassSnapshot.docs.map(async (studClassDoc) => {
            const studClassData = studClassDoc.data();
            const studentRef = studClassData.student;
            const classRef = studClassData.class;

            let studRef;

            const [studentDoc, classDoc] = await Promise.all([getDoc(studentRef), getDoc(classRef)]);

            if (studentDoc.exists && classDoc.exists && classDoc.data().class_name_sec === "ECE417 Microelectronics - ECE4A") {
                stud_name = studentDoc.data().stud_name;
                stud_email = studentDoc.data().stud_email;
                const class_name_sec = classDoc.data().class_name_sec;
                studRef = studClassDoc.ref.path;
                studRefs.push(studRef);
                stud_names.push({ stud_name, stud_email, studRef });
                console.log(stud_name, class_name_sec, stud_email);

                filteredPromises.push({ stud_name, class_name_sec, stud_email, studRef });
            }
        });

        await Promise.all(promises);
    } catch (error) {
        console.error("Error fetching stud_class documents:", error);
        return;
    }

    try {
        const attendanceSnapshot = await getDocs(attendanceRef);

        for (const attendanceDoc of attendanceSnapshot.docs) {
            const attendanceData = attendanceDoc.data();
            const att_Id = attendanceDoc.id;
            const att_stud_class = attendanceData.student_class.path;
            const status = attendanceData.status;
            const date_time = attendanceData.date_time;
            console.log("Attendance Data:", att_stud_class, status, date_time);

            for (const filteredPromise of filteredPromises) {
                const studRefer = filteredPromise.studRef;
                console.log("studrefer:" + studRefer);
                const student = filteredPromise.stud_name;
                const email = filteredPromise.stud_email;
                const nonstat = "";
                const nondate = "";

                const currentDate = new Date();
                currentDate.setHours(0, 0, 0, 0);
                const selectedDateStart = new Date(currentDate);
                selectedDateStart.setHours(0, 0, 0, 0);
                const selectedDateEnd = new Date(currentDate);
                selectedDateEnd.setHours(23, 59, 59, 999);

                let date_time;

                if (!attendanceData.date_time) {
                    date_time = 0;
                } else {
                    date_time = attendanceData.date_time.toDate();
                    date_time.setHours(0, 0, 0, 0);
                }

                const existingIndex = filteredAttendance.findIndex(item => item.student === student);
                console.log("date_time:" + date_time);
                console.log("curDate: " + selectedDateStart + selectedDateEnd);

                if (att_stud_class === studRefer &&
                    date_time >= selectedDateStart &&
                    date_time <= selectedDateEnd) {
                    if (existingIndex !== -1) {
                        filteredAttendance[existingIndex].att_stud_class = studRefer;
                        filteredAttendance[existingIndex].status = status;
                        filteredAttendance[existingIndex].date_time = date_time;
                        filteredAttendance[existingIndex].att_Id = att_Id;
                        filteredAttendance[existingIndex].email = email;
                    } else {
                        filteredAttendance.push({
                            att_Id: att_Id,
                            student: student,
                            email: email,
                            att_stud_class: att_stud_class,
                            status: status,
                            date_time: date_time
                        });
                    }
                } else {
                    if (existingIndex === -1) {
                        filteredAttendance.push({
                            att_Id: att_Id,
                            student: student,
                            email: email,
                            att_stud_class: studRefer,
                            status: nonstat,
                            date_time: nondate
                        });
                    }
                }

                console.log("existingIndex:", existingIndex);
                console.log("filteredAttendance:", filteredAttendance);
            }

        }

        const filteredAttendanceData = filteredAttendance;
        filteredAttendanceData.sort(sortByStudentName);

        const rows = [];

        for (const attendance of filteredAttendanceData) {
            const att_Id = attendance.att_Id;
            const student = attendance.student;
            const email = attendance.email;
            const student_class = attendance.att_stud_class;
            const status = attendance.status;
            const date = attendance.date_time;

            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);
            const selectedDateStart = new Date(currentDate);
            selectedDateStart.setHours(0, 0, 0, 0);
            const selectedDateEnd = new Date(currentDate);
            selectedDateEnd.setHours(23, 59, 59, 999);

            if (studRefs.includes(student_class) &&
                date >= selectedDateStart &&
                date <= selectedDateEnd) {
                console.log("Attendance Checked at this point");
                const formattedDate = date.toISOString().split('T')[0]; // Get the date part
                const mailOptions = {
                    from: 'capstonetestustp@gmail.com',
                    to: email, // Replace with the actual student's email
                    subject: 'Attendance Notification',
                    text: `Dear ${student},\n\nYou were marked ${status} on ${formattedDate} in  your ITE184-IT4D class. Please contact us if there is any discrepancy.\n\nSincerely,\nUSTP`
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error('Error sending email: ', error);
                    } else {
                        console.log('Email sent: ', info.response);
                    }
                });
            } else {
                console.log("Storing Absent Attendance");
                await createAttendanceDocument("Absent", student_class);
                const date = new Date();
                const formattedDate = date.toISOString().split('T')[0]; // Get the date part
                const mailOptions = {
                    from: 'capstonetestustp@gmail.com',
                    to: email, // Replace with the actual student's email
                    subject: 'Attendance Notification',
                    text: `Dear ${student},\n\nYou were marked Absent on ${formattedDate} in  your ITE184-IT4D class. Please contact us if there is any discrepancy.\n\nSincerely,\nUSTP`
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error('Error sending email: ', error);
                    } else {
                        console.log('Email sent: ', info.response);
                    }
                });
            }
        }
    } catch (error) {
        console.error("Error fetching attendance documents:", error);
    }
}


/*

const generatePDF = async (html) => {
    const browser = await puppeteer.launch({
        executablePath: 'C:\Users\Acer\.cache\puppeteer\chrome\win64-119.0.6045.105\chrome-win64\chrome.exe',
        headless: true,
        args:['--no-sandbox']
    });
    const page = await browser.newPage();

    // Set the content of the page to your HTML
    await page.setContent(html);

    // Generate the PDF buffer
    const pdfBuffer = await page.pdf({
        format: 'Letter',
        printBackground: true,
    });

    await browser.close();

    return pdfBuffer;
};

const sendMailStudents = async () => {
    const userId = "nHZNH5cNkiROddDcg9oY8M6wXPI3";
    const userRef = collection(db, "Attendance_Monitoring");
    const stud_classRef = collection(userRef, userId, "stud_class");
    const attendanceRef = collection(userRef, userId, "attendance");
    const classListRef = collection(userRef, userId, "class_list");
    const profileRef = collection(db, "Attendance_Monitoring", userId, 'profile');

    const studRefs = [];
    const stud_names = [];
    let stud_name;
    let counter = 1;

    const filteredPromises = [];
    const filteredAttendance = [];

    const sortByStudentName = (a, b) => {
        const nameA = a.student.toUpperCase();
        const nameB = b.student.toUpperCase();

        if (nameA < nameB) {
            return -1;
        }
        if (nameA > nameB) {
            return 1;
        }
        return 0;
    };

    try {
        const studClassSnapshot = await getDocs(stud_classRef);

        const promises = studClassSnapshot.docs.map(async (studClassDoc) => {
            const studClassData = studClassDoc.data();
            const studentRef = studClassData.student;
            const classRef = studClassData.class;

            const [studentDoc, classDoc] = await Promise.all([getDoc(studentRef), getDoc(classRef)]);

            if (studentDoc.exists && classDoc.exists && classDoc.data().class_name_sec === "ITE184-IT4D") {
                stud_name = studentDoc.data().stud_name;
                const class_name_sec = classDoc.data().class_name_sec;
                const studRef = studClassDoc.ref.path;
                studRefs.push(studRef);
                stud_names.push({ stud_name, studRef });
                console.log(stud_name, class_name_sec);

                filteredPromises.push({ stud_name, class_name_sec, studRef });
            }
        });

        await Promise.all(promises);
    } catch (error) {
        console.error("Error fetching stud_class documents:", error);
        return;
    }

    try {
        const attendanceSnapshot = await getDocs(attendanceRef);

        for (const attendanceDoc of attendanceSnapshot.docs) {
            const attendanceData = attendanceDoc.data();
            const att_Id = attendanceDoc.id;
            const att_stud_class = attendanceData.student_class.path;
            const status = attendanceData.status;
            const date_time = attendanceData.date_time;
            console.log("Attendance Data:", att_stud_class, status, date_time);

            for (const filteredPromise of filteredPromises) {
                const studRefer = filteredPromise.studRef;
                console.log("studrefer:" + studRefer);
                const student = filteredPromise.stud_name;
                const nonstat = "";
                const nondate = "";

                const currentDate = new Date();
                currentDate.setHours(0, 0, 0, 0);
                const selectedDateStart = new Date(currentDate);
                selectedDateStart.setHours(0, 0, 0, 0);
                const selectedDateEnd = new Date(currentDate);
                selectedDateEnd.setHours(23, 59, 59, 999);

                let date_time_value;

                if (!date_time) {
                    date_time_value = 0;
                } else {
                    date_time_value = date_time.toDate();
                    date_time_value.setHours(0, 0, 0, 0);
                }

                const existingIndex = filteredAttendance.findIndex(item => item.student === student);
                console.log("date_time:" + date_time_value);
                console.log("curDate: " + selectedDateStart + selectedDateEnd);

                if (att_stud_class === studRefer &&
                    date_time_value >= selectedDateStart &&
                    date_time_value <= selectedDateEnd) {
                    if (existingIndex !== -1) {
                        filteredAttendance[existingIndex] = {
                            att_Id,
                            student,
                            att_stud_class: studRefer,
                            status,
                            date_time: date_time_value
                        };
                    } else {
                        filteredAttendance.push({
                            att_Id,
                            student,
                            att_stud_class: studRefer,
                            status,
                            date_time: date_time_value
                        });
                    }
                } else {
                    if (existingIndex === -1) {
                        filteredAttendance.push({
                            att_Id,
                            student,
                            att_stud_class: studRefer,
                            status: nonstat,
                            date_time: nondate
                        });
                    }
                }

                console.log("existingIndex:", existingIndex);
                console.log("filteredAttendance:", filteredAttendance);
            }
        }

        const filteredAttendanceData = filteredAttendance.slice();
        filteredAttendanceData.sort(sortByStudentName);

        const rows = [];

        for (const attendance of filteredAttendanceData) {
            const att_Id = attendance.att_Id;
            const student = attendance.student;
            const student_class = attendance.att_stud_class;
            const status = attendance.status;
            const date = attendance.date_time;

            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);
            const selectedDateStart = new Date(currentDate);
            selectedDateStart.setHours(0, 0, 0, 0);
            const selectedDateEnd = new Date(currentDate);
            selectedDateEnd.setHours(23, 59, 59, 999);

            if (studRefs.includes(student_class) &&
                date >= selectedDateStart &&
                date <= selectedDateEnd) {
                // Format the date and time
                const formattedDate = date.toLocaleDateString(); // Adjust the format based on your preference
                const formattedTime = date.toLocaleTimeString(); // Adjust the format based on your preference

                const time_in = `${formattedTime}`;
                console.log(stud_name, time_in, status);
                const statusStyle = status === 'Absent' ? 'color: red;' : status === 'Present on time' ? 'color: green;' : status === 'Late' ? 'color: orange;' : status === 'Excuse' ? 'color: gray;' : '';

                const row = `<tr>
                    <td>${counter}</td>
                    <td>${student}</td>
                    <td>${time_in}</td>
                    <td style="${statusStyle}">${status}</td>
                </tr>`;

                // Push a promise for each row to the attendancePromises array
                rows.push(row);

                // Increment the counter for the next iteration
                counter++;
            } else {
                const time_in = '';
                const status = '';
                const row = `<tr>
                    <td>${counter}</td>
                    <td>${student}</td>
                    <td>${time_in}</td>
                    <td>${status}</td>
                </tr>`;
                rows.push(row);
                counter++;
            }
        }

        const formattedDate = new Date().toLocaleDateString(); // Adjust the format based on your preference

        const html = `<html lang="en">
            <!-- ... (your existing HTML content) ... -->
        </html>`;

        // Generate PDF using puppeteer
        const pdfBuffer = await generatePDF(html);

        const profileRefSnapshot = await getDocs(profileRef);
        const user = profileRefSnapshot.docs[0].data(); // Assuming there is only one user
        const { fname, lname, email } = user;

        const currentDate = new Date();
        const formattedDateForSubject = currentDate.toISOString().split('T')[0];

        // Attach the PDF to the email
        const mailOptions = {
            from: 'capstonetestustp@gmail.com',
            to: email,
            subject: `${formattedDateForSubject} Attendance Report`,
            text: `Dear ${fname} ${lname},\n\nAttached here is the attendance report for your ITE184-IT4D class on ${formattedDateForSubject}. If you have received this email by mistake, please contact us.\n\nSincerely,\nUSTP`,
            attachments: [
                {
                    filename: 'Attendance_Report.pdf',
                    content: pdfBuffer,
                    encoding: 'base64',
                    contentType: 'application/pdf',
                },
            ],
        };

        // Send the email with the attached PDF
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email: ', error);
            } else {
                console.log('Email sent: ', info.response);
            }
        });
    } catch (error) {
        console.error("Error fetching attendance documents:", error);
    }
};
*/


/*
exports.markAbsentStudents = onSchedule("25 22 * 1 1", async (event) => {
    try {
        await markAbsentStudents();
        console.log('Function executed successfully.');
    } catch (error) {
        console.error('Error in function:', error);
    }
});

exports.markAbsentCOMSYS1 = onSchedule("0 21 * 1 5", async (event) => {
    try {
        await markAbsentStudents();
        console.log('Function executed successfully.');
    } catch (error) {
        console.error('Error in function:', error);
    }
});


exports.markAbsentMicro2 = onSchedule("0 18 * 1 3", async (event) => {
    try {
        await markAbsentStudents();
        console.log('Function executed successfully.');
    } catch (error) {
        console.error('Error in function:', error);
    }
});*/


exports.sendMailStudents = onSchedule("50 17 * 1 0", async (event) => {
    try {
        await sendMailStudents();
        console.log('Function executed successfully.');
    } catch (error) {
        console.error('Error in function:', error);
    }
});
