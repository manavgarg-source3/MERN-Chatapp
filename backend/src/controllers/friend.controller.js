import User from "../models/user.model.js";
import { io } from "../lib/socket.js";

const USER_PREVIEW_FIELDS = "fullName email profilePic";

const hasUserId = (users = [], userId) =>
  users.some((value) => value.toString() === userId.toString());

export const getFriendOverview = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id)
      .populate("incomingFriendRequests", USER_PREVIEW_FIELDS)
      .populate("outgoingFriendRequests", USER_PREVIEW_FIELDS);

    const excludedUserIds = [
      req.user._id.toString(),
      ...(currentUser.friends || []).map((id) => id.toString()),
      ...currentUser.incomingFriendRequests.map((user) => user._id.toString()),
      ...currentUser.outgoingFriendRequests.map((user) => user._id.toString()),
    ];

    const availableUsers = await User.find({
      _id: { $nin: excludedUserIds },
    })
      .select(USER_PREVIEW_FIELDS)
      .sort({ fullName: 1 });

    res.status(200).json({
      availableUsers,
      incomingRequests: currentUser.incomingFriendRequests,
      outgoingRequests: currentUser.outgoingFriendRequests,
    });
  } catch (error) {
    console.log("Error in getFriendOverview controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const sendFriendRequest = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { id: receiverId } = req.params;

    if (senderId.toString() === receiverId) {
      return res.status(400).json({ message: "You cannot send a request to yourself" });
    }

    const [sender, receiver] = await Promise.all([
      User.findById(senderId),
      User.findById(receiverId),
    ]);

    if (!receiver) {
      return res.status(404).json({ message: "User not found" });
    }

    if (hasUserId(sender.friends, receiverId)) {
      return res.status(400).json({ message: "You are already friends" });
    }

    if (hasUserId(sender.outgoingFriendRequests, receiverId)) {
      return res.status(400).json({ message: "Friend request already sent" });
    }

    if (hasUserId(sender.incomingFriendRequests, receiverId)) {
      return res.status(400).json({ message: "This user already sent you a request" });
    }

    await Promise.all([
      User.findByIdAndUpdate(senderId, {
        $addToSet: { outgoingFriendRequests: receiverId },
      }),
      User.findByIdAndUpdate(receiverId, {
        $addToSet: { incomingFriendRequests: senderId },
      }),
    ]);

    io.to(senderId.toString()).emit("friendsUpdated");
    io.to(receiverId.toString()).emit("friendsUpdated");

    res.status(200).json({ message: "Friend request sent" });
  } catch (error) {
    console.log("Error in sendFriendRequest controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const acceptFriendRequest = async (req, res) => {
  try {
    const receiverId = req.user._id;
    const { id: senderId } = req.params;

    const [receiver, sender] = await Promise.all([
      User.findById(receiverId),
      User.findById(senderId),
    ]);

    if (!sender) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!hasUserId(receiver.incomingFriendRequests, senderId)) {
      return res.status(400).json({ message: "No friend request to accept" });
    }

    await Promise.all([
      User.findByIdAndUpdate(receiverId, {
        $pull: { incomingFriendRequests: senderId },
        $addToSet: { friends: senderId },
      }),
      User.findByIdAndUpdate(senderId, {
        $pull: { outgoingFriendRequests: receiverId },
        $addToSet: { friends: receiverId },
      }),
    ]);

    io.to(senderId.toString()).emit("friendsUpdated");
    io.to(receiverId.toString()).emit("friendsUpdated");

    res.status(200).json({ message: "Friend request accepted" });
  } catch (error) {
    console.log("Error in acceptFriendRequest controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const rejectFriendRequest = async (req, res) => {
  try {
    const receiverId = req.user._id;
    const { id: senderId } = req.params;

    const sender = await User.findById(senderId);

    if (!sender) {
      return res.status(404).json({ message: "User not found" });
    }

    await Promise.all([
      User.findByIdAndUpdate(receiverId, {
        $pull: { incomingFriendRequests: senderId },
      }),
      User.findByIdAndUpdate(senderId, {
        $pull: { outgoingFriendRequests: receiverId },
      }),
    ]);

    io.to(senderId.toString()).emit("friendsUpdated");
    io.to(receiverId.toString()).emit("friendsUpdated");

    res.status(200).json({ message: "Friend request rejected" });
  } catch (error) {
    console.log("Error in rejectFriendRequest controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
