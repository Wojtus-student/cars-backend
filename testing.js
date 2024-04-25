const UserDB = require("./module/user_db.js").UserDB;

const udb = new UserDB();

user1 = {
    id:'h4vht87vo8t734o8tv',
    username: 'user',
    password: 'asdfasdf',
    role: 'admin',
    email: 'bobobo@bobobo.com'
}

try {
    udb.process(user1);
} catch(e)
{
    console.error(e)
}

