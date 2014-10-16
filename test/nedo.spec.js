var Nedo     = require('../index')
    , chai   = require('chai')
    , expect = chai.expect
    , spies  = require('chai-spies')
    , fs     = require('fs')
    , _      = require('lodash');

chai.use(spies);

describe('Nedo#constructor', function () {
    it('should instantiates', function () {
        expect(new Nedo({name: 'nedo'})).to.be.an.instanceof(Nedo);
    });
});

describe('Nedo#crud', function () {
    var model = null;

    before(function () {
        model = new Nedo({name: 'nedo'});
    });

    it('should insert documents and apply callback', function (done) {
        function oninsert(doc) {
            expect(doc).to.have.property('_id');
        }
        var spy = chai.spy(oninsert);
        model.oninsert = spy;

        model.insert({name: 'inge'})
        .then(function (idx) {
            expect(idx).to.be.equal(1);
            expect(spy).to.have.been.called.once;
            expect(model.data[0]).to.have.property('name', 'inge');
            done();
        })
        .catch(done)
        .done();
    });

    it('should get/find documents', function (done) {
        var self = this;

        function query(doc, idx, arr) {
            expect(doc).to.be.ok;
            expect(idx).to.be.above(-1);
            expect(arr).to.be.an('array');
            expect(this).to.be.deep.equal(self);
            return _.isEqual(doc.name, 'inge');
        }
        var spy = chai.spy(query);

        model.get(spy, self)
        .then(function (docs) {
            expect(docs[0]).to.have.property('name', 'inge');
            expect(spy).to.have.been.called.once;
            done();
        })
        .catch(done)
        .done();
    });

    it('should update documents', function (done) {
        var self = this;

        function query(doc, idx, arr) {
            expect(this).to.be.deep.equal(self);
            if (_.isEqual(doc.name, 'inge')) {
                doc.name = 'nedo';
            }
            return doc;
        }
        var spy = chai.spy(query);

        model.update(spy, this)
        .then(function (docs) {
            expect(docs[0]).to.have.property('name', 'nedo');
            expect(spy).to.have.been.called.once;
            expect(model.data[0]).to.have.property('name', 'nedo');
            done();
        })
        .catch(done)
        .done();
    });

    it('should transform documents', function (done) {
        var self = this;

        model.insert({name: 'inge'})
        .then(function (idx) {
            expect(idx).to.be.above(-1);
            model.transform(_.sortBy, 'name', self)
            .then(function (docs) {
                expect(docs[0]).to.have.property('name', 'inge');
                expect(docs[1]).to.have.property('name', 'nedo');
                done();
            })
            .catch(done)
            .done();
        })
        .catch(done)
        .done();
    });

    it('should delete documents', function (done) {
        var self = this;

        function query(doc, idx, arr) {
            if (_.isEqual(doc.name, 'inge')) {
                arr.splice(idx, 1);
            }
        }
        var spy = chai.spy(query);

        model.delete(spy, this)
        .then(function () {
            expect(spy).to.have.been.called.twice;
            expect(model.data.length).to.be.equal(1);
            done();
        })
        .catch(done)
        .done();
    });
});

describe('Nedo#load&save', function () {
    var model = null, filename = __dirname + '/test.json';

    beforeEach(function () {
        model = new Nedo({name: 'nedo', filename: filename});
    });

    after(function () {
        if (fs.existsSync(filename)) {
            fs.unlinkSync(filename);
        }
    });

    it('should write documents', function (done) {
        model.insert([
            {name: 'inge'},
            {name: 'nedo'}
        ])
        .then(Nedo.prototype.write.bind(model))
        .then(function (docs) {
            expect(docs[0]).to.have.property('name', 'inge');
            expect(docs[1]).to.have.property('name', 'nedo');
            expect(fs.existsSync(filename)).to.be.true;
            done();
        })
        .catch(done)
        .done();
    });

    it('should load documents', function (done) {
        model.load()
        .then(function (docs) {
            expect(docs[0]).to.have.property('name', 'inge');
            expect(docs[1]).to.have.property('name', 'nedo');
            done();
        })
        .catch(done)
        .done();
    });
});
