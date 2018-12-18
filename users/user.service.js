const config = require('config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('_helpers/db');
const User = db.User;

module.exports = {
    authenticate,
    getAll,
    getById,
    create,
    update,
    changePass,
    delete: _delete
};

async function authenticate({ username, password }) {
    const user = await User.findOne({
        $or: [
            { 'username': username },
            { 'email': username}
        ]
    });
    if (user && bcrypt.compareSync(password, user.hash)) {
        if (user.status === 'inactive') {
            throw 'The account is inactive. Please contact to system administrator.';
        }
        const { hash, ...userWithoutHash } = user.toObject();
        const token = jwt.sign({ sub: user.id }, config.secret);
        return {
            ...userWithoutHash,
            token
        };
    }
}

async function getAll() {
    return await User.find().select('-hash');
}

async function getById(id) {
    return await User.findById(id).select('-hash');
}

async function create(userParam) {
    // validate
    if (await User.findOne({ username: userParam.username })) {
        throw 'The username "' + userParam.username + '" has already been taken';
    }

    const user = new User(userParam);

    // hash password
    if (userParam.password) {
        user.hash = bcrypt.hashSync(userParam.password, 10);
    }

    // save user
    await user.save();
}

async function update(id, userParam) {
    const user = await User.findById(id);

    // validate
    if (!user) throw 'User not found';
    if (user.username !== userParam.username && await User.findOne({ username: userParam.username })) {
        throw 'Username "' + userParam.username + '" has already been taken';
    }

    // hash password if it was entered
    if (userParam.password) {
        userParam.hash = bcrypt.hashSync(userParam.password, 10);
    }

    // copy userParam properties to user
    Object.assign(user, userParam);

    await user.save();
}

async function changePass(id, userParam) {
    const user = await User.findById(id);

    if(!user) throw 'User not found';

    if(userParam.old_password && !bcrypt.compareSync(userParam.old_password, user.hash)) {
        throw "Old password isn't valid.";
    }

    if(userParam.new_password != userParam.confirm_new_password) {
        throw "Password confirmation doesn't match.";
    }

    user.set({hash: bcrypt.hashSync(userParam.new_password, 10)});

    // //hash new password
    // if (userParam.new_password) {
    //     userParam.hash = bcrypt.hashSync(userParam.new_password, 10);
    // }

    // Object.assign(user, userParam.hash);

    await user.save();
}

async function _delete(id) {
    await User.findByIdAndRemove(id);
}