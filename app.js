const cookieParser = require('cookie-parser');
const express=require('express');
const connect = require('./db/db')
connect()
// const { default: mongoose } = require('mongoose');
const userModel = require('./models/user.model');
const postModel=require('./models/post.model')
const app=express()
const jwt=require('jsonwebtoken')
const bcrypt=require('bcrypt')



app.set('view engine', "ejs")
app.use(express.json());
app.use(express.urlencoded({extended:true}))
app.use(cookieParser())



app.get('/',(req,res)=>{
    res.render('register')
})

app.post('/register',async (req,res)=>{
    const {username,name,age,email,password}=req.body
    const user= await userModel.findOne({email})
    console.log(user);
    
    if(user){
        return res.status(500).send('user already exist')
    }
    bcrypt.genSalt(10,(err,salt)=>{
        bcrypt.hash(password,salt, async (err,hash)=>{
            let user= await userModel.create({
                username,
                email,
                age,
                name,
                password:hash
            })

            let token=jwt.sign({email:email,userID:user._id}, 'sanjana')
            res.cookie('token',token)
            // console.log(lo)
            res.send('user registered')
        })
    })

    // res.send('got the data')

})

app.get('/login',(req,res)=>{
    res.render('login')
})

app.post('/login',async (req,res)=>{
try {
    const {email,password}=req.body
    const user= await userModel.findOne({email})
    if(!user) res.status(500).send('somthing went wrong')

     bcrypt.compare(password,user.password,(err,result)=>{
        if(result){
            
            let token= jwt.sign({email:email,userID:user._id},'sanjana') //making/encoding the token because og the secret key
             
            res.cookie('token',token)
            res.status(200).redirect('/profile');
        }
        else res.redirect('/login')
    })
} catch (error) {
    console.log(error)
}
})
const isloggedin=(req,res,next)=>{
    try{
        if(req.cookies.token==='') res.status(400).send('you must be logged in')
        else {
    const data=jwt.verify(req.cookies.token,'sanjana')//decoding the token because of th secret key
    req.user=data
    console.log(data)
    next()

}} catch(err){
    res.status(401).json({
        message:'invalid token'
    })
}
     //this will decode the data in the token

}

app.get('/profile',isloggedin,async(req,res)=>{
    const {email}=req.user
    const user= await userModel.findOne({email}).populate('posts')
    res.render('post',{user})
})


app.get('/like/:id',isloggedin, async (req,res)=>{
    let post=await postModel.findOne({_id:req.params.id})

    if(post.likes.indexOf(req.user.userID)===-1){
        post.likes.push(req.user.userID)
    }else {
        post.likes.splice(post.likes.indexOf(req.user.userID),1)
    }
    await post.save()
    res.redirect('/profile')

})
app.get('/logout',(req,res)=>{
    res.cookie('token','')
    res.redirect('/login')
})

app.post('/post',isloggedin, async (req,res)=>{
    const {email}=req.user    //getting the data from the middleware, it store data of user in req.user
    let user= await userModel.findOne({email})
    const {content}=req.body   //getting the data from the frontend
     let post =await postModel.create({
        user:user._id,
        content
     })
     user.posts.push(post._id)
     await user.save()
     res.redirect('/profile')


})



app.listen(4000,()=>{
    console.log("i am on listen");
})