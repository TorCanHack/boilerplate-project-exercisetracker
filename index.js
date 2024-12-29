const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require("body-parser")
require('dotenv').config()
const mongoose = require("mongoose")
mongoose.connect(process.env.MONGO_URI, { useNewUrlparser: true, useUnifiedTopology: true })
app.use(bodyParser.urlencoded({ extended: false}))
app.use(bodyParser.json())
app.use(cors())
app.use(express.static('public'))

const Schema = mongoose.Schema

userSchema = new Schema ({
  username: { type: String, required: true},
  
})

let User = mongoose.model("User", userSchema);

exerciseSchema = new Schema ({
 
  username: { type: String, required: true},
  description:  { type: String, required: true},
  duration:  { type: String, required: true},
  date:  { type: String, required: true},
 
})

const Exercise = mongoose.model('Exercise', exerciseSchema);

mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB');
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post("/api/users", async (req, res) => {
  try {
    const user = new User({
      username: req.body.username
    });
    const savedUser = await user.save();
    res.json({
      username: savedUser.username,
      _id: savedUser._id
    })
  } catch (error) {
    res.status(400).json({error: error.message })
  }
})

app.post("/api/users/:_id/exercises", async (req, res) => {
  try {
    const user = await User.findById(req.params._id);
    if(!user) {
      return res.status(404).json({error: "User not found"})
    }

    const exercise = new Exercise({
      username: user.username,
      description: req.body.description,
      duration: Number(req.body.duration),
      date: req.body.date ? new Date(req.body.date).toDateString() : new Date().toDateString()
      

    })

    const savedExercise = await exercise.save();

    res.json({
      username: user.username,
      _id: user._id,
      ...{
        description: savedExercise.description,
        duration: savedExercise.duration,
        date: savedExercise.date

      }
      
      
    })
  } catch (error) {
    res.status(400).json({error: error.message})
  }
})

app.get("/api/users/:_id/logs", async (req, res) => {
  try {
    const user = await User.findById(req.params._id);

    if(!user) {
      res.status(404).json({error: "Invalid user"})
    }

    let query = { username: user.username};

    if (req.query.from || req.query.to) {
      query.date = {};

      if (req.query.from){
        query.date.$gte = new Date(req.query.from).toDateString();
      }
      if (req.query.from) {
        query.date.$lte = new Date(req.query.to).toDateString();
      }
    }

    let exercises = await Exercise.find(query)
      .limit(Number(req.query.limit) || 0)
      .select("description duration date -_id");

    res.json({
      username: user.username,
      count: execise.length,
      _id: user.id,
      log: exercises.map(exercise => ({
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date
      }))

    })


  } catch(error) {
    res.status(404).json({error: error.message})
  }
})

app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find({}).select("username _id");
    res.json(users);

  } catch(error) {
    res.status(500).json({error: error.message})
  }
})



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
