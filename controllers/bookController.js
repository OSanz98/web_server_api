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

/**
 * retrieveBooks is a function used to handle any GET HTTP requests made to url /api/books.
 * It retrieves all books and applies a series of filtering and sorting operations depending
 * on parameters passed in url.
 * @param {Request} req 
 * @param {Response} res 
 */
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


/**
 * createBook is a function to handle POST HTTP requests made by client server. 
 * It creates a new book using details passed in the http body request.
 * @param {Request} req 
 * @param {Response} res 
 */
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


/**
 * findBookById is a function that handles the GET HTTP request for /api/books/<book_id>.
 * It attempts to find a book stored in the database with the given book id.
 * If found returns response with book object, otherwise returns a response of invalid book id.
 * @param {Request} req 
 * @param {Response} res 
 */
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


/**
 * updateBook is a function for PATCH HTTP requests.
 * It allows the user to update a book object stored in the database with given details
 * passed in the request body.
 * @param {Request} req 
 * @param {Response} res 
 */
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

/**
 * deleteBook is a function that handles DELETE HTTP requests made by client.
 * It allows users to delete a book object from the database, with a given id.
 * @param {Request} req 
 * @param {Response} res 
 */
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
};


const getMonthlyStats = async (req, res) => {
    try {
        const year = req.params.year * 1; //transform param to number e.g. 2021
        const plan = await Book.aggregate([
            // if bookTourDates/booksSold is an array then leave as so, otherwise convert to single item array
            {
                $project: {
                    title: 1,
                    author: 1,
                    price: 1,
                    bookTourDates: {
                        $cond: {
                            if: { $isArray: '$bookTourDates'},
                            then: '$bookTourDates',
                            else: ['$bookTourDates']
                        }
                    },
                    booksSold: {
                        $cond: {
                            if: { $isArray: '$booksSold'},
                            then: '$booksSold',
                            else: ['$booksSold']
                        }
                    },
                }
            },
            // zip/combine each index in bookTourDates to the same index in booksSold
            {
                $project: {
                    title: 1,
                    author: 1,
                    price: 1,
                    tourDatesAndSales: {
                        $zip: {
                            inputs: ['$bookTourDates', '$booksSold']
                        }
                    }
                }
            },
            //flatten custom field array tourDatesAndSales
            {
                $unwind: {
                    path: '$tourDatesAndSales',
                }
            },
            // extracts date from tourDateAndSales and sets to own field column
            // same for booksSold value in tourDateAndSales, setting to own field column
            // both objects are converted to Date objects for further manipulation.
            {
                $project: {
                    title: 1,
                    author: 1, 
                    price: 1,
                    tourDate: {
                        $convert: {
                            input: {
                                $arrayElemAt: ['$tourDatesAndSales', 0]
                            },
                            to: 'date'
                        }
                    },
                    noOfBooksSold: {
                        $arrayElemAt: ['$tourDatesAndSales', 1]
                    }
                }
            },
            // get all documents where the tourDate is within a specified year
            {
                $match: {
                    tourDate: {
                        $gte: new Date(`${year}-01-01T00:00:00.000Z`),
                        $lte: new Date(`${year}-12-31T23:59:59.999Z`)
                    }
                }
            },
            // group documents by tour month, and get a sum of all books sold
            {
                $group: {
                    _id: {
                        $month: '$tourDate'
                    },
                    numOfTours: { $sum: 1 },
                    numOfBooksSold: { $sum: '$noOfBooksSold' },
                    tours: {
                        $push: '$title'
                    }
                }
            },
            // add custom field month to show the month of the tours
            {
                $addFields: {
                    month: '$_id'
                }
            }, 
            // hide column _id
            {
                $project: {
                    _id: 0,
                }
            },
            //sort documents by number of tours in a month in descending order (so most amount of tours in a month at the top)
            {
                $sort: {
                    numOfTours: -1 
                }
            },
            //allow us to effectively get a maximum of 12 months of data for specified year (limits response output to 12 objects) 
            {
                $limit: 12 
            }
        ]);

        res.status(200).json({
            status: 'success',
            data: plan
        });
    } catch(err) {
        res.status(404).json({
            status: 'fail',
            message: err.message
        });
    }
}




export { retrieveBooks, createBook, findBookById, updateBook, deleteBook, aliasLatestBooks, getBookStats, getMonthlyStats };