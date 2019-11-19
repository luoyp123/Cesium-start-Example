//控制移动方向
var GLE_bMoveForward = false; //是否向前移动
var GLE_bMoveBackward = false; //是否向后移动
var GLE_bMoveLeft = false; //是否向左移动
var GLE_bMoveRight = false; //是否向右移动
var GLE_bMoveUp = false; //是否向上移动
var GLE_bMoveDown = false; //是否向下移动
//移动速度
var GLE_iHorizontalSpeed = 2000; //控制器水平移动速度
var GLE_iUpSpeed = 2000; //控制跳起时的速度，重力加速度默认9.81米/平方秒
// var GLE_footAltitude = 800; //落地后相机距离地面距离
// var GLE_horizontal = 3500;


function initIR() {
    //获取当前相机位置，经纬度
    var position = viewer.camera.position; //获取相机世界坐标
    var direction = viewer.camera.direction;//相机的朝向
    console.log(direction);
    //世界坐标转经纬度
    var degrees = cartesian3ToWgs84(position);
    //调整视角水平高程为2米
    viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(degrees[0], degrees[1], 2.0),
        orientation: {
            heading: Cesium.Math.toRadians(0.0),
            pitch: Cesium.Math.toRadians(0.0),
            roll: 0.0
        }
    });
}