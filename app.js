import express from 'express';
import dotenv from 'dotenv';
import bookRouter from './routes/bookRouter.js';
import connectDB from './utils/db.js';
import AppError from './utils/appError.js';
import globalErrorHandler from './utils/errorController.js';

// Initialisation
const app = express();
const PORT = process.env.PORT || 3000;
dotenv.config();
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
const server = app.listen(PORT, () => {
    console.log(`Running on port ${PORT}`)
});

// subscribe to unhandled promise rejections in order to create a global way of handling this type of errors across the application.
// This will prevent the Node.js process from terminating.
process.on('unhandledRejection', err => {
    console.log(err.name, err.message);
    // close down server first
    server.close();
});

process.on('uncaughtException', err => {
    console.log(err.name, err.message);
    server.close();
})

// subscribe to the server shutting down event and then shut down the application
server.on('close', () => {
    // we terminate the process because let's say the database can't be connected to then this API won't be useful.
    process.exit(1); //1 stands for uncaught exception and 0 stands for success.
});