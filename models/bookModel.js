import mongoose, {Schema} from "mongoose";

/**
 * Create Mongoose Collection Schema for Books
 */
const bookModel = new Schema({
    title: { 
        type: String, 
        unique: true,
        required: [true, 'A book must have a name'],
        trim: true //removes trailing whitespace
    },
    author: { 
        type: String,
        required: [true, 'A book must have an author'],
        trim: true
    },
    genre: { 
        type: String,
        required: [true, 'A book must have a genre'],
        trim: true
    },
    read: { type: Boolean, default: false },
    price: {
        type: Number,
        required: [true, 'A book must have a price']
    },
    createdAt: {
        type: Date,
        default: Date.now(),
        // select: false //this tells mongoose that users can't ever see it in response from API
    },
    bookTourDates: {
        type: Schema.Types.Mixed
    },
    booksSold: {
        type: Schema.Types.Mixed
    },
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
})

// Model Book Collection
const Book = mongoose.model('Book', bookModel);
export default Book;