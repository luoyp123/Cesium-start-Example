/**坐标转换 */
function defined(value) {
    return value !== undefined && value !== null;
}
//#region 坐标转换
//二维屏幕坐标系到三维坐标系的转换
function cartesian2ToCartesian3(cartesian2,result) {
    return scene.globe.pick(viewer.camera.getPickRay(cartesian2), scene); //其中cartesian2为一个二维屏幕坐标。
}
//三维坐标系到二维屏幕坐标系的转换
function cartesian3ToCartesian2(cartesian3) {
    return Cesium.Cartesian2.fromCartesian3(cartesian3);
}
//三维坐标到地理坐标的转换
function cartesian3ToCartographic(cartesian3) {
    return scene.globe.ellipsoid.cartesianToCartographic(cartesian3); //其中cartesian3为一个Cesium.Cartesian3。
}
//地理坐标到经纬度坐标的转换
function cartographicToWgs84(cartographic) {
    return [cartographic.longitude / Math.PI * 180, cartographic.latitude / Math.PI * 180];
}
//三维坐标到经纬度坐标的转换
function cartesian3ToWgs84(cartesian3) {
    var cartographic = cartesian3ToCartographic(cartesian3);
    return [cartographic.longitude / Math.PI * 180, cartographic.latitude / Math.PI * 180];
}
//经纬度坐标转地理坐标（弧度）
function wgs84ToCartographic(point) {
    return Cesium.Cartographic.fromDegree(point);
}
//经纬度坐标转世界坐标
function wgs84ToCartesian3Three(longitude, latitude, height) {
    return Cesium.Cartesian3.fromDegrees(longitude, latitude, height, scene.globe.ellipsoid);
}
//经纬度坐标转世界坐标
function wgs84ToCartesian3(point) {
    return Cesium.Cartesian3.fromDegree(point);
}
//地理坐标（弧度）转世界坐标
function cartographicToCartesian3(cartographic) {
    return scene.globe.ellipsoid.cartographicToCartesian(cartographic);
}
//地理坐标（弧度）转世界坐标
function cartographicToCartesian3Three(longitude, latitude, height) {
    return Cesium.Cartesian3.fromRadians(longitude, latitude, height, scene.globe.ellipsoid);
}
//#endregion