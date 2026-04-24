import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import Group from "../models/group.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getGroupRoomId, io, isUserViewingConversation, syncUserGroupRooms } from "../lib/socket.js";

const USER_PREVIEW_FIELDS = "fullName email profilePic";

const hasUserId = (users = [], userId) =>
  users.some((value) => value.toString() === userId.toString());

const getAttachmentKind = (mimeType = "", fileName = "") => {
  const normalizedMimeType = mimeType.toLowerCase();
  const normalizedFileName = fileName.toLowerCase();

  if (normalizedMimeType.startsWith("image/")) return "image";
  if (normalizedMimeType.startsWith("video/")) return "video";
  if (normalizedMimeType.startsWith("audio/")) return "audio";

  if (
    normalizedMimeType.includes("pdf") ||
    normalizedMimeType.includes("word") ||
    normalizedMimeType.includes("document") ||
    normalizedMimeType.includes("sheet") ||
    normalizedMimeType.includes("excel") ||
    normalizedMimeType.includes("presentation") ||
    normalizedMimeType.includes("powerpoint") ||
    normalizedMimeType.includes("text")
  ) {
    return "document";
  }

  if (/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar|csv)$/i.test(normalizedFileName)) {
    return "document";
  }

  return "document";
};

const normalizeDataUri = (dataUri = "") => {
  const matches = dataUri.match(/^data:([^,]+),(.*)$/);

  if (!matches) return dataUri;

  const [, meta, data] = matches;
  const metaParts = meta.split(";");
  const mimeType = metaParts[0];
  const normalizedFlags = metaParts.filter(
    (part) => part === "base64" || part.startsWith("charset=")
  );

  return `data:${[mimeType, ...normalizedFlags].join(";")},${data}`;
};

const getCloudinaryResourceType = (attachmentKind) => {
  if (attachmentKind === "audio" || attachmentKind === "video") return "video";
  if (attachmentKind === "document") return "raw";
  return "image";
};

const buildCloudinaryAssetUrl = ({ publicId, resourceType, format, flags }) =>
  cloudinary.url(publicId, {
    resource_type: resourceType || "raw",
    type: "upload",
    secure: true,
    format,
    flags,
  });

const buildAttachmentPayload = async ({ image, attachment }) => {
  let imageUrl;
  let attachmentData = null;

  if (attachment?.data) {
    const attachmentKind = getAttachmentKind(attachment.mimeType, attachment.fileName);
    const normalizedDataUri = normalizeDataUri(attachment.data);
    const uploadResponse = await cloudinary.uploader.upload(normalizedDataUri, {
      resource_type: getCloudinaryResourceType(attachmentKind),
      use_filename: true,
      unique_filename: true,
    });

    const openUrl = buildCloudinaryAssetUrl({
      publicId: uploadResponse.public_id,
      resourceType: uploadResponse.resource_type,
      format: uploadResponse.format,
    });
    const downloadUrl = buildCloudinaryAssetUrl({
      publicId: uploadResponse.public_id,
      resourceType: uploadResponse.resource_type,
      format: uploadResponse.format,
      flags: "attachment",
    });

    attachmentData = {
      url: openUrl,
      openUrl,
      downloadUrl,
      kind: attachmentKind,
      mimeType: attachment.mimeType,
      fileName: attachment.fileName,
      publicId: uploadResponse.public_id,
      resourceType: uploadResponse.resource_type,
    };
    imageUrl = attachmentKind === "image" ? openUrl : undefined;
  } else if (image) {
    const uploadResponse = await cloudinary.uploader.upload(image, {
      resource_type: "auto",
    });
    const openUrl = buildCloudinaryAssetUrl({
      publicId: uploadResponse.public_id,
      resourceType: uploadResponse.resource_type,
      format: uploadResponse.format,
    });
    const downloadUrl = buildCloudinaryAssetUrl({
      publicId: uploadResponse.public_id,
      resourceType: uploadResponse.resource_type,
      format: uploadResponse.format,
      flags: "attachment",
    });

    imageUrl = openUrl;
    attachmentData = {
      url: openUrl,
      openUrl,
      downloadUrl,
      kind: "image",
      mimeType: uploadResponse.resource_type === "image" ? "image/jpeg" : "",
      fileName: "image",
      publicId: uploadResponse.public_id,
      resourceType: uploadResponse.resource_type,
    };
  }

  return { imageUrl, attachmentData };
};

