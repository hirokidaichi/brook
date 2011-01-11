

CORE = ./build/brook-core.js
COMPAT = ./build/brook-compat.js
MIN  = ./build/brook.min.js
MOBILE = ./build/brook-mobile.js

all : $(CORE) $(COMPAT) $(MIN)

clean :
	rm -rf ./build/*

$(CORE) : \
	./src/brook.js \
	./src/brook/util.js \
	./src/brook/lang/array.js\
	./src/brook/lang/class.js\
	./src/brook/lang/object.js\
	./src/brook/lang/string.js \
	./src/brook/lamda.js\
	./src/brook/channel.js\
	./src/brook/model.js 
	cat $^ > $@


$(COMPAT) : \
	$(CORE) \
	./src/brook/dom/compat.js\
	./src/brook/dom/gateway.js\
	./src/brook/widget.js 
	cat $^ > $@

$(MOBILE) : \
	$(COMPAT) \
	./src/brook/mobile/dom/event.js \
	./src/brook/mobile/net/httprequester.js \
	./src/brook/mobile/net/jsonrpc.js
	cat $^ > $@

$(MIN) : \
	$(COMPAT)
	perl ./bin/minify < $^ > $@

