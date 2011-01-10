

CORE = ./build/brook-core.js
FULL = ./build/brook.js
MIN  = ./build/brook.min.js

all : $(CORE) $(FULL) $(MIN)

clean :
	rm -rf ./build/*

$(CORE) : \
	./lib/array.js \
	./src/brook.js \
	./src/brook/util.js \
	./src/brook/lamda.js\
	./src/brook/channel.js\
	./src/brook/model.js 
	cat $^ > $@


$(FULL) : \
	$(CORE) \
	./src/brook/dom/compat.js\
	./src/brook/dom/gateway.js\
	./src/brook/widget.js 
	cat $^ > $@

$(MIN) : \
	$(FULL)
	perl ./bin/minify < $^ > $@

