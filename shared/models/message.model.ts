import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export interface IMessage extends MongooseDocument {
  _id: mongoose.Types.ObjectId;
  conversationId: mongoose.Types.ObjectId;
  role: string;
  content: string;
  createdAt: Date;
}

const messageSchema = new Schema<IMessage>({
  conversationId: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  role: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
}, {
  timestamps: {
    createdAt: true,
    updatedAt: false
  }
});

export const MessageModel = mongoose.model<IMessage>('Message', messageSchema);
