import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * ShareToken — public-readable token for sharing a playthrough snapshot.
 *
 * Created on POST /api/v1/playthroughs/:id/share. The token is a
 * 32-byte URL-safe random string (43 chars). The public read endpoint
 * /api/v1/share/:token returns the snapshot without authentication.
 *
 * 30-day expiry enforced by expiresAt. Rate limit 10 views per IP per
 * hour is enforced at the route level (not in this model).
 */

export interface IShareTokenDocument extends Document {
  _id: Types.ObjectId;
  token: string;
  playthroughId: Types.ObjectId;
  userId: Types.ObjectId;
  expiresAt: Date;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ShareTokenSchema = new Schema<IShareTokenDocument>(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    playthroughId: {
      type: Schema.Types.ObjectId,
      ref: 'Playthrough',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index — Mongo will auto-delete expired docs
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true },
);

ShareTokenSchema.index({ token: 1, expiresAt: 1 });

export const ShareToken: Model<IShareTokenDocument> =
  (mongoose.models.ShareToken as Model<IShareTokenDocument>) ||
  mongoose.model<IShareTokenDocument>('ShareToken', ShareTokenSchema);
