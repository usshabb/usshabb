import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export interface IConversation extends MongooseDocument {
  _id: mongoose.Types.ObjectId;
  title: string;
  createdAt: Date;
}

const conversationSchema = new Schema<IConversation>({
  title: {
    type: String,
    required: true
  },
}, {
  timestamps: {
    createdAt: true,
    updatedAt: false
  }
});

// Pre-remove hook to cascade delete messages
conversationSchema.pre('deleteOne', { document: true, query: false }, async function() {
  const MessageModel = mongoose.model('Message');
  await MessageModel.deleteMany({ conversationId: this._id });
});

export const ConversationModel = mongoose.model<IConversation>('Conversation', conversationSchema);
