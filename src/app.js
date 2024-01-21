import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

//ROUTES
import userRouter from  "./routes/user.routes.js";
import subsbscriptionRouter from "./routes/subscription.route.js";
import videoRouter from "./routes/video.route.js";

// routes decalaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/subscription", subsbscriptionRouter);
app.use("/api/v1/videos", videoRouter)

export { app };

// http://localhost:8000/api/v1/users/
