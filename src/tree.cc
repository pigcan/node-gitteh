#include "tree.h"
#include "tree_entry.h"

Persistent<FunctionTemplate> Tree::constructor_template;

void Tree::Init(Handle<Object> target) {
	HandleScope scope;

	Local<FunctionTemplate> t = FunctionTemplate::New(New);
	constructor_template = Persistent<FunctionTemplate>::New(t);
	constructor_template->SetClassName(String::New("Tree"));
	t->InstanceTemplate()->SetInternalFieldCount(1);

	t->PrototypeTemplate()->SetAccessor(TREE_LENGTH_SYMBOL, LengthGetter);
	t->PrototypeTemplate()->SetIndexedPropertyHandler(IndexHandler);
}

Handle<Value> Tree::New(const Arguments& args) {
	HandleScope scope;

	REQ_ARGS(1);
	REQ_EXT_ARG(0, theTree);

	Tree *tree = new Tree();
	tree->tree_ = (git_tree*)theTree->Value();

	tree->Wrap(args.This());

	args.This()->Set(String::New("id"), String::New(git_oid_allocfmt(git_tree_id(tree->tree_))), ReadOnly);

	return args.This();
}

Handle<Value> Tree::LengthGetter(Local<String> property, const AccessorInfo& info) {
	HandleScope scope;

	Tree *tree = ObjectWrap::Unwrap<Tree>(info.This());
	size_t entryCount = git_tree_entrycount(tree->tree_);

	return scope.Close(Integer::New(entryCount));
}

Handle<Value> Tree::IndexHandler(uint32_t index, const AccessorInfo& info) {
	HandleScope scope;

	Tree *tree = ObjectWrap::Unwrap<Tree>(info.This());
	size_t entryCount = git_tree_entrycount(tree->tree_);

	if(index > (entryCount-1)) {
		return ThrowException(Exception::Error(String::New("Tree entry index is out of range.")));
	}

	git_tree_entry *entry = git_tree_entry_byindex(tree->tree_, index);

	TreeEntry *treeEntryObject;
	if(!tree->treeEntryObjects_[(int)entry]) {
		Handle<Value> constructorArgs[2] = { External::New(entry), External::New(tree) };
		Handle<Object> jsObject = TreeEntry::constructor_template->GetFunction()->NewInstance(2, constructorArgs);

		treeEntryObject = ObjectWrap::Unwrap<TreeEntry>(jsObject);
		tree->treeEntryObjects_[(int)entry] = static_cast<void *>(treeEntryObject);
	}
	else {
		treeEntryObject = static_cast<TreeEntry*>(tree->treeEntryObjects_[(int)entry]);
	}

	return scope.Close(treeEntryObject->handle_);
}

Tree::~Tree() {
}