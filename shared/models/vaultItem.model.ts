import { Schema, model, Document } from "mongoose";

export interface IVaultItem extends Document {
  id: string;
  name: string; // Name or website
  type: "password" | "apikey" | "value"; // Type of credential
  username?: string | null; // For password type
  password?: string | null; // For password type
  apiKey?: string | null; // For API key type
  value?: string | null; // For generic value type
  createdAt: Date;
  updatedAt: Date;
}

const vaultItemSchema = new Schema<IVaultItem>(
  {
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["password", "apikey", "value"],
      required: true,
    },
    username: {
      type: String,
      default: null,
    },
    password: {
      type: String,
      default: null,
    },
    apiKey: {
      type: String,
      default: null,
    },
    value: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const VaultItemModel = model<IVaultItem>("VaultItem", vaultItemSchema);
