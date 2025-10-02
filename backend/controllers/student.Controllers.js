// controllers/studentController.js
import db from "../utils/db.js";
import dotenv from "dotenv";

dotenv.config();

// LOGIN
export const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required." });
  }

  try {
    const [rows] = await db.query(
      `SELECT id, username, name, contact, branch, course, EmailId ,name_contactid
       FROM student 
       WHERE username = ? AND password = ?`,
      [username, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid username or password." });
    }

    const user = rows[0];
    return res.json({ success: true, user });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error while logging in." });
  }
};

export const logout = (req, res) => {
  return res
    .status(200)
    .json({ message: "Logged out successfully.", success: true });
};

export const getBatch = async (req, res) => {
  const { name_contactid, status } = req.query;

  console.log("🔍 Backend - Received request:", { name_contactid, status });

  if (!name_contactid) {
    return res.status(400).json({ message: "name_contactid is required" });
  }

  if (!status) {
    return res.status(400).json({ message: "status is required" });
  }

  try {
    if (status === "Persuing") {
      const sql = `
    SELECT DISTINCT
      fs.subject AS subjectname,
      fs.course,
      'Persuing' AS status,
      fs.batch_time,
      COALESCE(NULLIF(TRIM(fs.faculty), ''), 'N/A') AS faculty,
      fs.startdate,
      fs.endate
    FROM faculty_student fs
    WHERE TRIM(fs.nameid) = ?
      AND LOWER(TRIM(fs.status)) = 'persuing'
      AND TRIM(fs.course) != '' 
      AND UPPER(TRIM(fs.course)) != 'COURSE'
      AND TRIM(fs.subject) != '' 
      AND UPPER(TRIM(fs.subject)) != 'SUBJECTS'
      AND (fs.endate IS NULL OR DATE(fs.endate) >= CURDATE())
    ORDER BY fs.course, fs.subject, fs.batch_time;
  `;

      const [results] = await db.query(sql, [name_contactid]);
      console.log("🔍 Persuing results:", results);

      return res.json({
        status: 200,
        dataLength: results.length,
        data: results,
      });
    } else if (status === "Completed") {
      console.log("🔍 Backend - Processing Completed status");

      const sql = `
        SELECT DISTINCT
          fs.subject AS subjectname,
          fs.course,
          'Completed' AS status,
          fs.batch_time,
          COALESCE(NULLIF(TRIM(fs.faculty), ''), 'N/A') AS faculty,
          fs.startdate,
          fs.endate
        FROM faculty_student fs
        WHERE fs.nameid = ?
          AND fs.course IS NOT NULL
          AND fs.course != ''
          AND fs.course != 'COURSE'
          AND fs.subject IS NOT NULL
          AND fs.subject != ''
          AND fs.subject != 'SUBJECTS'
          AND LOWER(TRIM(fs.status)) = 'completed'
          AND (fs.endate IS NOT NULL AND fs.endate <= CURDATE())
        ORDER BY fs.course, fs.subject, fs.batch_time
      `;

      const [results] = await db.query(sql, [name_contactid]);
      return res.json(results);
    } else if (status === "Pending") {
      console.log("🔍 Backend - Processing Pending status");

      const sql = `
        SELECT 
          s.subjectname,
          s.coursename AS course,
          'Pending' AS status,
          'N/A' AS batch_time,
          'N/A' AS faculty,
          NULL AS startdate,
          NULL AS endate
        FROM subject s
        WHERE s.coursename IN (
            SELECT DISTINCT fs.course
            FROM faculty_student fs 
            WHERE fs.nameid = ?
              AND fs.course IS NOT NULL 
              AND fs.course != ''
        )
        AND s.subjectname NOT IN (
            SELECT DISTINCT fs.subject
            FROM faculty_student fs 
            WHERE fs.nameid = ?
              AND fs.subject IS NOT NULL 
              AND fs.subject != ''
              AND LOWER(TRIM(fs.status)) IN ('persuing','pursuing','completed')
        )
        AND s.subjectname IS NOT NULL
        AND s.subjectname != ''
        AND s.coursename IS NOT NULL
        AND s.coursename != ''
        ORDER BY s.coursename, s.subjectname;
      `;

      const [results] = await db.query(sql, [name_contactid, name_contactid]);
      return res.json(results);
    } else {
      return res.status(400).json({
        message: "Invalid status. Use 'Pending', 'Persuing', or 'Completed'",
      });
    }
  } catch (err) {
    console.error("❌ Backend - Database error:", err);
    return res.status(500).json({
      message: "Database error",
      error: err.message,
      sqlError: err.sqlMessage,
      code: err.code,
    });
  }
};

