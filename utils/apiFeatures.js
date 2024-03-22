/**
 * APIFeature is a class that has common api functionality, that can be used with
 * other models.
 */
class APIFeature {

    /**
     * Sets the instance's query and queryString
     * @param {Mongoose Query} query 
     * @param {Query String} queryString 
     */
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    filter() {
        //Build query - sorting the query out first before 'awaiting' it, allows us to do things like sort, pagination etc.
        // 1A) Filtering
        //added queryObj to allow users to filter by specific field values if passed with request, otherwise it would do default find.
        const queryObj = {...this.queryString} //stores query passed (if any) into dict object

        //example of how to not let user perform numerical operations on documents on keywords page, sort, limit and fields
        //exclude numerical operations gte, gt, lt, lte from being operated on following request parameters
        const excludedFields = ['page', 'limit', 'fields', 'sort']; 
        excludedFields.forEach(el => delete queryObj[el])
        
        // 1B) Advanced filtering - allowing users to filter with operations such as greater than (gte) 
        // NOTE this is only really beneficial for models that have a numerical data type for a field.
        let queryStr = JSON.stringify(queryObj);
        // \b in regular expression requires exact match to word/letters specified within '()'
        // g operator in regular expression replaces all occurences of those words
        // gte, gt, lte and lt are operations that mongoose understands to filter models
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
        this.query = this.query.find(JSON.parse(queryStr)); //returns query object instead of documents
        // above equivalent to: let query = Book.find(JSON.parse(queryStr))
        return this;
    }

    sort() {
        // 2) Sorting
        // putting a '-' infront of a sort field column makes it sort in descending order
        if(this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy)
            //mongoose funciton to sort - based of two fields: sort('title read')
        } else {
            // below is an example for cases where you want to provide a default sort
            this.query = this.query.sort('-createdAt')
        }
        return this;
    }

    limit() {
        // 3) Field limiting -- helps to improve performance of API so users don't have to get field from documents
        if(this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields);
        } else {
            // putting a - infront of a field name tells mongoose to exclude it from the response
            this.query = this.query.select('-__v')
        }
        return this;
    }

    paginate() {
        // 4) Pagination and Limit (set max number of items per page)
        // the limit operation sets how many items there are per page - so if you want page to and the limit is 10, you need to skip the first 10 items
        // multiply by 1 to convert number in query string to number
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 100;
        const skip = (page - 1) * limit //we do - 1 to get the previous page value (based on current page)
        this.query = this.query.skip(skip).limit(limit)
        // if(this.queryString.page) {
        //     const numBooks = await Book.countDocuments();
        //     // throwing error will skip to catch error block
        //     if(skip >= numBooks) throw new Error("Page provided doesn't exist.")
        // }

        return this;
    }
}

export default APIFeature;