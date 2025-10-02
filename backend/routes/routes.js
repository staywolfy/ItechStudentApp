import express from "express";
import {
  login,
  getAttendance,
  //   authenticateJWT,
  logout,
  getBatchTimings,
  getBatch,
  getFeeDetails,
  updateProfile,
  getBatchTimetable,
  getCourse,
  getMarks,
} from "../controllers/student.Controllers.js";

const router = express.Router();

router.post("/login", login);
router.get("/attendance", getAttendance);
router.get("/batch-timings", getBatchTimings);
router.get("/get-batch", getBatch);
router.get("/get-timings", getBatchTimetable);
router.get("/get-marks", getMarks);
router.post("/logout", logout);
router.get("/fee-details", getFeeDetails);
router.get("/course-details", getCourse);
router.post("/update-profile", updateProfile);

export default router;
