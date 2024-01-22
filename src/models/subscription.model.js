import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
  {
    subscriber: {
      // user who will subscribed :: jawad
        type: Schema.Types.ObjectId,
        ref: "User",
      }, // {jawad}
    channel: {
      // user::channel to which the user subscribe :: chai aur code
          type: Schema.Types.ObjectId,
          ref: "User",
        }, //chai aur code
  },
  {
    timestamps: true,
  }
);

export const Subscription= mongoose.model("Subscription",subscriptionSchema);



