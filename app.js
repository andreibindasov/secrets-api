import express from "express"
import "dotenv/config"
import mongoose from 'mongoose'

// ENCRYPTION & HASHING packages
import encrypt from 'mongoose-encryption'

// 1 --- SESSIONS
import session from 'express-session'
// 2 --- PASSPORT
import passport from 'passport'
// 3 --- PASSPORT LOCAL MONGOOSE
import passportLocalMongoose from 'passport-local-mongoose'

const app = express()
const port =  process.env.PORT

app.use(express.static("public"))
app.use(express.urlencoded({extended:true}))

app.set('view engine', 'ejs')

// 4 --- PLACE SESSION RIGHT HERE!!! before connecting with DB
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))

// 5 -- initializing PASSPORT
app.use(passport.initialize())
app.use(passport.session())

try{
    run_db()
} catch(err){
    console.log(err)
}

function run_db () {
    mongoose.connect(process.env.MONGO_URI)
    console.log('connected!')
}

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String
})

// const secret = process.env.SECRET
// userSchema.plugin(encrypt, {secret: secret, encryptedFields: ['password']})

// 6 --- add passport plugin
userSchema.plugin(passportLocalMongoose)

const User = mongoose.model('users', userSchema)

// 7 --- passport use and serialize
passport.use(User.createStrategy())
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

app.get("/", (req, res)=>{
    res.render("home")
})

app.get("/login", (req, res)=>{
    res.render("login")
})

app.get("/register", (req, res)=>{
    res.render("register")
})

app.get("/secrets", (req, res)=>{
    if (req.isAuthenticated()){
        res.render("secrets")
    } else {
        res.redirect("/login")
    }
})

app.get("/logout", (req, res, next) => {
    req.logout((err)=>{
        if (err) {return next(err)}
        res.redirect("/")
    })
})

app.post("/register", (req, res)=>{
    
    User.register({username: req.body.username}, req.body.password, (err, user)=>{
        if (err) {
            console.log(err)
            res.redirect("/register")
        } else {
            passport.authenticate("local")(req, res, ()=>{
                res.redirect("/secrets")
            })
        }
    })
    
})

app.post("/login", (req, res)=>{
    const user = new User({
        username: req.body.username,
        password: req.body.password
    })
    req.login(user, (err)=>{
        if (err) {
            console.log(err)
        } else {
            passport.authenticate("local")(req, res, ()=>{
                res.redirect("/secrets")
            })
        }
    })
})

app.listen(port, ()=>{
    console.log("app is on...")
})
