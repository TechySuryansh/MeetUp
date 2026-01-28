const express = require("express");
const router = express.Router();
const protect = require("../middleware/middleware");
const {
  getUserMeetings,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  startMeeting,
  endMeeting,
} = require("../controllers/meetingController");

// All routes require authentication
router.use(protect);

router.get("/", getUserMeetings);
router.post("/", createMeeting);
router.put("/:id", updateMeeting);
router.delete("/:id", deleteMeeting);
router.post("/:id/start", startMeeting);
router.post("/:id/end", endMeeting);

module.exports = router;
