function DisplayObjectContainer() {
  InteractiveObject.call(this)
  this._tempR = new Rectangle()
  this.numChildren = 0
  this._children = []
}


DisplayObjectContainer.prototype = new InteractiveObject()


DisplayObjectContainer.prototype._getRect = function(tmat, torg, stks) {
  var r = this._trect
  r.setEmpty()
  for (var i = 0; i < this.numChildren; i++) {
    var ch = this._children[i]
    if (!ch.visible)
      continue
    r._unionWith(ch._getRect(tmat, torg, stks))
  }
  return r
}


DisplayObjectContainer.prototype._htpLocal = function(org, p) {
  var n = this._children.length
  for (var i = 0; i < n; i++) {
    var ch = this._children[i]
    if (!ch.visible)
      continue
    var corg = ch._tvec4_0
    var cp = ch._tvec4_1
    var im = ch.transform._getIMat()
    Point._m4.multiplyVec4(im, org, corg)
    Point._m4.multiplyVec4(im, p, cp)
    return ch._htpLocal(corg, cp)
  }
  return false
}


DisplayObjectContainer.prototype.addChild = function(o) {
  this._children.push(o)
  o.parent = this
  o._setStage(this.stage)
  ++this.numChildren
}


DisplayObjectContainer.prototype.removeChild = function(o) {
  var ind = this._children.indexOf(o)
  if (ind < 0)
    return
  this._children.splice(ind, 1)
  o.parent = null
  o._setStage(null)
  --this.numChildren
}


DisplayObjectContainer.prototype.removeChildAt = function(i) {
  this.removeChild(this._children[i])
}


DisplayObjectContainer.prototype.contains = function(o) {
  return (this._children.indexOf(o) >= 0)
}


DisplayObjectContainer.prototype.getChildIndex = function(o) {
  return this._children.indexOf(o)
}


DisplayObjectContainer.prototype.setChildIndex = function(c1, i2) {
  var i1 = this._children.indexOf(c1)
  if (i2 > i1) {
    for (var i = i1 + 1; i <= i2; i++)
      this._children[i - 1] = this._children[i]
    this._children[i2] = c1
  }
  else if (i2 < i1) {
    for (var i = i1 - 1; i >= i2; i--)
      this._children[i + 1] = this._children[i]
    this._children[i2] = c1
  }
}


DisplayObjectContainer.prototype.getChildAt = function(i) {
  return this._children[i]
}


DisplayObjectContainer.prototype._render = function(st) {
  for (var i = 0; i < this.numChildren; i++)
    this._children[i]._renderAll(st)
}


DisplayObjectContainer.prototype._getTarget = function(porg, pp) {// parent origin, parent point
  if (!this.visible || (!this.mouseChildren && !this.mouseEnabled))
    return null
  var org = this._tvec4_0
  var p = this._tvec4_1
  var im = this.transform._getIMat()
  Point._m4.multiplyVec4(im, porg, org)
  Point._m4.multiplyVec4(im, pp, p)
  var topTGT = null
  var n = this.numChildren - 1
  for (var i = n; i > -1; i--) {
    var ntg = this._children[i]._getTarget(org, p)
    if (ntg != null) {
      topTGT = ntg
      break
    }
  }
  if (!this.mouseChildren && topTGT != null)
    return this
  return topTGT
}


DisplayObjectContainer.prototype._setStage = function(st) {
  InteractiveObject.prototype._setStage.call(this, st)
  for (var i = 0; i < this.numChildren; i++)
    this._children[i]._setStage(st)
}
