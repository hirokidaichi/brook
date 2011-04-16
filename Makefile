

CORE   = ./build/brook-core.js
COMPAT = ./build/brook.js
MOBILE = ./build/brook-mobile.js
MIN    = ./build/brook.min.js
HTP    = ./build/brook-view-htmltemplate-core.js
all : $(CORE) $(COMPAT) $(MIN)

clean :
	rm -rf ./build/*

$(CORE) : \
	./src/brook.js \
	./src/brook/util.js \
	./src/brook/lamda.js\
	./src/brook/channel.js\
	./src/brook/model.js 
	cat $^ > $@

$(HTP) : ./lib/html-template-core.js
	perl ./bin/wrapns $^ "brook.view.htmltemplate.core" > $@

$(COMPAT) : \
	$(CORE) \
	$(HTP) \
	./src/brook/view/htmltemplate.js\
	./src/brook/dom/compat.js\
	./src/brook/dom/gateway.js\
	./src/brook/widget.js 
	cat $^ > $@

$(MOBILE) : \
	$(COMPAT) \
	./src/brook/mobile/dom/event.js 
	cat $^ > $@

$(MIN) : \
	$(MOBILE)
	perl ./bin/minify < $^ > $@

PHANTOMJS ?= phantomjs

test:
	$(PHANTOMJS) t/tlib/run.js $(wildcard t/*.html)
