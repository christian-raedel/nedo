var CConf     = require('node-cconf')
    , shortid = require('shortid')
    , Promise = require('bluebird')
    , write   = Promise.promisify(require('fs').writeFile)
    , read    = Promise.promisify(require('fs').readFile)
    , _       = require('lodash');

module.exports = Nedo;

function Nedo(opts) {
    var self = this;

    var config = new CConf('nedo', ['name'])
    .load(opts || {});

    self.config = config;
    self.data   = [];
}

Nedo.prototype.write = function() {
    var self = this;

    return write(self.config.getValue('filename'), JSON.stringify(self.data))
    .then(function () {
        return Promise.resolve(self.data);
    });
};

Nedo.prototype.load = function() {
    var self = this;

    return read(self.config.getValue('filename'))
    .then(function (data) {
        self.data = JSON.parse(data);
        return self.data;
    });
};

Nedo.prototype.insert = Promise.method(function(doc) {
    var self = this;

    if (_.isPlainObject(doc)) {
        doc['_id'] = shortid.generate();
        if (_.isFunction(self.oninsert)) {
            self.oninsert(doc);
        }
        return Promise.resolve(self.data.push(doc));
    } else if (_.isArray(doc)) {
        var queue = _.map(doc, function (doc) {
            return Nedo.prototype.insert.call(self, doc);
        });

        return Promise.all(queue);
    } else {
        throw new TypeError('Document must be an object or an array of objects!');
    }
});

Nedo.prototype.get = function(query, ctx) {
    var self = this;

    return new Promise(function (resolve) {
        if (_.isFunction(query)) {
            return resolve(_.filter(self.data, query, ctx));
        } else {
            return resolve(self.data);
        }
    });
};

Nedo.prototype.find = Nedo.prototype.get;

Nedo.prototype.transform = function(fn, query, ctx) {
    var self = this;

    return new Promise(function (resolve, reject) {
        if (_.isFunction(fn)) {
            return resolve(fn(self.data, query, ctx));
        } else {
            reject(new TypeError('Transform must be a function!'));
        }
    });
};

Nedo.prototype.update = function(query, ctx) {
    return Nedo.prototype.transform.call(this, _.map, query, ctx);
};

Nedo.prototype.delete = Nedo.prototype.update;
