flowfs
======

I developed flowfs because I could never remember the names and signatures of the `fs` API, and because manipulating paths as strings is awkward and error-prone.

flowfs attempts to solve both of these by providing an intuitive API that represents files as objects.  Navigation between nodes is via properties; for example, if you're implementing an `include` directive for a template language and need to calculate a relative path -- instead of this:

```javascript
const fs = require("fs");
const path = require("path");

function include (templatePath, includePath) {
	let parent = fs.dirname(templatePath);
	
	return path.resolve(parent, includePath);
}
```

... you would do this:

```javascript
const fs = require("flowfs");

function include (templatePath, includePath) {
	return fs(templatePath).parent.child(includePath).fullPath;
}
```

Instantiating and navigating between nodes doesn't do any IO, it just does string manipulation internally -- `fs("/path/to/non-existent/file")` is perfectly valid, and the recommended way to create new files with flowfs (e.g. `await fs("/new/file").write("data");`).
