import express from 'express';
import dotenv from 'dotenv';
import bookRouter from './routes/bookRouter.js';
import connectDB from './config/db.js';

// Initialisation
const app = express();
const PORT = process.env.PORT || 3000;
dotenv.config({path: './config.env'});
app.use(express.json()) //allow clients to pass data in request bodies.

// Connect to database
connectDB();

// Routes
app.use('/api', bookRouter);

app.get('/', (req, res) => {
    res.send('Welcome to nodemon api')
});

//set listening port
app.listen(PORT, () => {
    console.log(`Running on port ${PORT}`)
});