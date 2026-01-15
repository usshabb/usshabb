import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export interface IFolder extends MongooseDocument {
  _id: mongoose.Types.ObjectId;
  name: string;
  x: number;
  y: number;
}

const folderSchema = new Schema<IFolder>({
  name: {
    type: String,
    required: true,
    unique: true
  },
  x: {
    type: Number,
    default: 0
  },
  y: {
    type: Number,
    default: 0
  },
}, {
  timestamps: false
});

export const FolderModel = mongoose.model<IFolder>('Folder', folderSchema);
