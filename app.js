import express from "express"
import "dotenv/config"
import mongoose from 'mongoose'

// ENCRYPTION & HASHING packages
import encrypt from 'mongoose-encryption'
// import md5 from 'md5'
// import sha3_512 from 'js-sha3'
import sha512 from 'js-sha512'
// ...



const app = express()
const port =  process.env.PORT

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String
})

const secret = process.env.SECRET
userSchema.plugin(encrypt, {secret: secret, encryptedFields: ['password']})

const User = mongoose.model('users', userSchema)


try{
    run_db()
} catch(err){
    console.log(err)
}

async function run_db () {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('connected!')
}


app.use(express.static("public"))
app.use(express.urlencoded({extended:true}))

app.set('view engine', 'ejs')

app.get("/", (req, res)=>{
    res.render("home")
})

app.get("/login", (req, res)=>{
    res.render("login")
})

app.get("/register", (req, res)=>{
    res.render("register")
})

app.post("/register", async (req, res)=>{
    const newUser = new User({
        name: sha512(req.body.uname),
        email: sha512(req.body.username),
        password: req.body.password
    })

    try{
        await newUser.save()
        res.render("secrets")
        console.log("new user created")
    } catch (err){
        console.log(err)
    }
})

app.post("/login", async (req, res)=>{
    const username = sha512(req.body.username)
    const password = req.body.password

    const user = await User.findOne({email: username})
    

    if (user){
        if (user.password === password) {
            res.render("secrets")
        } else {
            console.log("wrong password")
        }
    } else {
        console.log("no such user!")
        res.redirect("/")
    }   
})

app.listen(port, ()=>{
    console.log("app is on...")
})

