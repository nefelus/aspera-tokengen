all:
	npm install -d

clean: node_modules
	rm -rf node_modules
run:
	node app.js 

SRC_FILES = nefelus-s3app.js lib/*.js lib/unar/unar.js lib/unar/package.json
OTHER_FILES = pluribus.js package.json #npm-shrinkwrap.json
CONFIGS = config.json
HTML = s3upload
JS_FILES = s3upload/*.js

pack: distclean
	mkdir -p dist/nefelus-s3/lib/unar
	for f in $(SRC_FILES); do \
		cp $$f dist/nefelus-s3/$$f; \
	done;
	for f in $(CONFIGS); do \
		cp $$f dist/nefelus-s3/$$f.in; \
	done;
	cp $(OTHER_FILES) dist/nefelus-s3
	cp -a $(HTML) dist/nefelus-s3
	for f in $(JS_FILES); do \
		cp $$f dist/nefelus-s3/$$f; \
	done;
	rm dist/nefelus-s3/s3upload/*old
	( cd dist; tar zcf nefelus-s3.tgz nefelus-s3 )

dist: distclean
	mkdir -p dist/nefelus-s3/lib/unar
	for f in $(SRC_FILES); do \
		uglifyjs $$f -m -o dist/nefelus-s3/$$f; \
	done;
	for f in $(CONFIGS); do \
		cp $$f dist/nefelus-s3/$$f.in; \
	done;
	cp $(OTHER_FILES) dist/nefelus-s3
	cp -a $(HTML) dist/nefelus-s3
	for f in $(JS_FILES); do \
		uglifyjs $$f -m -o dist/nefelus-s3/$$f; \
	done;
	rm dist/nefelus-s3/s3upload/*old
	( cd dist; tar zcf nefelus-s3.tgz nefelus-s3 )

distclean:
	rm -rf dist

.PHONY: all

