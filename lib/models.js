const Path = require('path');
const Glob = require('glob');
const Sequelize = require("sequelize");

module.exports = {
    getFiles,
    load,
    loadModelsClass,
    applyRelations,
};

async function getFiles(paths, ignored) {
    const options = {
        nodir: true,
        dot: false
    };

    if (!Array.isArray(paths)) {
        paths = [paths];
    }

    if (ignored) {
        options.ignore = ignored;
    }

    return paths.reduce((acc, pattern) => {
        const joinPaths = Array.prototype.concat.bind([], acc);
        const paths = Glob.sync(pattern, options);
        return joinPaths(paths);
    }, []);
}

async function load(files, fn) {
    if (!files) {
        return [];
    }

    if (!Array.isArray(files)) {
        files = [files];
    }

    return files.reduce((acc, file) => {
        const models = {};
        const filepath = Path.isAbsolute(file) ? file : Path.join(process.cwd(), file);
        const Model = fn(filepath);
        models[Model.name] = Model;
        return Object.assign({}, acc, models);
    }, {});
}

async function loadModelsClass(files, sequelize ) {
    if (!files) {
        return [];
    }

    if (!Array.isArray(files)) {
        files = [files];
    }

    return files.reduce((acc, file) => {
        const models = {};
        const filepath = Path.isAbsolute(file) ? file : Path.join(process.cwd(), file);
        const Model = require(filepath);
        if (typeof Model.init === "function") {
            Model.init(sequelize ,Sequelize);
        }
        models[Model.name] = Model;
       
        return Object.assign({}, acc, models);
    }, {});
}


async function applyRelations(models) {
    if (typeof models !== 'object') {
        throw new Error(`Can't apply relationships on invalid models object`);
    }
    Object.values(models)
    .filter(model => typeof model.associate === "function")
    .forEach(model => model.associate(models));

    // Object.keys(models).forEach(name => {
    //     if (models[name].hasOwnProperty('associate')) {
    //         models[name].associate(models);
    //     }
    // });

    return models;
}
