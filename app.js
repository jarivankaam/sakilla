// app.js
var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const session = require("express-session");

var indexRouter = require("./src/routes/index");
var usersRouter = require("./src/routes/users");
var staffRouter = require("./src/routes/staff");
var aboutRouter = require("./src/routes/about");
const { injectUser } = require("./src/middleware/auth");

// Let op: dit bestand moet je router exporteren.
// Als jouw bestand 'auth.routes.js' heet, require dan precies dat pad.
const authRoutes = require("./src/routes/auth"); // <— wijzig hier indien nodig

var app = express();

// View engine
app.set("views", path.join(__dirname, "src", "views"));
app.set("view engine", "jade"); // of 'pug' als je .pug gebruikt

// Parsers & static
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "src", "public")));

// Sessions (MemoryStore)
app.set("trust proxy", 1); // belangrijk achter Azure proxy voor secure cookies
app.use(
    session({
        name: "sid",
        secret: process.env.SESSION_SECRET || "dev_secret_change_me",
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: 1000 * 60 * 60 * 24 * 7, // 7 dagen
        },
    })
);

// currentUser naar views
app.use(injectUser);

// Routes — mount ALTIJD vóór 404:
app.use("/auth", authRoutes);         // <— Belangrijk: niet op /login
app.get("/login", (req, res) => res.redirect(302, "/auth/login")); // optionele alias

app.use("/", indexRouter);
app.use("/about", aboutRouter);
app.use("/users", usersRouter);
app.use("/staff", staffRouter);

// 404
app.use(function (req, res, next) {
    next(createError(404));
});

// Error handler
app.use(function (err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};
    res.status(err.status || 500);
    res.render("error"); // zorg dat views/error.jade bestaat
});

module.exports = app;
