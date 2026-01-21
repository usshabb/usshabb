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

// Pre-remove hook to cascade delete all FolderItems
folderSchema.pre('deleteOne', { document: true, query: false }, async function() {
  const FolderItemModel = mongoose.model('FolderItem');
  const items = await FolderItemModel.find({ folderId: this._id });

  // Delete each item individually to trigger their pre-remove hooks
  for (const item of items) {
    await item.deleteOne();
  }
});

export const FolderModel = mongoose.model<IFolder>('Folder', folderSchema);
