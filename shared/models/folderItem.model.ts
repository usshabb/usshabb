import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';
import { deleteFromImageKit } from '../../server/imagekit';

export interface IFolderItem extends MongooseDocument {
  _id: mongoose.Types.ObjectId;
  folderId: mongoose.Types.ObjectId;
  type: 'file' | 'bookmark' | 'note';
  name: string;
  x: number;
  y: number;

  // File fields (type='file')
  fileUrl: string | null;
  fileId: string | null;
  originalName: string | null;
  mimeType: string | null;
  fileSize: number | null;

  // Bookmark fields (type='bookmark')
  url: string | null;
  faviconUrl: string | null;

  // Note fields (type='note')
  content: string | null;

  createdAt: Date;
  updatedAt: Date;
}

const folderItemSchema = new Schema<IFolderItem>({
  folderId: {
    type: Schema.Types.ObjectId,
    ref: 'Folder',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['file', 'bookmark', 'note'],
    required: true
  },
  name: {
    type: String,
    required: true
  },
  x: {
    type: Number,
    default: 0
  },
  y: {
    type: Number,
    default: 0
  },
  // File fields
  fileUrl: {
    type: String,
    default: null
  },
  fileId: {
    type: String,
    default: null
  },
  originalName: {
    type: String,
    default: null
  },
  mimeType: {
    type: String,
    default: null
  },
  fileSize: {
    type: Number,
    default: null
  },
  // Bookmark fields
  url: {
    type: String,
    default: null
  },
  faviconUrl: {
    type: String,
    default: null
  },
  // Note fields
  content: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Pre-remove hook to delete ImageKit files
folderItemSchema.pre('deleteOne', { document: true, query: false }, async function() {
  if (this.type === 'file' && this.fileId) {
    try {
      await deleteFromImageKit(this.fileId);
    } catch (error) {
      console.error(`Failed to delete file from ImageKit: ${this.fileId}`, error);
    }
  }
});

export const FolderItemModel = mongoose.model<IFolderItem>('FolderItem', folderItemSchema);
