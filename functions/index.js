const { onSchedule } = require("firebase-functions/v2/scheduler");
const { setGlobalOptions } = require("firebase-functions/v2");
setGlobalOptions({ maxInstances: 10 });
const { jsPDF } = require('jspdf');
require('jspdf-autotable');


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
                    text: `Dear ${student},\n\nYou were marked ${status} on ${formattedDate} in  your ECE415 - Communication System Analysis class. Please contact us if there is any discrepancy.\n\nSincerely,\nUSTP`
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
                    text: `Dear ${student},\n\nYou were marked Absent on ${formattedDate} in  your ECE415 - Communication System Analysis class. Please contact us if there is any discrepancy.\n\nSincerely,\nUSTP`
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
                    text: `Dear ${student},\n\nYou were marked ${status} on ${formattedDate} in  your ECE417 Microelectronics - ECE4A class. Please contact us if there is any discrepancy.\n\nSincerely,\nUSTP`
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
                    text: `Dear ${student},\n\nYou were marked Absent on ${formattedDate} in  your ECE417 Microelectronics - ECE4A class. Please contact us if there is any discrepancy.\n\nSincerely,\nUSTP`
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

async function sendReportMicro() {

    userId = "6jOHKDfcdNgLg3gSoiP4QTMsmlE2";
    userRef = collection(db, "Attendance_Monitoring");
    stud_classRef = collection(userRef, userId, "stud_class");
    attendanceRef = collection(userRef, userId, "attendance");
    classListRef = collection(userRef, userId, "class_list");
    profileRef = collection(db, "Attendance_Monitoring", userId, 'profile');

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
            const time = attendanceData.date_time;
            const date_time = attendanceData.date_time;
            console.log("Attendance Data:", att_stud_class, status, date_time, time);

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
                        filteredAttendance[existingIndex].time = time;
                    } else {
                        filteredAttendance.push({
                            att_Id: att_Id,
                            student: student,
                            email: email,
                            att_stud_class: att_stud_class,
                            status: status,
                            date_time: date_time,
                            time: time,
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
        let emailBody = [];
        let formattedDate;

        const rows = [];

        for (const attendance of filteredAttendanceData) {
            const att_Id = attendance.att_Id;
            const student = attendance.student;
            const email = attendance.email;
            const student_class = attendance.att_stud_class;
            const status = attendance.status;
            const date = attendance.date_time;
            const time = attendance.time;

            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);
            const selectedDateStart = new Date(currentDate);
            selectedDateStart.setHours(0, 0, 0, 0);
            const selectedDateEnd = new Date(currentDate);
            selectedDateEnd.setHours(23, 59, 59, 999);

            if (studRefs.includes(student_class) &&
                date >= selectedDateStart &&
                date <= selectedDateEnd) {
                formattedDate = date.toISOString().split('T')[0]; // Get the date part
                const newTime = time.toDate();
                const formattedTime = newTime.toLocaleTimeString();
                // Prepare the email body
                emailBody.push({
                    student: student,
                    status: status,
                    time: formattedTime
                });
                console.log("Attendance Checked at this point");
            } else {
                console.log("Storing Absent Attendance");

            }
        }
        const attendance = emailBody.map(info => [info.student, info.status, info.time]);
        // Generate PDF
        const createPDF = () => {
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "cm",
                format: "a4",
            });

            const pageWidth = pdf.internal.pageSize.getWidth();

            // Add the title in the center at the top
            const title = "ECE417 - ECE4A Attendance Report";
            const titleWidth = pdf.getStringUnitWidth(title) * pdf.internal.getFontSize() / pdf.internal.scaleFactor;
            const titleX = (pageWidth - titleWidth) / 2;
            pdf.text(title, titleX, 3);

            // Set a smaller font size for the date
            pdf.setFontSize(10);

            // Add the date below the title, center-aligned
            const date = "Date: " + formattedDate;
            const dateWidth = pdf.getStringUnitWidth(date) * pdf.internal.getFontSize() / pdf.internal.scaleFactor;
            const dateX = (pageWidth - dateWidth) / 2;
            pdf.text(date, dateX, 4);


            console.log("emailBody content:", attendance);
            pdf.setFontSize(12);
            pdf.autoTable({
                theme: 'grid',
                startY: 5,
                head: [['Student', 'Status', 'Timestamp']],
                body: attendance,
            });

            pdf.save("Attendance Report");

            const pdfOutput = pdf.output("datauristring");
            return pdfOutput;
        }

        const pdfOutput = createPDF();

        getDocs(profileRef).then((userRefSnapshot) => {

            userRefSnapshot.forEach((userListDoc) => {
                const userInfo = userListDoc.data();
                const fname = userInfo.fname;
                const lname = userInfo.lname;
                const email = userInfo.email;

                const mailOptions = {
                    from: 'capstonetestustp@gmail.com',
                    to: email, // Replace with the actual student's email
                    subject: 'Collated Attendance Report',
                    text: `Dear ${fname} ${lname},\n\nThe attached file below is the an attendance report from your ECE417 Microelectronics - ECE4A class held today. Should you have any questions or require further information, please feel free to contact us.\n\nKind Regards,\nUSTP`,
                    attachments: [{ path: pdfOutput }],
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error('Error sending email: ', error);
                    } else {
                        console.log('Email sent: ', info.response);
                    }
                });
            })


        })

    } catch (error) {
        console.error("Error fetching attendance documents:", error);
    }
}

