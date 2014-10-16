var CConf     = require('node-cconf')
    , shortid = require('shortid')
    , q       = require('q')
    , fs      = require('q-io/fs')
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

    return fs.write(self.config.getValue('filename'), JSON.stringify(self.data))
    .then(function () {
        return self.data;
    });
};

Nedo.prototype.load = function() {
    var self = this;

    return fs.read(self.config.getValue('filename'))
    .then(function (data) {
        self.data = JSON.parse(data);
        return self.data;
    });
};

Nedo.prototype.insert = function(doc) {
    var self = this;

    return q.fcall(function () {
        if (_.isPlainObject(doc)) {
            doc['_id'] = shortid.generate();
            if (_.isFunction(self.oninsert)) {
                self.oninsert(doc);
            }
            return q(self.data.push(doc));
        } else if (_.isArray(doc)) {
            var queue = _.map(doc, function (doc) {
                return self.insert(doc);
            });

            return q.all(queue);
        } else {
            throw new TypeError('Document must be an object or an array of objects!');
        }
    });
};

Nedo.prototype.get = function(query, ctx) {
    var self = this;

    return q.fcall(function () {
        if (_.isFunction(query)) {
            return _.filter(self.data, query, ctx);
        } else {
            return self.data;
        }
    });
};

Nedo.prototype.find = Nedo.prototype.get;

Nedo.prototype.transform = function(fn, query, ctx) {
    var self = this;

    return q.fcall(function () {
        if (_.isFunction(fn)) {
            return fn(self.data, query, ctx);
        } else {
            throw new TypeError('Transform must be a function!');
        }
    });
};

Nedo.prototype.update = function(query, ctx) {
    return Nedo.prototype.transform.call(this, _.map, query, ctx);
};

Nedo.prototype.delete = Nedo.prototype.update;
