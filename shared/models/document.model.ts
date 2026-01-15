import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export interface IDocument extends MongooseDocument {
  _id: mongoose.Types.ObjectId;
  name: string;
  originalName: string;
  content: string;
  fileUrl: string | null;
  fileId: string | null;
  createdAt: Date;
}

const documentSchema = new Schema<IDocument>({
  name: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    default: null
  },
  fileId: {
    type: String,
    default: null
  },
}, {
  timestamps: {
    createdAt: true,
    updatedAt: false
  }
});

// Pre-remove hook to cascade delete doc_messages
documentSchema.pre('deleteOne', { document: true, query: false }, async function() {
  const DocMessageModel = mongoose.model('DocMessage');
  await DocMessageModel.deleteMany({ documentId: this._id });
});

export const DocumentModel = mongoose.model<IDocument>('Document', documentSchema);
