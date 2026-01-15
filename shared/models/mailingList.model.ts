import mongoose, { Schema, Document as MongooseDocument } from "mongoose";

export interface IMailingList extends MongooseDocument {
  _id: mongoose.Types.ObjectId;
  name: string;
  emails: string[];
  createdAt: Date;
}

const MailingListSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  emails: { type: [String], required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IMailingList>("MailingList", MailingListSchema);
