var Nedo     = require('../sync')
    , fs     = require('fs')
    , path   = require('path')
    , chai   = require('chai')
    , expect = chai.expect
    , spies  = require('chai-spies')
    , _      = require('lodash');

chai.use(spies);

describe('Nedo#constructor', function () {
    it('should instantiate', function () {
        expect(new Nedo({name: 'nedo'})).to.be.an.instanceof(Nedo);
    });
});

describe('Nedo#insert', function () {
    var nedo = null;

    beforeEach(function () {
        nedo = new Nedo({name: 'nedo'});
    });

    it('should insert a new document', function () {
        expect(nedo.insert({name: 'nedo', type: 'datastore'})).to.be.deep.equal({name: 'nedo', type: 'datastore'});
        expect(nedo.data).to.be.deep.equal([{name: 'nedo', type: 'datastore'}]);
    });

    it('should use middleware when inserting a new document', function () {
        var timestamp = chai.spy(Nedo.use.timestamp)
            , shortid = chai.spy(Nedo.use.shortid);
        var inserted = nedo.use(timestamp).use(shortid).insert({name: 'nedo', type: 'datastore'});
        expect(inserted).to.have.property('timestamp');
        expect(inserted).to.have.property('id');
        expect(timestamp).to.have.been.called.once;
        expect(shortid).to.have.been.called.once;
    });

    it('should emit when inserting a new document', function () {
        function oninsert(doc, len, data) {
            expect(doc).to.have.property('name', 'nedo');
            expect(doc).to.have.property('type', 'datastore');
            expect(len).to.be.equal(1);
            expect(data).to.be.equal(nedo.data);
        }
        var oninsert = chai.spy(oninsert);
        nedo.on('insert', oninsert);
        nedo.insert({name: 'nedo', type: 'datastore'});
        expect(oninsert).to.have.been.called.once;
    });
});

describe('Nedo#transform', function () {
    it('should transform stored documents', function () {
        var self = this;
        var nedo = new Nedo({name: 'nedo'});
        nedo.insert({name: 'nedo', type: 'datastore'});
        nedo.transform(_.map, function (doc) {
            expect(this).to.be.equal(self);
            doc.name += '+';
            return doc;
        }, self);
        expect(nedo.data).to.be.deep.equal([{name: 'nedo+', type: 'datastore'}]);
    });
});

describe('Nedo#find', function () {
    var nedo = null;

    beforeEach(function () {
        nedo = new Nedo({name: 'nedo'});
        nedo.insert({name: 'nedo', type: 'datastore'});
    });

    it('should find documents', function () {
        expect(nedo.find({name: 'nedo'})).to.be.deep.equal([{name: 'nedo', type: 'datastore'}]);
    });

    it('should find a document', function () {
        expect(nedo.one({name: 'nedo'})).to.be.deep.equal({name: 'nedo', type: 'datastore'});
    });

    it('should get a document by index', function () {
        expect(nedo.get(0)).to.be.deep.equal({name: 'nedo', type: 'datastore'});
    });

    it('should get all documents', function () {
        expect(nedo.get()).to.be.deep.equal([{name: 'nedo', type: 'datastore'}]);
    });
});

describe('Nedo#update', function () {
    var nedo = null;

    beforeEach(function () {
        nedo = new Nedo({name: 'nedo'});
        nedo.insert({name: 'nedo', type: 'datastore'});
    });

    it('should update a document', function () {
        var self = this;
        expect(nedo.update(function (doc) {
            expect(this).to.be.equal(self);
            if (doc.type === 'datastore') {
                doc.type = 'ultimative datastore';
            }
        }, self)).to.be.deep.equal([{name: 'nedo', type: 'ultimative datastore'}]);
    });

    it('should emit when updating a document', function () {
        function onupdate(docs) {
            expect(docs).to.be.deep.equal([{name: 'nedo', type: 'ultimative datastore'}]);
        }
        var onupdate = chai.spy(onupdate);
        nedo.on('update', onupdate);
        nedo.update(function (doc) {
            if (doc.type === 'datastore') {
                doc.type = 'ultimative datastore';
            }
        });
        expect(onupdate).to.have.been.called.once;
    });
});

describe('Nedo#delete', function () {
    var nedo = null;

    beforeEach(function () {
        nedo = new Nedo({name: 'nedo'});
        nedo.insert({name: 'nedo', type: 'datastore'});
    });

    it('should delete a document', function () {
        expect(nedo.delete(function (doc) {
            return doc.name === 'nedo';
        })).to.be.deep.equal([]);
    });
});

describe('Nedo#save && Nedo#load', function () {
    var nedo = null, filename = path.resolve(__dirname, 'test.json');

    before(function () {
        nedo = new Nedo({name: 'nedo', filename: filename});
        nedo.insert({name: 'nedo', type: 'datastore'});
    });

    after(function () {
        fs.unlinkSync(filename);
    });

    it('should save to a file', function () {
        expect(nedo.save()).to.be.an.instanceof(Nedo);
        expect(fs.existsSync(filename)).to.be.true;
    });

    it('should load from a file', function () {
        expect(nedo.clear().load().get()).to.be.deep.equal([{name: 'nedo', type: 'datastore'}]);
    });
});
