var CConf          = require('node-cconf')
    , EventEmitter = require('events').EventEmitter
    , util         = require('util')
    , fs           = require('fs')
    , debug        = require('debug')('nedo')
    , shortid      = require('shortid')
    , _            = require('lodash');

module.exports = Nedo;

function Nedo(opts) {
    EventEmitter.call(this);
    this.config = new CConf('nedo', ['name']).load(opts || {});
    this.middleware = [];
    this.data = [];
    debug('new Nedo instance created:', this.config.config);
}

util.inherits(Nedo, EventEmitter);

Nedo.prototype.use = function(fn) {
    if (_.isFunction(fn)) {
        this.middleware.push(fn);
    } else {
        this.emit('error', new TypeError('Insert middleware must be a function!'));
    }
    return this;
};

Nedo.prototype.insert = function(doc) {
    if (_.isArray(doc)) {
        return _.map(doc, function (doc) {
            return this.insert(doc);
        }, this);
    } else {
        _.reduce(this.middleware, function (prev, fn) {
            return fn(prev);
        }, doc, this);
        var len = this.data.push(doc);
        this.emit('insert', doc, len, this.data);
        return doc;
    }
};

Nedo.prototype.transform = function(fn, query, ctx) {
    if (_.isFunction(fn)) {
        this.data = fn.call(ctx, this.data, query, ctx);
        return this;
    } else {
        this.emit('error', new TypeError('Transform must be a function!'));
    }
};

Nedo.prototype.find = function(query, chain, ctx) {
    if (_.isBoolean(chain) && chain) {
        return _.chain(this.data).filter(query, ctx);
    } else {
        return _.filter(this.data, query, chain);
    }
};

Nedo.prototype.one = function(query, ctx) {
    return this.find(query, ctx)[0];
};

Nedo.prototype.get = function(idx) {
    if (_.isNumber(idx)) {
        return this.data[idx];
    } else if (_.isBoolean(idx) && idx) {
        return _.chain(this.data);
    } else {
        return this.data;
    }
};

Nedo.prototype.update = function(query, ctx) {
    if (_.isFunction(query)) {
        _.forEach(this.data, function (doc) {
            doc = query.call(ctx, doc);
        }, ctx);
        this.emit('update', this.data);
        return this.data;
    } else {
        this.emit('error', new TypeError('Update query must be a function!'));
    }
};

Nedo.prototype.delete = function(query, ctx) {
    if (_.isFunction(query)) {
        this.data = _.filter(this.data, function (doc) {
            return !query.call(ctx, doc);
        }, ctx);
        this.emit('update', this.data);
        return this.data;
    } else {
        this.emit('error', new TypeError('Delete query must be a function!'));
    }
};

Nedo.prototype.clear = function() {
    this.data = [];
    return this;
};

Nedo.prototype.save = function() {
    try {
        var filename = this.config.getValue('filename');
        if (_.isString(filename)) {
            fs.writeFileSync(filename, JSON.stringify(this.data), 'utf8');
            return this;
        } else {
            throw new TypeError('Please provide a valid filename to save to!');
        }
    } catch (err) {
        this.emit('error', err);
    }
};

Nedo.prototype.load = function() {
    try {
        var filename = this.config.getValue('filename');
        if (_.isString(filename) && fs.existsSync(filename)) {
            this.data = JSON.parse(fs.readFileSync(filename, 'utf8'));
            return this;
        } else {
            throw new TypeError('Please provide a valid filename to load from!');
        }
    } catch (err) {
        this.emit('error', err);
    }
};

module.exports.use = {
    shortid: function (doc) {
        if (!doc.id) {
            doc.id = shortid.generate();
        }
        return doc;
    },
    timestamp: function (doc) {
        if (!doc.timestamp) {
            doc.timestamp = new Date().getTime();
        }
        return doc;
    }
};
