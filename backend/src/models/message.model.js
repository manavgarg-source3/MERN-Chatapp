import mongoose from "mongoose";

const messageReadSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    readAt: {
      type: Date,
      required: true,
    },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      default: null,
    },
    text: {
      type: String,
    },
    image: {
      type: String,
    },
    attachment: {
      url: {
        type: String,
      },
      openUrl: {
        type: String,
      },
      downloadUrl: {
        type: String,
      },
      kind: {
        type: String,
        enum: ["image", "video", "audio", "document"],
      },
      mimeType: {
        type: String,
      },
      fileName: {
        type: String,
      },
      publicId: {
        type: String,
      },
      resourceType: {
        type: String,
      },
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    readAt: {
      type: Date,
      default: null,
    },
    readBy: {
      type: [messageReadSchema],
      default: [],
    },
    hiddenForUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    deletedForEveryone: {
      type: Boolean,
      default: false,
    },
    deletedForEveryoneAt: {
      type: Date,
      default: null,
    },
    deletedByAdmin: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

messageSchema.index({ senderId: 1, receiverId: 1, createdAt: 1 });
messageSchema.index({ groupId: 1, createdAt: 1 });
messageSchema.index({ groupId: 1, "readBy.userId": 1, createdAt: 1 });
messageSchema.index({ receiverId: 1, deliveredAt: 1 });
messageSchema.index({ receiverId: 1, senderId: 1, readAt: 1 });

const Message = mongoose.model("Message", messageSchema);
export default Message;
