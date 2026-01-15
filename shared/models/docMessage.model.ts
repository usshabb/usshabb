import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export interface IDocMessage extends MongooseDocument {
  _id: mongoose.Types.ObjectId;
  documentId: mongoose.Types.ObjectId | null;
  role: string;
  content: string;
  referencedDocs: string[] | null;
  createdAt: Date;
}

const docMessageSchema = new Schema<IDocMessage>({
  documentId: {
    type: Schema.Types.ObjectId,
    ref: 'Document',
    default: null
  },
  role: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  referencedDocs: {
    type: [String],
    default: null
  },
}, {
  timestamps: {
    createdAt: true,
    updatedAt: false
  }
});

export const DocMessageModel = mongoose.model<IDocMessage>('DocMessage', docMessageSchema);
