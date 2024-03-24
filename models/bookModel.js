import mongoose, {Schema} from "mongoose";
import slugify from 'slugify';
import validator from 'validator';

const genreValues = ['Biography', 'History', 'Fantasy', 'Science Fiction', 'Fiction', 'Historical Fiction']

/**
 * Data Validations/Validators ensures that all data is of the correct format, and for 
 * scenarios where data is required, then it checks to see if data has been given for it.
 * 
 * Data Sanitisation ensures that the data is clean - no malicious code being entered/stored in
 * the database.
 * Golden standard for backend development - never accept user input to store into database as it is - always sanitise data.
*/

/**
 * Create Mongoose Collection Schema for Books
 */
const bookModel = new Schema({
    title: { 
        type: String, 
        unique: true,
        required: [true, 'A book title have a name'], //required is a builtin data validator
        trim: true, //removes trailing whitespace
        maxlength: [40, 'A book title must be less than or equal to 40 characters'], //validtor maxLength - first param is max string length, second param is the error returned if not valid
        minLength: [10, 'A book title must be greater than or equal to 10 characters'], //validator minLength
        // validate: [validator.isAlpha, 'A book title must only contain characters'] //function from library validator - checks that the user has input only letters.
    },
    author: { 
        type: String,
        required: [true, 'A book must have an author'],
        trim: true
    },
    genre: { 
        type: String,
        required: [true, 'A book must have a genre'],
        trim: true,
        enum: {
            values: genreValues,
            message: `Genre must be one of the following: ${genreValues.join(', ')}`
        } // enum is only for strings
    },
    read: { type: Boolean, default: false },
    price: {
        type: Number,
        required: [true, 'A book must have a price'],
        min:[0.01, 'The price of a book must be greater than or equal to 1 penny']
    },
    discountedPrice: {
        type: Number,
        validate: {
            //custom function which checks that the discountedPrice should be lower than normal price.
            validator: function(val) {
                // this keyword only works when creating a document, we won't be able to access document data with it on an update request
                return val < this.price;
            },
            message: 'Discount price ({VALUE}) should be below the regular price.' //here ({VALUE}) is only available through mongoose, it's not a JavaScript construct
        }
    },
    createdAt: {
        type: Date,
        default: Date.now(),
        // select: false //this tells mongoose that users can't ever see it in response from API
    },
    bookTourDates: {
        type: Schema.Types.Mixed
    },
    secretTours: {
        type: Boolean,
        default: false
    },
    booksSold: {
        type: Schema.Types.Mixed
    },
    slug: String
}, {
    // following params needed to use virtual properties
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

/**
 * virtual properties allow us to specify a field to not be stored persistently in the database
 * example to use virtual property would be if you have kilometers and miles, there isn't a need
 * to store both, we can just store one and convert to the other when needed.
 * Note: any virtual property can't be queried on e.g., in a Book.find() as the property
 * isn't part of teh database.
 * Using virtual properties is a good way to improve the architecture of the API, as it 
 * removes the extra step to create calculations/operations in controllers.
 * The virtual property function totalMoneyEarnt calculates the total amount of money earned
 * over all bookTours, using booksSold and price properties.
 */
bookModel.virtual('totalMoneyEarnt').get(function() {
    let totalBooksSold = 0
    totalBooksSold += Array.isArray(this.booksSold) ? 
        this.booksSold.reduce((prevVal, currVal) => prevVal + currVal, 0) :
        this.booksSold
    return this.price * totalBooksSold;
});

/**
 * DOCUMENT MIDDLEWARE: runs before .save() and .create() command (not before .insertMany() or insertOne())
 * this is a middleware function which runs before a document is saved to the database.
 * This function creates a slug based of the book title (converted to lowercase)
 */
bookModel.pre('save', function(next) {
   this.slug = slugify(this.title, { lower: true });
   next(); //calls next middleware in the stack
});

// NOTE: These middleware function are also known as hooks.
// bookModel.pre('save', function(next) {
//     console.log('Will save document...')
//     next();
// });

// this middleware/hook runs after the creation/save event
// bookModel.post('save', function(doc, next) {
//     console.log(doc);
//     next();
// })

/**
 * QUERY MIDDLEWARE: Allows us to run a function before or after a specific query.
 * The following hook runs only before a find() query and not queries like findById().
 * Use case: to hide information from public when database is queried, such as sensitive info
 * or say you have VIP guests, then only them should be able to see that info.
 */
// bookModel.pre('find', function(next) {
    /**
     * You can chain queries onto other queries made in API.
     * This adds extra query to find queries, where we only
     * allow clients to grab documents where there aren't any secret tours.
    */
//     this.find({ secretTours: { $ne: true }}); 
//     next();
// });

/**
 * Function below will trigger anytime we carry out any kind of query like find, findOne, findMany etc.
 * This is due to the regular expression used in the first param of pre() func.
 */
bookModel.pre(/^find/, function(next) {
    this.find({ secretTours: { $ne: true }});
    this.start = Date.now();
    next();
});

bookModel.post(/^find/, function(docs, next) {
    console.log(`Query took ${Date.now() - this.start} milliseconds!`);
    next();
});

/**
 * AGGREGATION MIDDLEWARE: allows us to hide/show data and or perform operations before or after aggregation pipelines.
 * This function adds an aggregate query property before other aggregate pipelines are executed.
 */
bookModel.pre('aggregate', function(next){
    // unshift() adds elements at the start of an array
    this.pipeline().unshift({ $match: {
        secretTours: {
            $ne: true
        }
    }});
    next();
});


// Model Book Collection
const Book = mongoose.model('Book', bookModel);
export default Book;