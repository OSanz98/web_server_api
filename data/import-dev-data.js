/**
 * To run this file use the following command (assuming you are in root folder directory):
 * For importing:
 * node data/import-dev-data.js --import
 * For deleting:
 * node data/import-dev-data.js --delete
 */

import connectDB from "../utils/db.js";
import Book from "../models/bookModel.js";
import {books} from './booksJson.js';
import dotenv from 'dotenv';

// set up env variables
dotenv.config({path: './config.env'});

// connect to database
connectDB();

/**
 * Import development data into database collection books
 */
const importData = async () => {
    try {
        await Book.create(books);
        console.log('Data successfully loaded!');
    } catch(err) {
        console.error(err);
    }
    process.exit();
}

/**
 * Delete development data in data collection books
 */
const deleteData = async () => {
    try {
        await Book.deleteMany();
        console.log('Data successfully deleted!');
    } catch(err) {
        console.error(err);
    }
    process.exit();
}

/**
 * If second argument passed in cmd/terminal is --import then run importData function
 * If second argument passed in cmd/terminal is --delete then run deleteData function
 */
if(process.argv[2] === '--import') {
    importData();
} else if(process.argv[2] === '--delete') {
    deleteData();
}