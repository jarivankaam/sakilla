var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var indexRouter = require("./src/routes/index");
var usersRouter = require("./src/routes/users");
var staffRouter = require("./src/routes/staff");
var aboutRouter = require("./src/routes/about");
const { injectUser } = require('./src/middleware/auth');
const authRoutes = require('./src/routes/auth');
const session = require("express-session");
var app = express();

// view engine setup
app.set("views", path.join(__dirname, "src", "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "src", "public")));
const sessionStore = new MySQLStore(
    {
        clearExpired: true,
        checkExpirationInterval: 900000,
        expiration: 1000 * 60 * 60 * 24 * 7,
    },
    {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'sakila',
        password: process.env.DB_PASS || 'sakila',
        database: process.env.DB_NAME || 'sakila',
    }
);

app.use(
    session({
        name: 'sid',
        secret: process.env.SESSION_SECRET || 'dev_secret_change_me',
        resave: false,
        saveUninitialized: false,
        store: sessionStore,
        cookie: {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 1000 * 60 * 60 * 24 * 7,
        },
    })
);

app.use(injectUser);

app.use("/", indexRouter);
app.use("/about", aboutRouter);
app.use("/users", usersRouter);
app.use("/staff", staffRouter);
app.use('/auth', authRoutes);
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
