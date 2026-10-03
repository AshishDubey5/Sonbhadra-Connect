import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

const allowedOrigins = [
    process.env.CORS_ORIGIN,
    "http://localhost:3000",
    "http://10.21.224.108:3000"
];

app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
    })
);


app.use(express.json({
    limit: "16kb"
}))

app.use(express.urlencoded({
    extended: true,
    limit: "16kb"
}))

app.use(express.static("public"))
app.use(cookieParser())

// routes import
import creatorRouter from "./routes/creator.routes.js";
import touristRouter from "./routes/tourist.routes.js";
import destinationRouter from "./routes/destination.routes.js";
import mediaRouter from "./routes/media.routes.js";
import bookingRouter from "./routes/booking.routes.js";
import reviewRouter from "./routes/review.routes.js";
import storyRouter from "./routes/story.routes.js";

// routes declaration
app.use("/api/v1/creators", creatorRouter);
app.use("/api/v1/tourists", touristRouter);
app.use("/api/v1/destinations", destinationRouter);
app.use("/api/v1/media", mediaRouter);
app.use("/api/v1/bookings", bookingRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/stories", storyRouter);

// global error handling middleware
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    return res.status(statusCode).json({
        statusCode,
        data: null,
        message,
        success: false,
        errors: err.errors || [],
    });
});

export { app };
