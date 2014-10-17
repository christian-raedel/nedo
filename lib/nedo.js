var CConf     = require('node-cconf')
    , shortid = require('shortid')
    , Promise = require('bluebird')
    , write   = Promise.promisify(require('fs').writeFile)
    , read    = Promise.promisify(require('fs').readFile)
    , _       = require('lodash');

module.exports = Nedo;

function Nedo(opts) {
    var config = new CConf('nedo', ['name'])
    .load(opts || {});

    this.config = config;
    this.data   = [];
}

Nedo.prototype.write = function() {
    return write(this.config.getValue('filename'), JSON.stringify(this.data))
    .bind(this)
    .then(function () {
        return Promise.resolve(this.data);
    });
};

Nedo.prototype.load = function() {
    return read(this.config.getValue('filename'))
    .bind(this)
    .then(function (data) {
        this.data = JSON.parse(data);
        return this.data;
    });
};

Nedo.prototype.insert = function(doc) {
    if (_.isPlainObject(doc)) {
        doc['_id'] = shortid.generate();
        if (_.isFunction(this.oninsert)) {
            this.oninsert(doc);
        }
        return Promise.resolve(this.data.push(doc));
    } else if (_.isArray(doc)) {
        var queue = _.map(doc, function (doc) {
            return Nedo.prototype.insert.call(this, doc);
        }, this);

        return Promise.all(queue);
    } else {
        throw new TypeError('Document must be an object or an array of objects!');
    }
};

Nedo.prototype.get = function(query, ctx) {
    if (_.isFunction(query)) {
        return Promise.resolve(_.filter(this.data, query, ctx));
    } else {
        return Promise.resolve(self.data);
    }
};

Nedo.prototype.find = Nedo.prototype.get;

Nedo.prototype.transform = function(fn, query, ctx) {
    if (_.isFunction(fn)) {
        return Promise.resolve(fn(this.data, query, ctx));
    } else {
        throw new TypeError('Transform must be a function!');
    }
};

Nedo.prototype.update = function(query, ctx) {
    return Nedo.prototype.transform.call(this, _.map, query, ctx);
};

Nedo.prototype.delete = Nedo.prototype.update;
