var CConf     = require('node-cconf')
    , debug   = require('debug')('nedo')
    , shortid = require('shortid')
    , fs      = require('fs')
    , _       = require('lodash');

module.exports = Nedo;

function Nedo(opts) {
    var config = new CConf('nedo', ['name'])
    .load(opts || {});

    this.config = config;
    this.data = [];
}

Nedo.prototype.write = function() {
    var self = this
        , filename = self.config.getValue('filename');

    if (_.isString(filename)) {
        fs.writeFileSync(filename, JSON.stringify(self.data));
        return self;
    } else {
        throw new TypeError('Please configure valid filename to write to!');
    }
};

Nedo.prototype.load = function() {
    var self = this
        , filename = self.config.getValue('filename');

    if (_.isString(filename) && fs.existsSync(filename)) {
        self.data = JSON.parse(fs.readFileSync(filename));
    } else if (_.isFunction(self.onerror)) {
        self.onerror(new TypeError('Please configure valid filename to load from!'));
    }

    return self;
};

Nedo.prototype.insert = function(doc) {
    var self = this;

    if (_.isArray(doc)) {
        return _.map(doc, function (doc) {
            return Nedo.prototype.insert.call(self, doc);
        });
    } else if (_.isObject(doc)) {
        doc['_id'] = shortid.generate();
        if (_.isFunction(self.oninsert)) {
            self.oninsert(doc);
        }
        return self.data.push(doc);
    } else {
        throw new TypeError('Document must be an object or an array of objects!');
    }
};

Nedo.prototype.get = function(query, ctx) {
    var self = this;

    if (_.isFunction(query)) {
        return _.filter(self.data, query, ctx);
    } else if (_.isNumber(query)) {
        return self.data[query];
    } else {
        return self.data;
    }
};

Nedo.prototype.find = Nedo.prototype.get;

Nedo.prototype.transform = function(fn, query, ctx) {
    var self = this;

    if (_.isFunction(fn)) {
        return fn(self.data, query, ctx || self);
    } else {
        throw new TypeError('Transform must be a function!');
    }
};

Nedo.prototype.update = function(query, ctx) {
    var self = this;

    return Nedo.prototype.transform.call(self, _.map, query, ctx);
};

Nedo.prototype.delete = function(query, ctx) {
    var self = this;

    if (_.isFunction(query)) {
        self.data = _.filter(self.data, query, ctx);
        return self.data;
    } else if (_.isNumber(query)) {
        self.data.splice(query, 1);
        return self.data;
    } else {
        self.data = [];
    }
};
