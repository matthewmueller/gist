/**
 * Module Dependencies
 */

var request = require('superagent');
var Batch = require('batch');

/**
 * Export `Gist`
 */

module.exports = Gist;

/**
 * Initialize `Gist`
 *
 * @param {String} id
 * @return {Gist}
 * @api public
 */

function Gist(id) {
  if (!(this instanceof Gist)) return new Gist(id);
  this.id = id;
  this._public = false;
  this._url = 'https://api.github.com/gists';
  this.desc = '';
  this.files = {};
  this.batch = new Batch;
  this.batch.concurrency(1);
}

/**
 * Add an access token
 *
 * @param {String} token
 * @return {Gist}
 * @api public
 */

Gist.prototype.token = function(token) {
  this._token = token;
  return this;
};

/**
 * Use basic auth
 *
 * @param {String} user
 * @param {String} pass
 * @return {Gist}
 * @api public
 */

Gist.prototype.auth = function(user, pass) {
  this.user = user || '';
  this.pass = pass || '';
  return this;
};

/**
 * Set public / private
 *
 * @param {Boolean} public
 * @return {Gist}
 * @api public
 */

Gist.prototype.public = function(p) {
  this._public = p;
  return this;
};

/**
 * Set a description
 *
 * @param {String} desc
 * @return {Gist}
 * @api public
 */

Gist.prototype.description = function(desc) {
  this.desc = desc;
  return this;
};

/**
 * Get the gist
 *
 * @param {Function} fn
 * @return {Gist}
 * @api public
 */

Gist.prototype.get = function(fn) {
  if (this.gist) return fn(null, this.gist);
  else if (this.isNew()) return fn(new Error('Cannot get an unsaved gist'));
  var self = this;

  this.request('get', this.url())
    .end(function(res) {
      if (res.error) return fn(res.error);
      self.gist = res.body;
      fn(null, res.body);
    });

  return this;
};

/**
 * Save the gist
 *
 * @param {Function} fn
 * @return {Gist}
 * @api public
 */

Gist.prototype.save = function(fn) {
  return this.isNew() ? this.create(fn) : this.update(fn);
};

/**
 * Create a gist
 *
 * @param {Function} fn
 * @return {Gist}
 * @api private
 */

Gist.prototype.create = function(fn) {
  var self = this;
  var files = this.files;
  var len = Object.keys(files).length;
  if (!len) return fn(new Error('You must attach at least one file to the gist'));

  this.request('post', this.url())
    .send({ public: this._public, files: this.files, description: this.desc })
    .end(function(res) {
      if (res.error) return fn(res.error);
      self.gist = res.body;
      fn(null, res.body);
    });

  return this;
};

/**
 * Update a gist
 *
 * @param {Function} fn
 * @return {Gist}
 * @api private
 */

Gist.prototype.update = function(fn) {
  var self = this;

  // run anything that's queued up
  this.batch.end(update.bind(this));

  // update
  function update() {
    this.request('patch', this.url())
      .send({ files: this.files, description: this.desc })
      .end(function(res) {
        if (res.error) return fn(res.error);
        self.batch = new Batch;
        fn(null, res.body);
      });
  }

  return this;
};

/**
 * Create or edit a file
 *
 * @param {String} filename
 * @return {File}
 * @api public
 */

Gist.prototype.file = function(filename) {
  return new File(filename, this);
};

/**
 * is new?
 *
 * @return {Boolean}
 * @api public
 */

Gist.prototype.isNew = function() {
  return !this.id;
};

/**
 * get the url
 *
 * @return {String}
 * @api private
 */

Gist.prototype.url = function() {
  return this.isNew() ? this._url : this._url + '/' + this.id;
};

/**
 * Make requests
 *
 * @param {String} method
 * @param {String} url
 * @return {Request}
 * @api private
 */

Gist.prototype.request = function(method, url) {
  var req = request[method](url);
  req.type('json')
  req.set('User-Agent', 'gist api')

  // set authorization
  if (this._token) req.set('Authorization', 'token ' + this._token)
  else if (this.user) req.auth(this.user, this.pass);

  return req;
};

/**
 * Initialize `File`
 *
 * @param {String} filename
 * @param {Gist} gist
 * @return {File}
 * @api private
 */

function File(filename, gist) {
  this.filename = filename;
  this.gist = gist;
  this.batch = gist.batch;
  gist.files[filename] = {};
}

/**
 * Write to the file
 *
 * @param {String} str
 * @return {File}
 * @api public
 */

File.prototype.write = function(str) {
  this.gist.files[this.filename].content = str;
  return this;
};

/**
 * Prepend to a file
 *
 * @param {String} str
 * @return {File}
 * @api public
 */

File.prototype.prepend = function(str) {
  if (this.gist.isNew()) return this.write(str);
  return this.add(str, true);
};

/**
 * Append to the file
 *
 * @param {String} str
 * @return {File}
 * @api public
 */

File.prototype.append = function(str) {
  if (this.gist.isNew()) return this.write(str);
  return this.add(str, false);
};

/**
 * Read a file
 *
 * @param {Function} fn
 * @return {File}
 * @api public
 */

File.prototype.read = function(fn) {
  var gist = this.gist;
  var filename = this.filename;

  if (gist.isNew()) return fn(null, '');

  gist.get(function(err, json) {
    if (err) return fn(err);
    var file = json.files[filename];
    if (!file) return fn(null, '');
    return fn(null, file.content || '');
  });
};

/**
 * Add to a file
 *
 * @param {String} str
 * @param {Boolean} prepend
 * @return {File}
 * @api private
 */

File.prototype.add = function(str, prepend) {
  var self = this;
  var filename = this.filename;
  var gist = this.gist;

  gist.batch.push(function(done) {
    gist.get(function(err, json) {
      if (err) return done(err);

      var file = json.files[filename];
      if (!file) {
        self.write(str);
        return done();
      }

      var content = file.content || '';
      content = (prepend) ? str + content : content + str;
      self.write(content);

      done();
    });
  });

  return this;
};