const uploadGroupImage = async (groupImage) => {
  if (!groupImage) return "";

  const normalizedDataUri = normalizeDataUri(groupImage);
  const uploadResponse = await cloudinary.uploader.upload(normalizedDataUri, {
    resource_type: "image",
  });

  return buildCloudinaryAssetUrl({
    publicId: uploadResponse.public_id,
    resourceType: uploadResponse.resource_type,
    format: uploadResponse.format,
  });
};

const serializeGroupMember = (member) => ({
  _id: member._id,
  fullName: member.fullName,
  email: member.email,
  profilePic: member.profilePic,
});

const serializeGroup = (group, currentUserId) => {
  const adminId =
    group.adminId && typeof group.adminId === "object" && group.adminId._id
      ? group.adminId._id.toString()
      : group.adminId?.toString();

  return {
    _id: group._id,
    type: "group",
    name: group.name,
    fullName: group.name,
    profilePic: group.groupPic || "",
    adminId,
    isAdmin: adminId === currentUserId.toString(),
    members: (group.members || []).map(serializeGroupMember),
    memberCount: (group.members || []).length,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
  };
};

const getDirectUnreadCountMap = async (userId) => {
  const unreadCounts = await Message.aggregate([
    {
      $match: {
        receiverId: userId,
        groupId: null,
        readAt: null,
      },
    },
    {
      $group: {
        _id: "$senderId",
        unreadCount: { $sum: 1 },
      },
    },
  ]);

  return unreadCounts.reduce((accumulator, entry) => {
    accumulator[entry._id.toString()] = entry.unreadCount;
    return accumulator;
  }, {});
};

const getGroupUnreadCountMap = async (userId) => {
  const unreadCounts = await Message.aggregate([
    {
      $match: {
        groupId: { $ne: null },
        senderId: { $ne: userId },
        "readBy.userId": { $ne: userId },
      },
    },
    {
      $group: {
        _id: "$groupId",
        unreadCount: { $sum: 1 },
      },
    },
  ]);

  return unreadCounts.reduce((accumulator, entry) => {
    accumulator[entry._id.toString()] = entry.unreadCount;
    return accumulator;
  }, {});
};

const getDirectUnreadCount = async ({ receiverId, senderId }) =>
  Message.countDocuments({
    receiverId,
    senderId,
    groupId: null,
    readAt: null,
  });

const getGroupUnreadCount = async ({ userId, groupId }) =>
  Message.countDocuments({
    groupId,
    senderId: { $ne: userId },
    "readBy.userId": { $ne: userId },
  });

const emitConversationUnreadCountUpdate = ({ userId, chatType, chatId, unreadCount }) => {
  io.to(userId.toString()).emit("conversationUnreadCountUpdated", {
    chatType,
    chatId: chatId.toString(),
    unreadCount,
  });
};

const syncDirectUnreadCountForUser = async ({ receiverId, senderId }) => {
  const unreadCount = await getDirectUnreadCount({ receiverId, senderId });
  emitConversationUnreadCountUpdate({
    userId: receiverId,
    chatType: "direct",
    chatId: senderId,
    unreadCount,
  });
};

const syncGroupUnreadCountForUser = async ({ userId, groupId }) => {
  const unreadCount = await getGroupUnreadCount({ userId, groupId });
  emitConversationUnreadCountUpdate({
    userId,
    chatType: "group",
    chatId: groupId,
    unreadCount,
  });
};

