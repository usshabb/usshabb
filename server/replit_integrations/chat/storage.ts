import { ConversationModel, MessageModel } from "@shared/schema";
import mongoose from "mongoose";

export interface IChatStorage {
  getConversation(id: string): Promise<{ id: string; title: string; createdAt: Date } | undefined>;
  getAllConversations(): Promise<{ id: string; title: string; createdAt: Date }[]>;
  createConversation(title: string): Promise<{ id: string; title: string; createdAt: Date }>;
  deleteConversation(id: string): Promise<void>;
  getMessagesByConversation(conversationId: string): Promise<Array<{ id: string; conversationId: string; role: string; content: string; createdAt: Date }>>;
  createMessage(conversationId: string, role: string, content: string): Promise<{ id: string; conversationId: string; role: string; content: string; createdAt: Date }>;
}

function toConversationResponse(doc: any) {
  return {
    id: doc._id.toString(),
    title: doc.title,
    createdAt: doc.createdAt,
  };
}

function toMessageResponse(doc: any) {
  return {
    id: doc._id.toString(),
    conversationId: doc.conversationId.toString(),
    role: doc.role,
    content: doc.content,
    createdAt: doc.createdAt,
  };
}

export const chatStorage: IChatStorage = {
  async getConversation(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return undefined;
    const conversation = await ConversationModel.findById(id).lean();
    return conversation ? toConversationResponse(conversation) : undefined;
  },

  async getAllConversations() {
    const conversations = await ConversationModel.find()
      .sort({ createdAt: -1 })
      .lean();
    return conversations.map(toConversationResponse);
  },

  async createConversation(title: string) {
    const conversation = await ConversationModel.create({ title });
    return toConversationResponse(conversation);
  },

  async deleteConversation(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return;

    // Cascade delete messages (via middleware)
    const conversation = await ConversationModel.findById(id);
    if (conversation) {
      await conversation.deleteOne(); // Triggers pre-remove hook
    }
  },

  async getMessagesByConversation(conversationId: string) {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) return [];

    const messages = await MessageModel.find({
      conversationId: new mongoose.Types.ObjectId(conversationId)
    })
      .sort({ createdAt: 1 })
      .lean();

    return messages.map(toMessageResponse);
  },

  async createMessage(conversationId: string, role: string, content: string) {
    const message = await MessageModel.create({
      conversationId: new mongoose.Types.ObjectId(conversationId),
      role,
      content
    });
    return toMessageResponse(message);
  },
};
