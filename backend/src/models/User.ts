import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUserDocument extends Document {
  username: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  comparePassword(candidate: string): Promise<boolean>;
  toPublicJSON(): { id: string; username: string; email: string; createdAt: Date; updatedAt: Date };
}

const UserSchema = new Schema<IUserDocument>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Pre-save: hash password
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Soft delete: auto-filter non-deleted documents
UserSchema.pre(['find', 'findOne', 'findOneAndUpdate', 'countDocuments'], function () {
  const filter = this.getFilter() as Record<string, unknown>;
  if (!('deletedAt' in filter)) {
    this.setQuery({ ...filter, deletedAt: null });
  }
});

// Instance method: compare password
UserSchema.methods.comparePassword = async function (
  candidate: string
): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

// Instance method: return safe public representation
UserSchema.methods.toPublicJSON = function () {
  return {
    id: String(this._id),
    username: this.username,
    email: this.email,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const User = mongoose.model<IUserDocument>('User', UserSchema);
