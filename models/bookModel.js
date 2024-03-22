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
});

// Model Book Collection
const Book = mongoose.model('Book', bookModel);
export default Book;