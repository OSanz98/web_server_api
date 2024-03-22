// import { Request, Response } from 'express';
import Book from '../models/bookModel.js';
import APIFeature from '../utils/apiFeatures.js';

/**
 * This is a middleware function which is called when user routes to latest-5-books.
 * It creates the query/params for retrieveBooks, and then executes that http get function with
 * those specified params.
 * It also only requests for title, author and genre for each document.
 * @param {Request} req 
 * @param {Response} res 
 * @param {NextRequest} next 
 */
const aliasLatestBooks = async(req, res, next) => {
    req.query.limit = 5;
    req.query.sort = '-createdAt';
    req.query.fields = 'title,author,genre';
    next();
}

const retrieveBooks = async(req, res) => {
    try {
        //Execute query - create and use query object with specific mongoose operation passed
        const features = new APIFeature(Book.find(), req.query)
        .filter()
        .sort()
        .limit()
        .paginate();
        const documents = await features.query; 
        
        //Send Response with documents
        res.status(200).json({
            status: 'success',
            data: { documents }
        });

    } catch(err) {
        res.status(400).json({
            status: 'failure',
            message: err.message
        })
    }
}

const createBook = async(req, res) => {
    try {
        const newBook = await Book.create(req.body);
        res.status(201).json({
            status: 'success',
            data: { newBook }
        })
    }catch(err) {
        res.status(400).json({
            status: 'failure',
            message: 'Invalid data sent!'
        })
    }
};


const findBookById = async(req, res) => {
    try {
        const bookId = req.params.id;
        const retrievedBook = await Book.findById(bookId);

        res.status(200).json({
            status: "sucesss",
            data: { retrievedBook }
        })
    }catch(err) {
        res.status(400).json({
            status: 'failure',
            message: 'Invalid data sent!'
        })
    }
}

const updateBook = async(req,res) => {
    try {
        const updatedBook = await Book.findByIdAndUpdate(req.params.id, req.body, {
            new: true, //by default findByIdAndUpdate returns object before the update, setting new to true returns the object after the update
            runValidators: true //if true, the validators validate the update operation against the model's schema.
        })

        res.status(200).json({
            status: 'success',
            data: {
                updatedBook
            }
        })
    } catch(err){
        res.status(404).json({
            status: 'failure',
            message: err
        })
    }
}

const deleteBook = async(req, res) => {
    try {
        await Book.findByIdAndDelete(req.params.id);
        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch(err) {
        res.status(404).json({
            status: 'failure',
            message: err
        });
    }
};

/**
 * In this function we create an aggregation of operations, like there would be in a
 * pipeline - formatting data till we get the result wanted.
 * The MongoDB Aggregation Pipeline API is based on the concept of data processing pipelines.
 * Documents enter a multi-stage pipeline that transforms the documents into an aggregated result.
 * @param {Request} req 
 * @param {Response} res 
 */
const getBookStats = async (req, res) => {
    try {
        // passing an array will perform the operations step by step
        // if we didn't put await it would return the pipeline query and not the result.
        const stats = await Book.aggregate([
            //aggregation operation match allows you to filter for certain documents - like filter
            // here we grab documents where the price of the book is greater than or equal to 4.5
            {
                $match: { price: { $gte: 4.5 } }
            },
            {
                // group allows us to accumulate results
                $group: {
                    // if you set _id to null then it will group all documents under the same grouping.
                    _id: '$genre', //_id allows you to specify what you want to group by
                    numBooks: { $sum: 1 }, //adds 1 for every book matched on
                    avgPrice: {
                        $avg: '$price'
                    },
                    minPrice: {
                        $min: '$price'
                    },
                    maxPrice: {
                        $max: '$price'
                    }
                }
            }, 
            {
                $sort: {
                    avgPrice: 1 //1 for ascending -1 for descending
                }
            },
            // {
            //     $match: {
            //         _id: {
            //             $ne: 'Biography' //removes category/grouping with label Biography $ne stands for not equal
            //         }
            //     }
            // }
        ]);
        res.status(200).json({
            status: 'success',
            data: stats
        });

    } catch(err) {
        res.status(404).json({
            status: 'failure',
            message: err.message
        });
    }
}




export { retrieveBooks, createBook, findBookById, updateBook, deleteBook, aliasLatestBooks, getBookStats };