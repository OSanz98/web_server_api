import express from 'express';
import dotenv from 'dotenv';
import bookRouter from './routes/bookRouter.js';
import connectDB from './utils/db.js';
import AppError from './utils/appError.js';
import globalErrorHandler from './utils/errorController.js';

// Initialisation
const app = express();
const PORT = process.env.PORT || 3000;
dotenv.config({path: './config.env'});
app.use(express.json()) //allow clients to pass data in request bodies.

// Connect to database
connectDB();

// Routes
app.use('/api', bookRouter);
// handle all routes which doesn't exist for the API - returning 404 error message.
app.all('*', (req, res, next) => {
    //if we pass an error into the next function, express will automatically know to next execute the next error handling middleware set here (note: can have multiple error handling middlewares).
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404)); 
});

// specifying 4 parameters tells express that this is an error handling middleware
app.use(globalErrorHandler);

//set listening port
app.listen(PORT, () => {
    console.log(`Running on port ${PORT}`)
});