// Simple errors that fit with HTTP response codes

class RESTError {
    constructor() {
        this.code = 500;
        this.message = 'Unspecified error';
    }
}

module.exports = {
    InternalError: class extends RESTError {
        constructor(code = 500, message = 'The server suffered an internal error') {
            super();
            this.code = code;
            this.message = message;
        }
    },
    ClientError: class extends RESTError {
        constructor(code = 400, message = 'The client request is not valid') {
            super();
            this.code = code;
            this.message = message;
        }
    }
}