export const getBatchTimings = async (req, res) => {
  const { name_contactid } = req.query; // Changed from req.user to req.query

  if (!name_contactid) {
    return res.status(400).json({ message: "name_contactid is required" });
  }

  const sql =
    "SELECT DISTINCT batchtime, Subject, course FROM attendence WHERE name = ?";
  try {
    const [results] = await db.query(sql, [name_contactid]);
    const batchTimings = results.map((row) => row.batchtime);
    res.json(batchTimings);
  } catch (err) {
    console.error("Get batch timings error:", err);
    return res.status(500).json({ message: "Database error" });
  }
};

export const getBatchTimetable = async (req, res) => {
  const { name_contactid } = req.query; // Changed from req.user to req.query

  if (!name_contactid) {
    return res.status(400).json({ message: "name_contactid is required" });
  }

  const sql = `SELECT DISTINCT batch_time, faculty, course, subject, startdate, endate FROM faculty_student WHERE nameid = ?`;
  try {
    const [results] = await db.query(sql, [name_contactid]);
    res.json(results);
  } catch (err) {
    console.error("Get batch timetable error:", err);
    return res.status(500).json({ message: "Database error" });
  }
};

export const getAttendance = async (req, res) => {
  const { batchtime, Subject, name_contactid } = req.query; // Added name_contactid to query params

  if (!batchtime || !name_contactid || !Subject) {
    return res
      .status(400)
      .json({ message: "Missing batchtime, subject, or user info." });
  }

  const sql = `SELECT DISTINCT a.date, a.topic, a.attendence, a.Subject AS subject_name, a.batchtime, 
                fs.faculty, fs.startdate, fs.endate
              FROM attendence a
              JOIN faculty_student fs ON a.batchtime = fs.batch_time AND a.Subject = fs.subject
              WHERE a.batchtime = ? AND a.name = ? AND a.Subject = ?
              GROUP BY a.date, a.topic, a.attendence, a.Subject, a.batchtime, fs.faculty, fs.startdate, fs.endate;`;

  try {
    const [results] = await db.query(sql, [batchtime, name_contactid, Subject]);
    if (results.length === 0) {
      return res.status(404).json({ message: "No attendance records found." });
    }
    res.json(results);
  } catch (err) {
    console.error("Get attendance error:", err);
    return res.status(500).json({ message: "Database error" });
  }
};

export const getFeeDetails = async (req, res) => {
  const { name_contactid } = req.query; // Changed from req.user to req.query

  if (!name_contactid) {
    return res.status(400).json({ message: "name_contactid is required" });
  }

  const sql = `SELECT DISTINCT Receipt, name, course, Recieve, Dates, ModeOfPayement, courseFees, Paid, Balance, status, totalfees, course FROM payement WHERE name_contactid = ?`;

  try {
    const [results] = await db.query(sql, [name_contactid]);
    res.json(results);
  } catch (err) {
    console.error("Get fee details error:", err);
    return res.status(500).json({ message: "Database error" });
  }
};

