# gist.js

  Fluent gist API for node.js.

## Example

```js
var gist = Gist('gistID')
  .token('sometoken')

gist.file('hello.js')
    .write('alert("hello!");')

gist.file('log.txt')
    .append('fails')

gist.save(fn);
```

## Installation

Using Node.js:

    npm install gist.js

In the browser (component):

    component install matthewmueller/gist

## Generating an oAuth token

    curl -u USERNAME -X POST https://api.github.com/authorizations --data "{\"scopes\":[\"gist\"]}"

## API

### Gist(id)

Initialize a gist with an `id`. If no `id` is provided, the gist will be created when you save.

### gist#token(token)

Authenticate with an oAuth `token`

### gist#auth(username, password)

Authenticate with your `username` and `password`

### gist#description(description)

Give the gist a description

### gist#public(public)

Set the gist's privacy. Defaults to `false` (private).

### gist#get(fn)

Fetch the gist.

```js
gist.get(function(err, json) {
  // ...
})
```

### gist#save(fn)

Save (`create` or `update`) the gist.

```js
gist.save(function(err, json) {
  // ...
})
```

### gist.file(filename)

Initialize a `File` with the given `filename`.

### file#write(str)

Write to the file. Overwrites any content that was previously there.

### file#append(str)

Writes to the end of the file. If the file doesn't exist, it will create it and add `str`.

### file#prepend(str)

Save as `file#append(str)` but writes to the beginning of a file

### file#read(fn)

Reads the contents of the file

```js
var file = gist.file('hello.js')
file.read(function(err, str) {
  // ...
});
```

## License

(The MIT License)

Copyright (c) 2013 matthew mueller &lt;mattmuelle@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
