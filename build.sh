#!/bin/bash

VERSION=1.2.1

cat src/geom/Point.js \
    src/geom/Rectangle.js \
    src/geom/Transform.js \
    > obj/geom.js

cat src/events/EventDispatcher.js \
    src/events/Event.js \
    src/events/MouseEvent.js \
    src/events/TouchEvent.js \
    src/events/KeyboardEvent.js \
    > obj/events.js

cat src/display/BlendMode.js \
    src/display/DisplayObject.js \
    src/display/InteractiveObject.js \
    src/display/DisplayObjectContainer.js \
    src/display/BitmapData.js \
    src/display/Bitmap.js \
    src/display/Stage.js \
    src/display/Graphics.js \
    src/display/Sprite.js \
    > obj/display.js

cat src/text/TextFormatAlign.js \
    src/text/TextFormat.js \
    src/text/TextField.js \
    > obj/text.js

cat src/Utils.js \
    obj/geom.js \
    obj/events.js \
    obj/display.js \
    obj/text.js \
    > obj/lib/ivank-${VERSION}.js
