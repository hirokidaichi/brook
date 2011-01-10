

CORE = ./build/brook-core.js
WEB  = ./build/brook-web.js
all : $(CORE) $(WEB)

$(CORE) : \
	./lib/array.js \
	./lib/namespace.js \
	./src/brook.js \
	./src/brook/util.js \
	./src/brook/lamda.js\
	./src/brook/channel.js\
	./src/brook/model.js 
	cat $^ > $@

$(WEB) : \
	$(CORE) \
	./src/brook/dom/compat.js\
	./src/brook/dom/event.js\
	./src/brook/dom/gateway.js\
	./src/brook/widget.js 
	cat $^ > $@