const syncGroupUnreadCountsForUsers = async ({ userIds = [], groupId, excludeUserIds = [] }) => {
  const excludedUsers = new Set(excludeUserIds.map(String));

  await Promise.all(
    [...new Set(userIds.map(String))]
      .filter((userId) => !excludedUsers.has(userId))
      .map((userId) => syncGroupUnreadCountForUser({ userId, groupId }))
  );
};

const populateGroupById = (groupId) =>
  Group.findById(groupId).populate("adminId", USER_PREVIEW_FIELDS).populate("members", USER_PREVIEW_FIELDS);

const emitGroupsUpdated = async (userIds = []) => {
  await Promise.all([...new Set(userIds.map(String))].map((userId) => syncUserGroupRooms(userId)));
  [...new Set(userIds.map(String))].forEach((userId) => {
    io.to(userId).emit("groupsUpdated");
  });
};

const isMessageHiddenForUser = (messageData, userId) =>
  (messageData.hiddenForUsers || []).some(
    (hiddenUserId) => hiddenUserId.toString() === userId.toString()
  );

const serializeDirectMessageForUser = (messageData, userId) => {
  if (messageData.deletedForEveryone) {
    return {
      ...messageData,
      text: "This message was deleted",
      image: null,
      attachment: null,
    };
  }

  if (isMessageHiddenForUser(messageData, userId)) {
    return null;
  }

  return messageData;
};

const markConversationMessagesAsRead = async ({ readerId, senderId }) => {
  const unreadMessages = await Message.find({
    senderId,
    receiverId: readerId,
    groupId: null,
    readAt: null,
  }).select("_id");

  if (unreadMessages.length === 0) return null;

  const readAt = new Date();
  const messageIds = unreadMessages.map((message) => message._id);

  await Message.updateMany({ _id: { $in: messageIds } }, { $set: { readAt } });

  io.to(senderId.toString()).emit("messagesRead", {
    messageIds,
    readerId,
    readAt,
  });

  await syncDirectUnreadCountForUser({ receiverId: readerId, senderId });

  return { messageIds, readAt };
};

const markConversationMessagesAsDelivered = async ({ receiverId, senderId }) => {
  const undeliveredMessages = await Message.find({
    senderId,
    receiverId,
    groupId: null,
    deliveredAt: null,
  }).select("_id");

  if (undeliveredMessages.length === 0) return null;

  const deliveredAt = new Date();
  const messageIds = undeliveredMessages.map((message) => message._id);

  await Message.updateMany({ _id: { $in: messageIds } }, { $set: { deliveredAt } });

  io.to(senderId.toString()).emit("messagesDelivered", {
    messageIds,
    deliveredAt,
  });

  return { messageIds, deliveredAt };
};

const markGroupMessagesAsRead = async ({ groupId, user }) => {
  const unreadMessages = await Message.find({
    groupId,
    senderId: { $ne: user._id },
    "readBy.userId": { $ne: user._id },
  }).select("_id");

  if (!unreadMessages.length) return null;

  const readAt = new Date();
  const messageIds = unreadMessages.map((message) => message._id);

  await Message.updateMany(
    {
      _id: { $in: messageIds },
      "readBy.userId": { $ne: user._id },
    },
    {
      $push: {
        readBy: {
          userId: user._id,
          readAt,
        },
      },
    }
  );

  io.to(getGroupRoomId(groupId)).emit("groupMessagesRead", {
    groupId,
    messageIds,
    user: {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    },
    readAt,
  });

  await syncGroupUnreadCountForUser({ userId: user._id, groupId });

  return { messageIds, readAt };
};

const getVerifiedGroup = async ({ groupId, userId }) => {
  const group = await Group.findById(groupId);

  if (!group) {
    return { status: 404, payload: { message: "Group not found" } };
  }

  if (!hasUserId(group.members, userId)) {
    return { status: 403, payload: { message: "You are not a member of this group" } };
  }

  return { group };
};

