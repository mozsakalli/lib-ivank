function Bitmap(bd) {
  DisplayObject.call(this)
  this.bitmapData = bd
}


Bitmap.prototype = new InteractiveObject()


Bitmap.prototype._getLocRect = function() {
  return this.bitmapData.rect
}


Bitmap.prototype._render = function(st) {
  var tbd = this.bitmapData
  if (!tbd._loaded)
    return
  if (tbd._dirty)
    tbd._syncWithGPU()
  gl.uniformMatrix4fv(st._sprg.tMatUniform, false, st._mstack.top())
  st._cmstack.update()
  Stage._setVC(tbd._vBuffer)
  Stage._setTC(tbd._tcBuffer)
  Stage._setUT(1)
  Stage._setTEX(tbd._texture)
  Stage._setEBF(st._unitIBuffer)
  gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0)
}
