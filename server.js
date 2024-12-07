const express = require("express");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const { error } = require("console");
require("dotenv").config();

const app = express();


app.use(bodyParser.json());
app.use(cors());


mongoose.connect(process.env.MONGODB_URL,{
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000, // 30 seconds
  socketTimeoutMS: 45000,          // 45 seconds
})
.then(()=>{
    console.log("db Connected");
})
.catch((error)=>{
    console.log("not connected")
})


const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
});

const User = mongoose.model("User", userSchema);


const transporter = nodemailer.createTransport({
  service: "gmail", 
  auth: {
    user: "shubhamdataman66@gmail.com",
    pass: "siir txhg axmy yahj"
  },
});
app.post("/api/v1/create",async(req,res)=>{
    const {email,password}= req.body;
    try {
        const response = await User.create({email,password});
        res.status(200).json({
             success:true,
             data:response,
             message:"User created succesfuly"
        })
    } catch (error) {
        res.status(501).json({
            success:false,
        
            message:error.message
       })
    }
})


app.post("/api/v1/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: "User not found." });
    }

 
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 3600000; 
    await user.save();

    const resetLink = `http://localhost:3000/reset-password/${resetToken}`;
    const mailOptions = {
      from: "shubhamdataman66@gmail.com",
      to: email,
      subject: "Password Reset Request",
      text: `You requested a password reset. Please click the link below to reset your password:\n\n${resetLink}`,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      message: "Password reset link sent to your email!",
    });
  } catch (error) {
    console.error("Error in forgot-password route:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});


app.post("/api/v1/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  console.log(newPassword)
  try {
    const user = await User.findOne({ resetPasswordToken: token });

    if (!user || Date.now() > user.resetPasswordExpire) {
      return res.status(400).json({ success: false, message: "Invalid or expired token." });
    }


    user.password = bcrypt.hashSync(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully!",
    });
  } catch (error) {
    console.error("Error in reset-password route:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});


const PORT = process.env.PORT1;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

app.get("/",(req,res)=>{
    res.send("backend chal rha hai")
})