const getVerifiedAdminGroup = async ({ groupId, userId }) => {
  const { group, status, payload } = await getVerifiedGroup({ groupId, userId });

  if (!group) {
    return { status, payload };
  }

  if (group.adminId.toString() !== userId.toString()) {
    return { status: 403, payload: { message: "Only the group admin can do this" } };
  }

  return { group };
};

export const getUsersForSidebar = async (req, res) => {
  try {
    const unreadCountMap = await getDirectUnreadCountMap(req.user._id);
    const currentUser = await User.findById(req.user._id)
      .populate("friends", USER_PREVIEW_FIELDS)
      .lean();

    const filteredUsers = (currentUser?.friends || [])
      .sort((firstUser, secondUser) => firstUser.fullName.localeCompare(secondUser.fullName))
      .map((user) => ({
        ...user,
        type: "direct",
        unreadCount: unreadCountMap[user._id.toString()] || 0,
      }));

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getGroups = async (req, res) => {
  try {
    const unreadCountMap = await getGroupUnreadCountMap(req.user._id);
    const groups = await Group.find({ members: req.user._id })
      .populate("adminId", USER_PREVIEW_FIELDS)
      .populate("members", USER_PREVIEW_FIELDS)
      .sort({ updatedAt: -1 });

    res.status(200).json(
      groups
        .map((group) => ({
          ...serializeGroup(group, req.user._id),
          unreadCount: unreadCountMap[group._id.toString()] || 0,
        }))
        .sort((firstGroup, secondGroup) => firstGroup.name.localeCompare(secondGroup.name))
    );
  } catch (error) {
    console.error("Error in getGroups:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getGroupDetails = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const { group, status, payload } = await getVerifiedGroup({
      groupId,
      userId: req.user._id,
    });

    if (!group) {
      return res.status(status).json(payload);
    }

    const populatedGroup = await populateGroupById(groupId);
    res.status(200).json(serializeGroup(populatedGroup, req.user._id));
  } catch (error) {
    console.error("Error in getGroupDetails:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createGroup = async (req, res) => {
  try {
    const creatorId = req.user._id;
    const { name, members = [], groupImage = "" } = req.body;

    const trimmedName = name?.trim();
    if (!trimmedName) {
      return res.status(400).json({ message: "Group name is required" });
    }

    const normalizedMemberIds = [...new Set(members.map((memberId) => memberId.toString()))];
    if (normalizedMemberIds.length === 0) {
      return res.status(400).json({ message: "Select at least one friend for the group" });
    }

    const invalidMemberId = normalizedMemberIds.find(
      (memberId) => !hasUserId(req.user.friends, memberId)
    );

    if (invalidMemberId) {
      return res.status(403).json({ message: "You can only add accepted friends to a group" });
    }

    const groupPic = groupImage ? await uploadGroupImage(groupImage) : "";

    const group = await Group.create({
      name: trimmedName,
      adminId: creatorId,
      members: [creatorId, ...normalizedMemberIds],
      groupPic,
    });

    const populatedGroup = await populateGroupById(group._id);
    const serializedGroup = serializeGroup(populatedGroup, creatorId);

    await emitGroupsUpdated(serializedGroup.members.map((member) => member._id.toString()));

    res.status(201).json(serializedGroup);
  } catch (error) {
    console.error("Error in createGroup:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateGroup = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const { group, status, payload } = await getVerifiedAdminGroup({
      groupId,
      userId: req.user._id,
    });

    if (!group) {
      return res.status(status).json(payload);
    }

    const updates = {};
    if (req.body.name?.trim()) {
      updates.name = req.body.name.trim();
    }
    if (req.body.groupImage) {
      updates.groupPic = await uploadGroupImage(req.body.groupImage);
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({ message: "No changes were provided" });
    }

    const updatedGroup = await Group.findByIdAndUpdate(
      groupId,
      { $set: updates },
      { new: true }
    )
      .populate("adminId", USER_PREVIEW_FIELDS)
      .populate("members", USER_PREVIEW_FIELDS);

    const serializedGroup = serializeGroup(updatedGroup, req.user._id);
    await emitGroupsUpdated(serializedGroup.members.map((member) => member._id.toString()));

    res.status(200).json(serializedGroup);
  } catch (error) {
    console.error("Error in updateGroup:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const addGroupMembers = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const { group, status, payload } = await getVerifiedAdminGroup({
      groupId,
      userId: req.user._id,
    });

    if (!group) {
      return res.status(status).json(payload);
    }

    const memberIds = [...new Set((req.body.members || []).map((memberId) => memberId.toString()))];
    if (!memberIds.length) {
      return res.status(400).json({ message: "Select at least one friend to add" });
    }

    const invalidMemberId = memberIds.find((memberId) => !hasUserId(req.user.friends, memberId));
    if (invalidMemberId) {
      return res.status(403).json({ message: "You can only add accepted friends to a group" });
    }

    const existingMemberIds = new Set(group.members.map((memberId) => memberId.toString()));
    const newMemberIds = memberIds.filter((memberId) => !existingMemberIds.has(memberId));

    if (!newMemberIds.length) {
      return res.status(400).json({ message: "Those friends are already in the group" });
    }

    const updatedGroup = await Group.findByIdAndUpdate(
      groupId,
      { $addToSet: { members: { $each: newMemberIds } } },
      { new: true }
    )
      .populate("adminId", USER_PREVIEW_FIELDS)
      .populate("members", USER_PREVIEW_FIELDS);

    const serializedGroup = serializeGroup(updatedGroup, req.user._id);
    await emitGroupsUpdated(serializedGroup.members.map((member) => member._id.toString()));

    res.status(200).json(serializedGroup);
  } catch (error) {
    console.error("Error in addGroupMembers:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const removeGroupMember = async (req, res) => {
  try {
    const { id: groupId, memberId } = req.params;
    const { group, status, payload } = await getVerifiedAdminGroup({
      groupId,
      userId: req.user._id,
    });

    if (!group) {
      return res.status(status).json(payload);
    }

    if (!hasUserId(group.members, memberId)) {
      return res.status(404).json({ message: "That member is not in the group" });
    }

    if (group.adminId.toString() === memberId.toString()) {
      return res.status(400).json({ message: "The admin cannot be removed from the group" });
    }

    const previousMemberIds = group.members.map((groupMemberId) => groupMemberId.toString());
    const updatedGroup = await Group.findByIdAndUpdate(
      groupId,
      { $pull: { members: memberId } },
      { new: true }
    )
      .populate("adminId", USER_PREVIEW_FIELDS)
      .populate("members", USER_PREVIEW_FIELDS);

    const serializedGroup = serializeGroup(updatedGroup, req.user._id);
    await emitGroupsUpdated([...previousMemberIds, memberId.toString()]);

    res.status(200).json(serializedGroup);
  } catch (error) {
    console.error("Error in removeGroupMember:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getDirectMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    if (!hasUserId(req.user.friends, userToChatId)) {
      return res.status(403).json({ error: "You can only chat with accepted friends" });
    }

    const messages = await Message.find({
      groupId: null,
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    }).sort({ createdAt: 1 });

    const deliveredResult = await markConversationMessagesAsDelivered({
      receiverId: myId,
      senderId: userToChatId,
    });
    await markConversationMessagesAsRead({
      readerId: myId,
      senderId: userToChatId,
    });

    const deliveredMessageIds = new Set(
      deliveredResult?.messageIds.map((messageId) => messageId.toString()) || []
    );

    res.status(200).json(
      messages
        .map((message) => {
          const messageData = deliveredMessageIds.has(message._id.toString())
            ? { ...message.toObject(), deliveredAt: deliveredResult.deliveredAt }
            : message.toObject();

          return serializeDirectMessageForUser(messageData, myId);
        })
        .filter(Boolean)
    );
  } catch (error) {
    console.log("Error in getDirectMessages controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getGroupMessages = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const { group, status, payload } = await getVerifiedGroup({
      groupId,
      userId: req.user._id,
    });

    if (!group) {
      return res.status(status).json(payload);
    }

    await markGroupMessagesAsRead({ groupId, user: req.user });

    const messages = await Message.find({ groupId })
      .populate("senderId", USER_PREVIEW_FIELDS)
      .populate("readBy.userId", USER_PREVIEW_FIELDS)
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getGroupMessages controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const markMessagesAsRead = async (req, res) => {
  try {
    const { id: senderId } = req.params;
    const readerId = req.user._id;

    if (!hasUserId(req.user.friends, senderId)) {
      return res.status(403).json({ error: "You can only read messages from accepted friends" });
    }

    const result = await markConversationMessagesAsRead({ readerId, senderId });

    res.status(200).json({
      messageIds: result?.messageIds || [],
      readAt: result?.readAt || null,
    });
  } catch (error) {
    console.log("Error in markMessagesAsRead controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const markGroupMessagesAsReadController = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const { group, status, payload } = await getVerifiedGroup({
      groupId,
      userId: req.user._id,
    });

    if (!group) {
      return res.status(status).json(payload);
    }

    const result = await markGroupMessagesAsRead({ groupId, user: req.user });

    res.status(200).json({
      messageIds: result?.messageIds || [],
      readAt: result?.readAt || null,
    });
  } catch (error) {
    console.log("Error in markGroupMessagesAsRead controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const sendDirectMessage = async (req, res) => {
  try {
    const { text, image, attachment } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if (!hasUserId(req.user.friends, receiverId)) {
      return res.status(403).json({ error: "You can only send messages to accepted friends" });
    }

    const { imageUrl, attachmentData } = await buildAttachmentPayload({ image, attachment });

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      attachment: attachmentData,
    });

    await newMessage.save();

    io.to(receiverId.toString()).emit("newMessage", newMessage);

    if (isUserViewingConversation(receiverId.toString(), senderId.toString())) {
      const readResult = await markConversationMessagesAsRead({
        readerId: receiverId,
        senderId,
      });

      if (readResult) {
        newMessage.readAt = readResult.readAt;
        newMessage.deliveredAt = readResult.readAt;
      }
    } else {
      await syncDirectUnreadCountForUser({ receiverId, senderId });
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendDirectMessage controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteDirectMessageForMe = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const currentUserId = req.user._id;

    const message = await Message.findById(messageId);

    if (!message || message.groupId) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.senderId.toString() !== currentUserId.toString()) {
      return res.status(403).json({ message: "You can only delete your own sent messages" });
    }

    if (message.deletedForEveryone) {
      return res.status(400).json({ message: "This message was already deleted for everyone" });
    }

    await Message.findByIdAndUpdate(messageId, {
      $addToSet: { hiddenForUsers: currentUserId },
    });

    res.status(200).json({ messageId });
  } catch (error) {
    console.log("Error in deleteDirectMessageForMe controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteDirectMessageForEveryone = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const currentUserId = req.user._id;

    const message = await Message.findById(messageId);

    if (!message || message.groupId) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.senderId.toString() !== currentUserId.toString()) {
      return res.status(403).json({ message: "You can only delete your own sent messages" });
    }

    if (message.readAt) {
      return res.status(400).json({ message: "This message has been seen and cannot be deleted for both sides" });
    }

    const deletedAt = new Date();

    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      {
        $set: {
          deletedForEveryone: true,
          deletedForEveryoneAt: deletedAt,
          text: "This message was deleted",
          image: null,
          attachment: null,
        },
      },
      { new: true }
    );

    io.to(message.receiverId.toString()).emit("messageDeletedForEveryone", {
      messageId,
      deletedAt,
    });

    await syncDirectUnreadCountForUser({
      receiverId: message.receiverId,
      senderId: currentUserId,
    });

    res.status(200).json(updatedMessage);
  } catch (error) {
    console.log("Error in deleteDirectMessageForEveryone controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteGroupMessageForEveryone = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const currentUserId = req.user._id;

    const message = await Message.findById(messageId);

    if (!message || !message.groupId) {
      return res.status(404).json({ message: "Message not found" });
    }

    const { group, status, payload } = await getVerifiedGroup({
      groupId: message.groupId,
      userId: currentUserId,
    });

    if (!group) {
      return res.status(status).json(payload);
    }

    if (message.senderId.toString() !== currentUserId.toString()) {
      return res.status(403).json({ message: "You can only delete your own group messages" });
    }

    if (message.deletedForEveryone) {
      return res.status(400).json({ message: "This message was already deleted" });
    }

    const deletedAt = new Date();

    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      {
        $set: {
          deletedForEveryone: true,
          deletedForEveryoneAt: deletedAt,
          deletedByAdmin: false,
          text: "This message was deleted",
          image: null,
          attachment: null,
        },
      },
      { new: true }
    )
      .populate("senderId", USER_PREVIEW_FIELDS)
      .populate("readBy.userId", USER_PREVIEW_FIELDS);

    io.to(getGroupRoomId(message.groupId.toString())).emit("groupMessageDeleted", updatedMessage);
    await syncGroupUnreadCountsForUsers({
      userIds: group.members,
      groupId: message.groupId,
      excludeUserIds: [],
    });

    res.status(200).json(updatedMessage);
  } catch (error) {
    console.log("Error in deleteGroupMessageForEveryone controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const adminDeleteGroupMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const currentUserId = req.user._id;

    const message = await Message.findById(messageId);

    if (!message || !message.groupId) {
      return res.status(404).json({ message: "Message not found" });
    }

    const { group, status, payload } = await getVerifiedAdminGroup({
      groupId: message.groupId,
      userId: currentUserId,
    });

    if (!group) {
      return res.status(status).json(payload);
    }

    if (message.deletedForEveryone) {
      return res.status(400).json({ message: "This message was already deleted" });
    }

    const deletedAt = new Date();

    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      {
        $set: {
          deletedForEveryone: true,
          deletedForEveryoneAt: deletedAt,
          deletedByAdmin: true,
          text: "This message was deleted by admin",
          image: null,
          attachment: null,
        },
      },
      { new: true }
    )
      .populate("senderId", USER_PREVIEW_FIELDS)
      .populate("readBy.userId", USER_PREVIEW_FIELDS);

    io.to(getGroupRoomId(message.groupId.toString())).emit("groupMessageDeleted", updatedMessage);
    await syncGroupUnreadCountsForUsers({
      userIds: group.members,
      groupId: message.groupId,
      excludeUserIds: [],
    });

    res.status(200).json(updatedMessage);
  } catch (error) {
    console.log("Error in adminDeleteGroupMessage controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    const { text, image, attachment } = req.body;
    const { id: groupId } = req.params;
    const { group, status, payload } = await getVerifiedGroup({
      groupId,
      userId: req.user._id,
    });

    if (!group) {
      return res.status(status).json(payload);
    }

    const { imageUrl, attachmentData } = await buildAttachmentPayload({ image, attachment });

    const newMessage = await Message.create({
      senderId: req.user._id,
      groupId,
      text,
      image: imageUrl,
      attachment: attachmentData,
      readBy: [
        {
          userId: req.user._id,
          readAt: new Date(),
        },
      ],
    });

    await Group.findByIdAndUpdate(groupId, { $set: { updatedAt: new Date() } });

    const populatedMessage = await Message.findById(newMessage._id)
      .populate("senderId", USER_PREVIEW_FIELDS)
      .populate("readBy.userId", USER_PREVIEW_FIELDS);

    io.to(getGroupRoomId(groupId))
      .except(req.user._id.toString())
      .emit("newGroupMessage", populatedMessage);

    await syncGroupUnreadCountsForUsers({
      userIds: group.members,
      groupId,
      excludeUserIds: [req.user._id],
    });

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.log("Error in sendGroupMessage controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
