let fs = require("fs-extra");
let path = require("path");
let _typeof = require("./typeof");
let es = require("event-stream");

class Node {
	constructor(filePath) {
		this.setPath(filePath);
	}
	
	get parent() {
		return new Node(path.resolve(this.fullPath, ".."));
	}
	
	child(filePath) {
		return this.rel(filePath);
	}
	
	rel(filePath) {
		return new Node(path.resolve(this.fullPath, filePath));
	}
	
	sibling(filePath) {
		return this.parent.child(filePath);
	}
	
	pathFrom(parent) {
		if (_typeof(parent) === "String") {
			parent = new Node(parent);
		}
		
		return path.relative(parent.fullPath, this.fullPath);
	}
	
	lines() {
		return fs.createReadStream(this.fullPath).pipe(es.split());
	}
	
	get head() {
		return new Promise((resolve, reject) => {
			let lines = this.lines();
			let done = false;
			
			lines.on("data", (line) => {
				done = true;
				lines.destroy();
				resolve(line);
			});
			
			lines.on("error", (e) => {
				if (!done) {
					reject(e);
				}
			});
			
			lines.on("close", () => {
				if (!done) {
					resolve(null);
				}
			});
		});
	}
	
	// is the Node a descendant of parent?
	within(parent) {
		if (parent.fullPath) {
			parent = parent.fullPath;
		}
		
		parent = parent.replace(/\/$/, "");
		
		return (this.fullPath.indexOf(parent) === 0) && (this.fullPath.length > parent.length);
	}
	
	setPath(filePath) {
		this.fullPath = path.resolve(filePath);
		this.name = path.basename(this.fullPath);
		
		let extIndex = this.name.indexOf(".", 1);
		let hasExt = extIndex !== -1;
		
		this.basename = hasExt ? this.name.substr(0, extIndex) : this.name;
		this.extension = hasExt ? this.name.substr(extIndex) : "";
		this.type = this.extension.substr(1);
		
		this.isRoot = this.fullPath === "/";
	}
	
	stat() {
		return fs.stat(this.fullPath);
	}
	
	lstat() {
		return fs.lstat(this.fullPath);
	}
	
	async delete() {
		if (await this.isDir()) {
			return this.rmdir();
		} else {
			return this.unlink();
		}
	}
	
	async rename(find, replace) {
		let newPath;
		
		if (replace) {
			newPath = this.name.replace(find, replace);
		} else {
			newPath = find;
		}
		
		newPath = this.sibling(newPath).fullPath;
		await fs.rename(this.fullPath, newPath);
		
		this.setPath(newPath);
	}
	
	readdir() {
		return fs.readdir(this.fullPath);
	}
	
	async ls() {
		return (await this.readdir()).map(path => new Node(path.resolve(this.fullPath, path)));
	}
	
	async contains(filename) {
		return (await this.readdir()).indexOf(filename) !== -1;
	}
	
	async isDir() {
		try {
			return (await fs.stat(this.fullPath)).isDirectory();
		} catch (e) {
			return false;
		}
	}
	
	async isFile() {
		try {
			return (await fs.stat(this.fullPath)).isFile();
		} catch (e) {
			return false;
		}
	}
	
	async readJson() {
		return JSON.parse(await this.read());
	}
	
	writeJson(json) {
		return this.write(JSON.stringify(json, null, 4));
	}
	
	async read() {
		return (await fs.readFile(this.fullPath)).toString();
	}
	
	write(data) {
		return fs.writeFile(this.fullPath, data);
	}
	
	exists() {
		return fs.exists(this.fullPath);
	}
	
	rmdir() {
		return fs.rmdir(this.fullPath);
	}
	
	unlink() {
		return fs.unlink(this.fullPath);
	}
}

module.exports = (filePath=process.cwd()) => {
	return new Node(filePath);
};
