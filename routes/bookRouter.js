import express from 'express';
import { retrieveBooks, createBook, findBookById, updateBook, deleteBook, aliasLatestBooks, getBookStats } from '../controllers/bookController.js';

const bookRouter = express.Router();

bookRouter.get('/books', retrieveBooks) //RETRIEVE ALL BOOKS
bookRouter.post('/books', createBook); //CREATE BOOK

bookRouter.get('/books/:id', findBookById); //RETRIEVE BOOK
bookRouter.patch('/books/:id', updateBook); //UPDATE BOOK
bookRouter.delete('/books/:id', deleteBook); //DELETE BOOK

// it executes the middleware function aliasLatestBooks and then retrieves books
bookRouter.get('/latest-5-books', aliasLatestBooks, retrieveBooks); //RETRIEVE 5 LATEST BOOKS

bookRouter.get('/book-stats', getBookStats); //RETRIEVE BOOK STATS

export default bookRouter;