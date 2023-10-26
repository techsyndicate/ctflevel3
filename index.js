const userSchema = require('./schemas/userSchema');

require('dotenv').config()

const express = require('express'),
    app = express(),
    mongoose = require('mongoose'),
    session = require("cookie-session"),
    bodyParser = require('body-parser'),
    ejs = require('ejs'),
    jwt = require('jsonwebtoken'),
    cookieParser = require('cookie-parser'),
    url = require('url');

const port = process.env.PORT || 9000;

app.use(bodyParser.json({
    parameterLimit: 100000,
    limit: '50mb'
}));

app.use(bodyParser.urlencoded({
    parameterLimit: 100000,
    limit: '50mb',
    extended: true
}));

app.set('view engine', 'ejs');
app.use(cookieParser());

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.get('/login', (req, res) => {
    res.render('login');
})

app.post('/register', async (req, res) => {
    try {
        var user = userSchema({
            email: req.body.email,
            password: req.body.password,
        });
        await user.save()
        res.redirect('/login/');
    } catch (err) {
        res.send(err.toString());
    }
});
function UserSerialise(user) {
    //Creating jwt token
    return token = jwt.sign(
        { email: user.email },
        process.env.SECRET,
        { expiresIn: "10h" }
    );
}

app.post('/login', async (req, res) => {
    console.log(req.body)
    var User = await userSchema.findOne({ email: req.body.email });
    if (!User) {
        return res.send("User not found");
    }
    if (User.password != req.body.password) {
        return res.send("Wrong password");
    }

    const token = UserSerialise(User);
    res.status(200).cookie("ctflevel3", token, {
        maxAge: 1000 * 60 * 60 * 24 * 7
    }).json({
        success: true,
        msg: "User logged in",
        data: {
            token: token
        }
    });
});

app.get('/flag', forceDeserialise, async (req, res) => {
    if (req.user.email == "admin@admin.admin") {
        res.send(process.env.FLAG);
    } else {
        res.send("You are not admin");
    }
})


mongoose.set("strictQuery", false)

mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("Connected to Mongo DB")
})
app.listen(port, () => {
    console.log(`TS Encryptid listening at http://localhost:${port}`)
});


function forceDeserialise(req, res, next) {
    console.log(req.cookies)
    let token;
    if (req?.headers?.authorization?.split(" ")[0] === "Bearer") {
        token = req?.headers?.authorization?.split(" ")[1];
    } else if (req?.cookies?.['ctflevel3']) {
        token = req?.cookies?.['ctflevel3'];
    } else {
        return res.send({ success: false, msg: "No cookie found" });
    }
    if (token.at(-1) == ',') {
        token = token.slice(0, -1);
    }
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, process.env.SECRET);
    } catch (err) {
        console.log(err);
        return res.send({ success: false, msg: "Err in decoding" });
    }
    if (!decodedToken) {
        return res.send({ success: false, msg: "no token in cookie" });
    }

    userSchema.findOne({email:decodedToken.email}).then(user => {
        req.user = user;
        console.log(user);
        return next();
    }).catch(err => {
        console.log(err);
        return res.send({ success: false, msg: "User not authenticated" });
    });

}