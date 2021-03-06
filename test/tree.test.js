/*
 * The MIT License
 *
 * Copyright (c) 2010 Sam Day
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
 
 var vows = require("vows"),
	assert = require("assert"),
	gitteh = require("gitteh"),
	path = require("path"),
	fixtureValues = require("./fixtures/values"),
	helpers = require("./fixtures/helpers.js");

var DIRECTORY_ATTRIBUTE = helpers.fromOctal(40000);

var repo = gitteh.openRepository(fixtureValues.REPO_PATH);

var createTreeTestContext = function(topic, treeFixture) {
	var context = {
		topic: topic,
		
		"gives us a Tree": function(tree) {
			assert.isTrue(!!tree);
		},
		
		"with correct id": function(tree) {
			assert.equal(tree.id, treeFixture.id);
		}
	};
	
	// Run assertions on the contents of tree.
	var createEntriesChecks = function(entriesFixture, path) {
		var entriesContext = {
			topic: function(tree) {
				return tree;
			},
			
			"has correct number of entries": function(tree) {
				assert.equal(tree.entries.length, entriesFixture.length);
			}
		};
		
		context[(path == "") ? "- root entries" : ("- tree " + path)] = entriesContext;

		for(var i = 0; i < entriesFixture.length; i++) {
			entriesContext["- entry " + entriesFixture[i].filename] = (function(i) {
				var theContext = {
					topic: function(tree) {
						return tree.entries[i];
					},
					
					"has correct name": function(entry) {
						assert.equal(entry.name, entriesFixture[i].filename);
					},
					
					"has correct attributes": function(entry) {
						assert.equal(helpers.toOctal(entry.attributes), entriesFixture[i].attributes);
					},
					
					"has correct id": function(entry) {
						assert.equal(entry.id, entriesFixture[i].id);
					}
				};
				
				// We're dealing with a folder here. Let's recurse into it and check it out.
				if(entriesFixture[i].attributes == DIRECTORY_ATTRIBUTE) {
					createEntriesChecks(entriesFixture[i].entries, path + "/" + entriesFixture[i].filename);
				}
				
				return theContext;				
			})(i);
		}
	};
	
	createEntriesChecks(treeFixture.entries, "");
	
	return context;
};


var createSyncTreeTestContext = function(treeFixture) {
	return createTreeTestContext(function() {
		return repo.getTree(treeFixture.id);
	}, treeFixture);
};

var createAsyncTreeTestContext = function(treeFixture) {
	return createTreeTestContext(function() {
		repo.getTree(treeFixture.id, this.callback);
	}, treeFixture);
};

vows.describe("Tree").addBatch({
	"Basic tree tests": {
		topic: repo.getTree(fixtureValues.FIRST_TREE.id),
		
		"id is immutable": function(tree) {
			tree.id = "foo";
			assert.equal(tree.id, fixtureValues.FIRST_TREE.id);
		}
	},
	
	"First tree (async)": createAsyncTreeTestContext(fixtureValues.FIRST_TREE),
	"Second tree (async)": createAsyncTreeTestContext(fixtureValues.SECOND_TREE),
	"Third tree (async)": createAsyncTreeTestContext(fixtureValues.THIRD_TREE),
	"Fourth tree (async)": createAsyncTreeTestContext(fixtureValues.FOURTH_TREE),
	"Fifth tree (async)": createAsyncTreeTestContext(fixtureValues.FIFTH_TREE),
	
	"First tree": createSyncTreeTestContext(fixtureValues.FIRST_TREE),
	"Second tree": createSyncTreeTestContext(fixtureValues.SECOND_TREE),
	"Third tree": createSyncTreeTestContext(fixtureValues.THIRD_TREE),
	"Fourth tree": createSyncTreeTestContext(fixtureValues.FOURTH_TREE),
	"Fifth tree": createSyncTreeTestContext(fixtureValues.FIFTH_TREE),
	/*
	"Retrieving tree entry by name *asynchronously*": {
		topic: function() {
			var tree = repo.getTree(fixtureValues.FIRST_TREE.id);
			this.context.tree = tree;
			tree.getEntry(fixtureValues.FIRST_TREE.entries[0].filename, this.callback);
		},
		
		"gives us the correct entry": function(entry) {
			assert.equal(entry.filename, fixtureValues.FIRST_TREE.entries[0].filename);
			assert.equal(entry.id, fixtureValues.FIRST_TREE.entries[0].id);	
		},
		
		"identical to getting it via index": function(entry) {
			assert.isTrue(entry === this.context.tree.getEntry(0));
		}
	},
	
	"Retrieving tree entry by name *synchronously*": {
		topic: function() {
			var tree = repo.getTree(fixtureValues.FIRST_TREE.id);
			this.context.tree = tree;
			return tree.getEntry(fixtureValues.FIRST_TREE.entries[0].filename);
		},
		
		"gives us the correct entry": function(entry) {
			assert.equal(entry.filename, fixtureValues.FIRST_TREE.entries[0].filename);
			assert.equal(entry.id, fixtureValues.FIRST_TREE.entries[0].id);	
		},
		
		"identical to getting it via index": function(entry) {
			assert.isTrue(entry === this.context.tree.getEntry(0));
		}
	},
	
	"Retrieving tree entry by index *asynchronously*": {
		topic: function() {
			var tree = repo.getTree(fixtureValues.FIRST_TREE.id);
			this.context.tree = tree;
			tree.getEntry(0, this.callback);
		},
		
		"gives us the correct entry": function(entry) {
			assert.equal(entry.filename, fixtureValues.FIRST_TREE.entries[0].filename);
			assert.equal(entry.id, fixtureValues.FIRST_TREE.entries[0].id);	
		}
	},	
	
	"Retrieving tree entry by index *synchronously*": {
		topic: function() {
			var tree = repo.getTree(fixtureValues.FIRST_TREE.id);
			this.context.tree = tree;
			return tree.getEntry(0);
		},
		
		"gives us the correct entry": function(entry) {
			assert.equal(entry.filename, fixtureValues.FIRST_TREE.entries[0].filename);
			assert.equal(entry.id, fixtureValues.FIRST_TREE.entries[0].id);	
		}
	},
	
	"Loading a non-existent tree": {
		topic: function() {
			return function() {
				repo.getTree(helpers.getSHA1("foo"));
			};
		},
		
		"throws an error": function(fn) {
			assert.throws(fn, Error);
		}
	},
	
	"Loading a tree that is actually a commit": {
		topic: function() {
			return function() {
				repo.getTree(fixtureValues.FIRST_COMMIT.id);
			};
		},
		
		"throws an error": function(tree) {
			assert.throws(tree, Error);
		}
	},
	
	"Looking up a non-existent tree entry": {
		topic: function() {
			var tree = repo.getTree(fixtureValues.FIRST_TREE.id);
			return tree.getEntry("foo.bar.i.dont.exist");
		},
		
		"gives us null": function(entry) {
			assert.isNull(entry);
		}
	},
	
	"Looking up an entry out of bounds": {
		topic: function() {
			var tree = repo.getTree(fixtureValues.FIRST_TREE.id);
			
			return function() {
				return tree.getEntry(fixtureValues.FIRST_TREE.entries.length);
			};
		},
		
		"gives us undefined": function(fn) {
			assert.doesNotThrow(fn, Error);
			assert.isNull(fn());
		}
	},
	
	"Saving tree *asynchronously*": {
		topic: function() {
			var tree = this.context.tree = repo.createTree();
			
			tree.addEntry("47ee7698c336ba5b163c193ae6309f0a7d7e9662", "asyncsave", 1);
			tree.save(this.callback);
		},
		
		"works": function(res) {
			assert.isTrue(res);
			assert.isNotNull(this.context.tree.id);
		}
	},

	"Creating a new Tree": {
		topic: function() {
			repo.createTree(this.callback);
		},
		
		"gives us a new Tree": function(tree) {
			assert.isTrue(!!tree);
		},
		
		"with correct identity": function(tree) {
			assert.isNull(tree.id);
			assert.equal(tree.entryCount, 0);
		},
		
		"adding an invalid entry throws an error": function(tree) {
			assert.throws(function() {
				tree.addEntry();
			}, Error);
		},
		
		"- adding an entry": {
			topic: function(tree) {
				var t = this;
				this.context.tree = tree;
				return function() {
					t.context.entry = tree.addEntry(fixtureValues.EMPTY_BLOB, "test", helpers.fromOctal(100644));
					return t.context.entry;
				};
			},
			
			"executes correctly": function(fn) {
				assert.doesNotThrow(fn, Error);
			},
			
			"returns the new entry": function() {
				var newEntry = this.context.entry;
				assert.isObject(newEntry);
				assert.equal(newEntry.id, fixtureValues.EMPTY_BLOB);
				assert.equal(newEntry.filename, "test");
				assert.equal(newEntry.attributes, helpers.fromOctal(100644));
			},
			
			"adds to tree *entries* correctly": function() {
				assert.equal(this.context.tree.entryCount, 1);
			},
			
			"entry has correct values": function() {
				var entry = this.context.tree.getEntry(0);
				assert.equal(entry.id, fixtureValues.EMPTY_BLOB);
				assert.equal(entry.attributes, helpers.fromOctal(100644));
				assert.equal(entry.filename, "test");
			},
			
			"- saving": {
				topic: function(fn, tree) {
					tree.save();
					return tree;
				},
				
				"updates id correctly": function(tree) {
					assert.equal(tree.id, "f05af273ba36fe5176e5eaab349661a56b3d27a0");
				},
				
				"this tree is now available from Repository": function(tree) {
					assert.isTrue(tree === repo.getTree("f05af273ba36fe5176e5eaab349661a56b3d27a0"));
				},
				
				"- then deleting entry again": {
					topic: function(tree) {
						this.context.tree = tree;
						return function() {
							tree.removeEntry(0);
						};
					},
					
					"works correctly": function(fn) {
						assert.doesNotThrow(fn, Error);
					},
					
					"results in an empty tree": function(fn) {
						assert.equal(this.context.tree.entryCount, 0);
					},

					"which cannot be saved": function() {
						var t = this;

						assert.throws(function() {
							t.context.tree.save();
						}, Error);
					}
				}
			}
		}
	},
	
	"Creating a new Tree and trying to save it with no entries": {
		topic: function() {
			var tree = repo.createTree();
			
			return function() {
				tree.save();
			};
		},

		"throws an Error": function(fn) {
			assert.throws(fn, Error);
		}
	},
	
	"Deleting an entry *asynchronously*": {
		topic: function() {
			var tree = this.context.tree = repo.createTree();
			tree.addEntry("47ee7698c336ba5b163c193ae6309f0a7d7e9662", "asyncdeleteme", 100);
			tree.removeEntry(0, this.callback);
		},
		
		"works": function(res) {
			assert.isTrue(res);
		},
		
		"length is 0 now": function() {
			assert.equal(this.context.tree.entryCount, 0);
		}
	},
	
	"Deleting an entry *synchronously*": {
		topic: function() {
			var tree = this.context.tree = repo.createTree();
			tree.addEntry("47ee7698c336ba5b163c193ae6309f0a7d7e9662", "syncdeleteme", 100);
			return tree.removeEntry(0);
		},
		
		"works": function(res) {
			assert.isTrue(res);
		},
		
		"length is 0 now": function() {
			assert.equal(this.context.tree.entryCount, 0);
		}
	},
	
	"Deleting an entry via out of bounds index": {
		topic: function() {
			var tree = repo.createTree();
			
			return function() {
				tree.removeEntry(-1);
			};
		},
		
		"throws an error": function(fn) {
			assert.throws(fn, Error);
		}
	},
	
	"Deleting a non-existent entry": {
		topic: function() {
			var tree = repo.createTree();
			
			return function() {
				tree.removeEntry("foo.i.dont.exist");
			};
		},
		
		"throws an error": function(fn) {
			assert.throws(fn, Error);
		}
	},
	
	"Editing an entry": {
		topic: function() {
			var tree = this.context.tree = repo.createTree();
			tree.addEntry(fixtureValues.EMPTY_BLOB, "test", helpers.fromOctal(100644));

			var entry = tree.getEntry(0);

			return function() {
				entry.id = fixtureValues.FIRST_TREE.entries[0].id;
				entry.name = "hello";
				entry.attributes = 666;
				
				tree.save();
			};
		},

		"works correctly": function(fn) {
			fn();
			assert.doesNotThrow(fn, Error);
		},
		
		"tree id is correct": function() {
			assert.equal(this.context.tree.id, "dfad82c5d5f5d4f589f449df594ad4321d8d8468");
		}
	},
	
	"Clearing tree entries *asynchronously*": {
		topic: function() {
			var tree = this.context.tree = repo.createTree();
			tree.addEntry("47ee7698c336ba5b163c193ae6309f0a7d7e9662", "asyncclearingtest", 100644);
			tree.save();
			this.context.treeId = tree.id;

			tree.clear(this.callback);
		},
		
		"executes correctly": function(res) {
			assert.isTrue(res);
		},
		
		"results in an empty tree": function() {
			assert.equal(this.context.tree.entryCount, 0);
		},
		
		"still has same id though": function() {
			assert.equal(this.context.tree.id, this.context.treeId);
		}
	},
	
	"Clearing tree entries *synchronously*": {
		topic: function() {
			var tree = this.context.tree = repo.createTree();
			tree.addEntry("47ee7698c336ba5b163c193ae6309f0a7d7e9662", "syncclearingtest", 100644);
			tree.save();
			this.context.treeId = tree.id;
			
			return function() {
				tree.clear();
			};
		},
		
		"executes correctly": function(fn) {
			assert.doesNotThrow(fn, Error);
		},
		
		"results in an empty tree": function() {
			assert.equal(this.context.tree.entryCount, 0);
		},
		
		"still has same id though": function() {
			assert.equal(this.context.tree.id, this.context.treeId);
		}
	}*/
}).export(module);
