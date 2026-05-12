import mongoose, { Schema, Document } from 'mongoose';

export interface IFriendshipDocument extends Document {
  userId: mongoose.Types.ObjectId;
  friendId: mongoose.Types.ObjectId;
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: Date;
  acceptedAt?: Date;
}

const friendshipSchema = new Schema<IFriendshipDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    friendId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'accepted', 'blocked'], default: 'pending', index: true },
    createdAt: { type: Date, default: Date.now },
    acceptedAt: { type: Date },
  },
  { timestamps: true }
);

friendshipSchema.index({ userId: 1, friendId: 1 }, { unique: true });
friendshipSchema.index({ friendId: 1, status: 1 });

export const Friendship = mongoose.model<IFriendshipDocument>('Friendship', friendshipSchema);
