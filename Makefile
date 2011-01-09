

CORE = ./build/brook-core.js
WEB  = ./build/brook-web.js
all : $(CORE) $(WEB)

$(CORE) : \
	./src/brook.js \
	./src/brook/util.js \
	./src/brook/lamda.js\
	./src/brook/channel.js
	cat $^ > $@

$(WEB) : \
	$(CORE) \
	./src/brook/dom/compat.js\
	./src/brook/dom/event.js\
	./src/brook/widget.js\
	./src/brook/net/http.js\
	./src/brook/net/jsonrpc.js
	cat $^ > $@
