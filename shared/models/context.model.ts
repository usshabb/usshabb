import mongoose, { Schema, Document as MongooseDocument } from "mongoose";

export interface IContext extends MongooseDocument {
  _id: mongoose.Types.ObjectId;
  contextData: string;
  updatedAt: Date;
}

const contextSchema = new Schema<IContext>(
  {
    contextData: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const ContextModel = mongoose.model<IContext>("Context", contextSchema);
