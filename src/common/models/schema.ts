import mongoose from "mongoose";



// Schemas
const userSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  name: { type: String },
  profileImageUrl: { type: String },
}, { timestamps: true });


const anonymousUserSchema = new mongoose.Schema({
  ipAddr: { type: String, required: true, index: true },
  queryCount: { type: Number, default: 0, index: true },
  firstQueryAt: { type: Date, default: Date.now },
  lastQueryAt: { type: Date, default: Date.now },
}, { timestamps: true });


const conversationSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Client Generated ID (automatically indexed and unique)
  userId: { type: String, ref: 'User' }, // Clerk ID
  ipAddr: { type: String, ref: 'AnonymousUser' }, // For anonymous users
  conversationTitle: { type: String, default: 'New Chat', index: true },
  messageCount: { type: Number, default: 0 },
  lastActiveAt: { type: Date, default: Date.now },
  messageId: [{ type: mongoose.Types.ObjectId, ref: 'Message' }],
}, { timestamps: true });


const fileAttachmentSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  fileSize: { type: Number, required: true },
  cloudinaryUrl: { type: String, required: true },
  mimeType: { type: String, required: true },
}, { id: false });


const promptSchema = new mongoose.Schema({
  conversationId: { type: String, ref: 'Conversation', required: true, index: true },
  previousPromptId: { type: mongoose.Types.ObjectId, ref: 'Prompt', default: null },
  promptText: { type: String, required: true },
  fileAttachments: [fileAttachmentSchema],
}, { timestamps: true });


const aiResponseVersionSchema = new mongoose.Schema({
  responseText: { type: String, required: true },
  aiModel: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });


const aiResponseSchema = new mongoose.Schema({
  promptId: { type: mongoose.Types.ObjectId, ref: 'Prompt' },
  versions: [aiResponseVersionSchema],
  feedback: { type: String, enum: ['GOOD', 'BAD', 'NEUTRAL'], default: 'NEUTRAL' },
}, { timestamps: true });


const messageSchema = new mongoose.Schema({
  conversationId: { type: String, ref: 'Conversation' },
  userId: { type: String, ref: 'User' },
  ipAddr: { type: String, ref: 'AnonymousUser' },
  promptId: [{ type: mongoose.Types.ObjectId, ref: 'Prompt' }],
  aiResponseId: [{ type: mongoose.Types.ObjectId, ref: 'AiResponse' }],
  messageOrder: { type: Number, required: true, index: true, default: 0 },
});



// Indexes
userSchema.index({ createdAt: -1 });
anonymousUserSchema.index({ firstQueryAt: 1, queryCount: 1 });
conversationSchema.index({ lastActiveAt: -1 });
conversationSchema.index({ userId: 1, lastActiveAt: -1 });
conversationSchema.index({ ipAddr: 1, lastActiveAt: -1 });
conversationSchema.index({ conversationTitle: 'text', userId: 1 });
messageSchema.index({ messageOrder: 1, promptId: 1 });
messageSchema.index({ conversationId: 1, messageOrder: 1 });
promptSchema.index({ promptVersion: 1 });
promptSchema.index({ previousPromptId: 1 });
aiResponseSchema.index({ 'versions.createdAt': -1 });



// Schema Types
export type UserType = mongoose.InferSchemaType<typeof userSchema> & { _id: string };
export type AnonymousUserType = mongoose.InferSchemaType<typeof anonymousUserSchema> & { _id: mongoose.Types.ObjectId };
export type ConversationType = mongoose.InferSchemaType<typeof conversationSchema> & { _id: string; createdAt: Date; updatedAt: Date; };
export type FileAttachmentType = mongoose.InferSchemaType<typeof fileAttachmentSchema>;
export type PromptType = mongoose.InferSchemaType<typeof promptSchema> & { _id: mongoose.Types.ObjectId };
export type AiResponseType = mongoose.InferSchemaType<typeof aiResponseSchema> & { _id: mongoose.Types.ObjectId };
export type AiResponseVersionType = mongoose.InferSchemaType<typeof aiResponseVersionSchema>;
export type MessageType = mongoose.InferSchemaType<typeof messageSchema> & { _id: mongoose.Types.ObjectId };


// Exports Schemas
export const User = mongoose.models.User || mongoose.model<UserType>('User', userSchema);
export const AnonymousUser = mongoose.models.AnonymousUser || mongoose.model<AnonymousUserType>('AnonymousUser', anonymousUserSchema);
export const Conversation = mongoose.models.Conversation || mongoose.model<ConversationType>('Conversation', conversationSchema);
export const FileAttachment = mongoose.models.FileAttachment || mongoose.model<FileAttachmentType>('FileAttachment', fileAttachmentSchema);
export const Prompt = mongoose.models.Prompt || mongoose.model<PromptType>('Prompt', promptSchema);
export const AiResponse = mongoose.models.AiResponse || mongoose.model<AiResponseType>('AiResponse', aiResponseSchema);
export const Message = mongoose.models.Message || mongoose.model<MessageType>('Message', messageSchema);
