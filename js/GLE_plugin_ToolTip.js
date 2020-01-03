;
/**
 * 添加标签
 * @nanme Sogrey
 * 
 * @version v1.0.0
 * @param {Cesium.Viewer} Cesium
 */
GLEToolTip = (function (Cesium) {
    var _viewer, _scene, _canvas, _camera,_globe;
    /**
     * 此构造函数会转为类声明
     * @param {Cesium.Viewer} viewer 
     */
    function _(viewer) {
        _viewer = viewer;
        this._viewer = viewer;
        _scene = _viewer.scene;
        _canvas = _viewer.canvas;
        _camera = _viewer.camera;
        _globe = _scene.globe;
    }

    _.prototype.addTextTip = function (tag,position,message) {}

    _.prototype.addHtmlTip = function (tag,position,html) {}

    _.prototype.setVisible = function (tag,visible) {}

    _.prototype.remove = function (tag) {}

    _.prototype.clearAll = function () {}
    
    return _;
})(window.Cesium || {});