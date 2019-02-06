const express=require('express')
const router=express.Router()
const gravatar=require('gravatar')
const bcrypt=require('bcryptjs')
const jwt=require('jsonwebtoken')
const passport=require('passport')
// load input value
const validateRegisterInput=require('../../validation/register')
const validateLoginInput=require('../../validation/login')
 //load user modul
const User=require('../../moduls/User')
const keys=require('../../config/keys')
//@route get api/userss/test
//@discription tests users route
//@access public
router.get('/test',(req,res)=> res.json({msg : 'users works'}))
//@route get api/userss/register
//@discription register user
//@access public
router.post('/register',(req,res)=>{
    const {errors,isValid}=validateRegisterInput(req.body)
    if(!isValid){
         return res.status(400).json(errors)
    }
    User.findOne({email : req.body.email})
    .then(user=>{
        if(user){
            return res.status(400).json({email:"eamil already exists"})
        }
        else{
            const avatar=gravatar.url(req.body.email,{
                s:'200' ,//size
                r:"pg", // rating
                d:'mm' //default picture
            })
            const newUser=new User({
                name:req.body.name,
                email:req.body.email,
                avatar,
                password:req.body.password
            })
            bcrypt.genSalt(10,(err,salt)=>{
                bcrypt.hash(newUser.password,salt,(err,hash)=>{
                    if(err) throw err
                    newUser.password=hash
                    newUser
                        .save()
                        .then(user=> res.json(user))
                        .catch(err=>console.log(err))
                })
            })
        }
    })
})
//@route get api/users/login
//@discription login  user/returning jwt token
//@access public
router.post('/login',(req,res)=>{
    const {errors,isValid}=validateLoginInput(req.body)
    if(!isValid){
         return res.status(400).json(errors)
    }
    const email=req.body.email
    const password=req.body.password
    User.findOne({email}).then(user=>{
        if(!user){
            errors.email='user not found'
            return res.status(404).json(errors)
        }

        bcrypt.compare(password,user.password).then(isMatch=>{
            if(isMatch){
                const payload={id:user.id,name:user.name,avatar:user.avatar} //create jwt payload
                //sign token
                jwt.sign(
                    payload,
                    keys.secretOrKey,
                    {expiresIn:3600},
                    (err,token)=>{
                        res.json({
                            success:true,
                            token: 'Bearer '+token
                        })
                    }
                )
            }else{
                errors.password='password incorrect'
                return res.status(400).json(errors)
            }
        })
    })
})
//@route get api/userss/current
//@discription return current user
//@access private

router.get('/current',
    passport.authenticate('jwt',{session:false}),
    (req,res)=>{
        res.json({
            id:req.user.id,
            name:req.user.name,
            email:req.user.email
        })
    }
)
module.exports=router