export const getCourse = async (req, res) => {
  console.log("🔍 Backend - Query parameters received:", req.query);

  let { name_contactid } = req.query;

  // Validate and clean the parameter
  if (!name_contactid) {
    console.log("❌ Backend - No name_contactid provided");
    return res.status(400).json({
      success: false,
      message: "name_contactid is required",
      receivedParams: req.query,
    });
  }

  // Clean and decode the identifier
  name_contactid = name_contactid.toString().trim();

  // Replace encoded spaces and other characters
  const cleanIdentifier = name_contactid
    .replace(/\+/g, " ")
    .replace(/%20/g, " ")
    .replace(/%2B/g, "+");

  console.log("🔍 Backend - Original identifier:", name_contactid);
  console.log("🔍 Backend - Cleaned identifier:", cleanIdentifier);

  if (
    !cleanIdentifier ||
    cleanIdentifier === "null" ||
    cleanIdentifier === "undefined"
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid name_contactid format",
    });
  }

  try {
    // OPTION 1: Simple query first to verify user exists
    const userCheckQuery =
      "SELECT id FROM student WHERE name_contactid = ? LIMIT 1";
    const [userResults] = await db.query(userCheckQuery, [cleanIdentifier]);

    if (userResults.length === 0) {
      console.log("❌ Backend - No user found with this name_contactid");
      return res.status(404).json({
        success: false,
        message: "User not found",
        data: [],
      });
    }

    // OPTION 2: Your original query with improved error handling
    const sql = `
      SELECT DISTINCT 
        s.subjectname, 
        s.coursename AS course, 
        COALESCE(fs2.status, 'Pending') AS status
      FROM subject s
      JOIN faculty_student fs 
        ON s.coursename COLLATE utf8mb4_unicode_ci = fs.course COLLATE utf8mb4_unicode_ci 
        AND fs.nameid = ?
      LEFT JOIN faculty_student fs2 
        ON s.subjectname COLLATE utf8mb4_unicode_ci = fs2.subject COLLATE utf8mb4_unicode_ci 
        AND fs2.nameid = ?
      WHERE s.coursename IS NOT NULL
      AND s.coursename != ''
      ORDER BY s.coursename, s.subjectname
    `;

    console.log("🔍 Backend - Executing SQL with identifier:", cleanIdentifier);
    const [results] = await db.query(sql, [cleanIdentifier, cleanIdentifier]);
    console.log("🔍 Backend - SQL results length:", results.length);

    return res.json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (err) {
    console.error("❌ Backend - Database error:", err);
    return res.status(500).json({
      success: false,
      message: "Database error",
      error: err.message,
    });
  }
};

export const getMarks = async (req, res) => {
  const { name_contactid } = req.query; // Changed from req.user to req.query

  if (!name_contactid) {
    return res.status(400).json({ message: "name_contactid is required" });
  }

  const courseQuery = `SELECT DISTINCT fs.course FROM faculty_student fs WHERE fs.nameid = ?`;
  const marksQuery = `SELECT fs.subject AS subjectname, fs.course, sm.subject AS sm_subject, sm.marks_outoff, DATE_FORMAT(sm.exam_date, '%d-%m-%Y') AS exam_date, sm.marks_obtain
                      FROM faculty_student fs
                      LEFT JOIN student_marks sm ON fs.subject COLLATE utf8mb4_unicode_ci = sm.subject COLLATE utf8mb4_unicode_ci AND sm.nameid = ?
                      WHERE fs.nameid = ?`;
  try {
    const [courseResults] = await db.query(courseQuery, [name_contactid]);
    const [marksResults] = await db.query(marksQuery, [
      name_contactid,
      name_contactid,
    ]);

    const courses = courseResults.map((row) => row.course);
    const subjects = marksResults.map((row) => ({
      subjectname: row.subjectname,
      course: row.course,
      status: row.sm_subject ? "Completed" : "Pending",
      exam_date: row.exam_date || null,
      marks_obtain: row.marks_obtain || null,
      marks_outoff: row.marks_outoff || null,
    }));

    res.json({ courses, subjects });
  } catch (err) {
    console.error("Get marks error:", err);
    return res.status(500).json({ message: "Database error" });
  }
};

export const updateProfile = async (req, res) => {
  const {
    name,
    contact,
    course,
    address,
    branch,
    password,
    status,
    EmailId,
    username,
    id, // Now passed in body instead of req.user
  } = req.body;

  if (!id) {
    return res.status(400).json({ message: "User ID is required" });
  }

  let updateFields = [];
  let updateValues = [];

  if (name) {
    updateFields.push("name = ?");
    updateValues.push(name);
  }
  if (contact) {
    updateFields.push("contact = ?");
    updateValues.push(contact);
  }
  if (username) {
    updateFields.push("username = ?");
    updateValues.push(username);
  }
  if (course) {
    updateFields.push("course = ?");
    updateValues.push(course);
  }
  if (address) {
    updateFields.push("address = ?");
    updateValues.push(address);
  }
  if (branch) {
    updateFields.push("branch = ?");
    updateValues.push(branch);
  }
  if (password) {
    updateFields.push("password = ?");
    updateValues.push(password);
  }
  if (status) {
    updateFields.push("status = ?");
    updateValues.push(status);
  }
  if (EmailId) {
    updateFields.push("EmailId = ?");
    updateValues.push(EmailId);
  }

  if (updateFields.length === 0) {
    return res.status(400).json({ message: "No fields to update" });
  }

  updateValues.push(id);
  const sql = `UPDATE student SET ${updateFields.join(", ")} WHERE id = ?`;

  try {
    await db.query(sql, updateValues);
    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error("Update profile error:", err);
    return res.status(500).json({ message: "Database update failed" });
  }
};