async function sendReportCOMSYS() {

    userId = "UWJ8xFUHj2Srv33QmeOHFdJkz7j1";
    userRef = collection(db, "Attendance_Monitoring");
    stud_classRef = collection(userRef, userId, "stud_class");
    attendanceRef = collection(userRef, userId, "attendance");
    classListRef = collection(userRef, userId, "class_list");
    profileRef = collection(db, "Attendance_Monitoring", userId, 'profile');

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

            if (studentDoc.exists && classDoc.exists && classDoc.data().class_name_sec === "ECE415 Communication System Analysis - ECE4A") {
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
            const time = attendanceData.date_time;
            const date_time = attendanceData.date_time;
            console.log("Attendance Data:", att_stud_class, status, date_time, time);

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
                        filteredAttendance[existingIndex].time = time;
                    } else {
                        filteredAttendance.push({
                            att_Id: att_Id,
                            student: student,
                            email: email,
                            att_stud_class: att_stud_class,
                            status: status,
                            date_time: date_time,
                            time: time,
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
        let emailBody = [];
        let formattedDate;

        const rows = [];

        for (const attendance of filteredAttendanceData) {
            const att_Id = attendance.att_Id;
            const student = attendance.student;
            const email = attendance.email;
            const student_class = attendance.att_stud_class;
            const status = attendance.status;
            const date = attendance.date_time;
            const time = attendance.time;

            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);
            const selectedDateStart = new Date(currentDate);
            selectedDateStart.setHours(0, 0, 0, 0);
            const selectedDateEnd = new Date(currentDate);
            selectedDateEnd.setHours(23, 59, 59, 999);

            if (studRefs.includes(student_class) &&
                date >= selectedDateStart &&
                date <= selectedDateEnd) {
                formattedDate = date.toISOString().split('T')[0]; // Get the date part
                const newTime = time.toDate();
                const formattedTime = newTime.toLocaleTimeString();
                // Prepare the email body
                emailBody.push({
                    student: student,
                    status: status,
                    time: formattedTime
                });
                console.log("Attendance Checked at this point");
            } else {
                console.log("Storing Absent Attendance");

            }
        }
        const attendance = emailBody.map(info => [info.student, info.status, info.time]);
        // Generate PDF
        const createPDF = () => {
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "cm",
                format: "a4",
            });

            const pageWidth = pdf.internal.pageSize.getWidth();

            // Add the title in the center at the top
            const title = "ECE415 - ECE4A Attendance Report";
            const titleWidth = pdf.getStringUnitWidth(title) * pdf.internal.getFontSize() / pdf.internal.scaleFactor;
            const titleX = (pageWidth - titleWidth) / 2;
            pdf.text(title, titleX, 3);

            // Set a smaller font size for the date
            pdf.setFontSize(10);

            // Add the date below the title, center-aligned
            const date = "Date: " + formattedDate;
            const dateWidth = pdf.getStringUnitWidth(date) * pdf.internal.getFontSize() / pdf.internal.scaleFactor;
            const dateX = (pageWidth - dateWidth) / 2;
            pdf.text(date, dateX, 4);


            console.log("emailBody content:", attendance);
            pdf.setFontSize(12);
            pdf.autoTable({
                theme: 'grid',
                startY: 5,
                head: [['Student', 'Status', 'Timestamp']],
                body: attendance,
            });

            pdf.save("Attendance Report");

            const pdfOutput = pdf.output("datauristring");
            return pdfOutput;
        }

        const pdfOutput = createPDF();

        getDocs(profileRef).then((userRefSnapshot) => {

            userRefSnapshot.forEach((userListDoc) => {
                const userInfo = userListDoc.data();
                const fname = userInfo.fname;
                const lname = userInfo.lname;
                const email = userInfo.email;

                const mailOptions = {
                    from: 'capstonetestustp@gmail.com',
                    to: email, // Replace with the actual student's email
                    subject: 'Collated Attendance Report',
                    text: `Dear ${fname} ${lname},\n\nThe attached file below is the an attendance report from your ECE415 Communication System Analysis - ECE4A class held today. Should you have any questions or require further information, please feel free to contact us.\n\nKind Regards,\nUSTP`,
                    attachments: [{ path: pdfOutput }],
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error('Error sending email: ', error);
                    } else {
                        console.log('Email sent: ', info.response);
                    }
                });
            })


        })

    } catch (error) {
        console.error("Error fetching attendance documents:", error);
    }
}

exports.sendReportCOMSYS = onSchedule("0 20 * 1 3", async (event) => {
    try {
        await sendReportCOMSYS();
        console.log('Function executed successfully.');
    } catch (error) {
        console.error('Error in function:', error);
    }
});

exports.markAbsentCOMSYS1 = onSchedule("0 21 * 1 5", async (event) => {
    try {
        await markAbsentCOMSYS1();
        console.log('Function executed successfully.');
    } catch (error) {
        console.error('Error in function:', error);
    }
});


exports.markAbsentMicro2 = onSchedule("30 14 * 1 5", async (event) => {
    try {
        await markAbsentMicro2();
        console.log('Function executed successfully.');
    } catch (error) {
        console.error('Error in function:', error);
    }
});
