const Meeting = require("../models/meeting");

// Get user's meetings (both as host and participant)
const getUserMeetings = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const meetings = await Meeting.find({
      $or: [
        { host: userId },
        { participants: userId }
      ]
    })
    .populate("host", "username email")
    .populate("participants", "username email")
    .sort({ createdAt: -1 });

    // Separate into scheduled and history
    const now = new Date();
    const scheduled = meetings.filter(m => 
      m.status === "scheduled" && m.scheduledAt && new Date(m.scheduledAt) > now
    );
    const history = meetings.filter(m => 
      m.status === "completed" || m.status === "cancelled" || 
      (m.scheduledAt && new Date(m.scheduledAt) <= now)
    );

    res.json({ scheduled, history });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new meeting
const createMeeting = async (req, res) => {
  try {
    const { title, description, scheduledAt, participants } = req.body;
    
    const meeting = new Meeting({
      title,
      description,
      host: req.user.id,
      participants: participants || [],
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      roomId: `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });

    await meeting.save();
    await meeting.populate("host", "username email");
    await meeting.populate("participants", "username email");

    res.status(201).json(meeting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update meeting (notes, status, etc.)
const updateMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, notes, status, scheduledAt } = req.body;

    const meeting = await Meeting.findById(id);
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    // Only host can update
    if (meeting.host.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (title) meeting.title = title;
    if (description !== undefined) meeting.description = description;
    if (notes !== undefined) meeting.notes = notes;
    if (status) meeting.status = status;
    if (scheduledAt) meeting.scheduledAt = new Date(scheduledAt);

    await meeting.save();
    await meeting.populate("host", "username email");
    await meeting.populate("participants", "username email");

    res.json(meeting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete meeting
const deleteMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    
    const meeting = await Meeting.findById(id);
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    if (meeting.host.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await Meeting.findByIdAndDelete(id);
    res.json({ message: "Meeting deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Start a meeting (update status and startedAt)
const startMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    
    const meeting = await Meeting.findById(id);
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    meeting.status = "ongoing";
    meeting.startedAt = new Date();
    await meeting.save();

    res.json(meeting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// End a meeting
const endMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    
    const meeting = await Meeting.findById(id);
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    meeting.status = "completed";
    meeting.endedAt = new Date();
    if (meeting.startedAt) {
      meeting.duration = Math.round((meeting.endedAt - meeting.startedAt) / 60000);
    }
    await meeting.save();

    res.json(meeting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUserMeetings,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  startMeeting,
  endMeeting,
};
