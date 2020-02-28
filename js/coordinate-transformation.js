/**坐标转换 */
function defined(value) {
    return value !== undefined && value !== null && value !== "";
}

function getCamera(camera) {
    return {
        positionWC: camera.positionWC, //世界坐标位置
        position: camera.position, //当前位置，相对于transform
        transform: camera.transform, //旋转矩阵
        direction: camera.direction, //方向
        heading: camera.heading, //航向角
        pitch: camera.pitch //俯仰角
    }
}
/**
 * 弧度转角度
 */
function radian2Angle(radian) {
    // 角度 = 弧度 * 180 / Math.PI;
    return radian * 180 / Math.PI;
}
/**
 * 角度转弧度
 */
function angle2Radian(angle) {
    // 弧度= 角度 * Math.PI / 180;
    return angle * Math.PI / 180;
}

//#region 坐标转换
//二维屏幕坐标系到三维坐标系的转换
function cartesian2ToCartesian3(cartesian2) {
    return scene.globe.pick(viewer.camera.getPickRay(cartesian2), scene); //其中cartesian2为一个二维屏幕坐标。
}
//三维坐标系到二维屏幕坐标系的转换
function cartesian3ToCartesian2(cartesian3) {
    return Cesium.Cartesian2.fromCartesian3(cartesian3);
}
//三维坐标到地理坐标的转换
function cartesian3ToCartographic(cartesian3) {
    if (Cesium.defined(cartesian3) && Cesium.Cartesian3.distance(cartesian3, new Cesium.Cartesian3()) > 0)
        return scene.globe.ellipsoid.cartesianToCartographic(cartesian3); //其中cartesian3为一个Cesium.Cartesian3。
    else console.log("cartesian3 must not null or ZERO");
}
//地理坐标到经纬度坐标的转换
function cartographicToWgs84(cartographic) {
    return [cartographic.longitude / Math.PI * 180, cartographic.latitude / Math.PI * 180, cartographic.height];
}
//三维坐标到经纬度坐标的转换
function cartesian3ToWgs84(cartesian3) {
    var cartographic = cartesian3ToCartographic(cartesian3);
    if (Cesium.defined(cartographic))
        return [cartographic.longitude / Math.PI * 180, cartographic.latitude / Math.PI * 180, cartographic.height];
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
/**
 * 获取相机水平面上投影朝向
 * @param {Cesium.Camera} camera 相机
 * @param {Cesium.Cartesian3} result [可选]相机水平面上投影朝向,（已转为单位向量）
 */
function getHorizontalDirection(camera, result) {
    if (!Cesium.defined(camera)) {
        console.error("camera must not be null.");
        return null;
    }

    if (!Cesium.defined(result)) {
        result = new Cesium.Cartesian3();
    }

    var direction = camera.direction.clone();
    var position = camera.position.clone();
    var pitch = camera.pitch;
    var right = camera.right.clone();

    var lookScratchQuaternion = new Cesium.Quaternion();
    var lookScratchMatrix = new Cesium.Matrix3();

    var turnAngle = Cesium.defined(pitch) ? pitch : camera.defaultLookAmount;
    var quaternion = Cesium.Quaternion.fromAxisAngle(right, -turnAngle, lookScratchQuaternion);
    var rotation = Cesium.Matrix3.fromQuaternion(quaternion, lookScratchMatrix);

    Cesium.Matrix3.multiplyByVector(rotation, direction, result);

    Cesium.Cartesian3.normalize(result, result);
    // console.log(direction, result);
    return result;
}
/**
 * 根据起点坐标、方向以及距离求终点坐标
 * 
 *   origin    direction-→        result 
 *      ●━━━━━━━━━━━━━━━━━━━━━━━━━━━●    
 *      ┕━━━━━━━━distance━━━━━━━━━━━┙    
 * 
 * @param {Cesium.Cartesian3} origin 起点（世界坐标）
 * @param {Cesium.Cartesian3} direction 方向
 * @param {Number} distance 距离
 * @param {Cesium.Cartesian3} result 终点（世界坐标）
 * 
 * @see Cesium.Ray.getPoint(ray, t, result)
 */
function getPositionByOriginDirectionAndDistance(origin, direction, distance, result) {
    if (!Cesium.defined(result)) {
        result = new Cesium.Cartesian3();
    }

    var originClone = origin.clone();
    var directionClone = direction.clone();

    Cesium.Cartesian3.multiplyByScalar(directionClone, distance, directionClone);
    Cesium.Cartesian3.add(originClone, directionClone, result);

    return result;
}
// var direction = camera.direction.clone();
// getHorizontalDirection(camera,direction);
// var ray = new Cesium.Ray(camera.position,direction);
// drawRayHelper(api.viewer,ray);
/**
 * 绘制射线辅助线
 * @param {Cesium.Viewer} viewer 
 * @param {Cesium.Ray} ray 射线
 */
function drawRayHelper(viewer, ray, color) {
    if (!Cesium.defined(viewer)) {
        console.error("viewer must not be null.");
        return;
    }
    if (!Cesium.defined(ray)) {
        console.error("ray must not be null.");
        return;
    }

    var result = new Cesium.Cartesian3();
    // getPositionByOriginDirectionAndDistance(ray.origin, ray.direction, 2.0, result);
    Cesium.Ray.getPoint(ray, 10.0, result)
    // result.z = ray.origin.z;
    var curLinePointsArr = [];

    var origin = cartesian3ToWgs84(ray.origin);
    var lastPoint = cartesian3ToWgs84(result);
    curLinePointsArr.push(origin[0], origin[1], origin[2]);
    curLinePointsArr.push(lastPoint[0], lastPoint[1], lastPoint[2]);

    var polyline = viewer.entities.getById('id-ray-helper');
    if (!polyline) {
        var random = Math.random();
        var purpleArrow = viewer.entities.add({
            id: 'id-ray-helper' + random,
            description: 'ray-helper' + random,
            name: 'ray-helper' + random,
            polyline: {
                positions: Cesium.Cartesian3.fromDegreesArrayHeights(curLinePointsArr),
                width: 10,
                arcType: Cesium.ArcType.NONE,
                material: new Cesium.PolylineArrowMaterialProperty(Cesium.defined(color) ? color : Cesium.Color.PURPLE)
            }
        });

        viewer.flyTo(purpleArrow);
    }
}
/**
 * 计算当前时间点飞机模型的位置矩阵
 * @param {Cesium.Entity} entity 3D实体
 * @param {Number} time 时间
 */
function computeModelMatrix(entity, time) {
    if (!Cesium.defined(entity)) {
        return undefined;
    }

    //获取位置
    var position = Cesium.Property.getValueOrUndefined(entity.position, time, new Cesium.Cartesian3());
    if (!Cesium.defined(position)) {
        return undefined;
    }
    //获取方向
    var modelMatrix;
    var orientation = Cesium.Property.getValueOrUndefined(entity.orientation, time, new Cesium.Quaternion());
    if (!Cesium.defined(orientation)) {
        modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(position, undefined, new Cesium.Matrix4());
    } else {
        modelMatrix = Cesium.Matrix4.fromRotationTranslation(Cesium.Matrix3.fromQuaternion(orientation, new Cesium.Matrix3()),
            position, new Cesium.Matrix4());
    }
    return modelMatrix;
}
/**
 * 根据位置坐标（WGS84）计算当前时间点飞机模型的位置矩阵
 * @param {Cesium.Cartesian3} wgs84 Wgs84经纬度坐标（角度制）
 * @param {Number} time 时间：Cesium.JulianDate.now()
 */
function computeWgs84Matrix(wgs84, time) {
    //WGS84 转 Cartesian3
    var positionCartesian3 = Cesium.Cartesian3.fromDegrees(wgs84.x /*longitude*/ , wgs84.y /*longitude*/ , wgs84.z /*height*/ );
    computePositionMatrix(positionCartesian3, time)
}
/**
 * 根据世界坐标（Cartesian3）计算当前时间点飞机模型的位置矩阵
 * @param {Cesium.Cartesian3} position 笛卡尔世界坐标
 * @param {Number} time 时间：Cesium.JulianDate.now()
 */
function computePositionMatrix(position, time) {
    if (!Cesium.defined(position)) {
        return undefined;
    }
    var positionProperty = new Cesium.ConstantPositionProperty(position, Cesium.ReferenceFrame.FIXED);
    return computePositionPropertyMatrix(positionProperty, time);
}
/**
 * 根据ConstantPositionProperty计算当前时间点飞机模型的位置矩阵
 * @param {Cesium.ConstantPositionProperty} positionProperty 
 * @param {Number} time 时间：Cesium.JulianDate.now()
 */
function computePositionPropertyMatrix(positionProperty, time) {
    //获取位置
    var positionTmp = Cesium.Property.getValueOrUndefined(positionProperty, time, new Cesium.Cartesian3());
    if (!Cesium.defined(positionTmp)) {
        return undefined;
    }
    //获取方向
    var modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(positionTmp, undefined, new Cesium.Matrix4());

    return modelMatrix;
}
/**
 * 计算引擎(粒子发射器)位置偏移矩阵
 * @param {Number} xOffset
 * @param {Number} yOffset
 * @param {Number} zOffset
 */
function computeEmitterModelMatrix(xOffset, yoffset, zOffset) {
    //方向
    var hpr = Cesium.HeadingPitchRoll.fromDegrees(0.0, 0.0, 0.0, new Cesium.HeadingPitchRoll());
    var trs = new Cesium.TranslationRotationScale();

    //以modelMatrix(飞机)中心为原点的坐标系的xyz轴位置偏移
    Cesium.Cartesian3.fromElements(xOffset, yoffset, zOffset, trs.translation);
    Cesium.Quaternion.fromHeadingPitchRoll(hpr, trs.rotation);
    return Cesium.Matrix4.fromTranslationRotationScale(trs, new Cesium.Matrix4());
}

var PI = 3.1415926535897932384626;
var a = 6378245.0;
var ee = 0.00669342162296594323;

/**
 * WGS84转GCj02
 * @param lng
 * @param lat
 * @returns {*[]}
 */
function wgs84togcj02(lng, lat) {
    if (out_of_china(lng, lat)) {
        return [lng, lat]
    } else {
        var dlat = transformlat(lng - 105.0, lat - 35.0);
        var dlng = transformlng(lng - 105.0, lat - 35.0);
        var radlat = lat / 180.0 * PI;
        var magic = Math.sin(radlat);
        magic = 1 - ee * magic * magic;
        var sqrtmagic = Math.sqrt(magic);
        dlat = (dlat * 180.0) / ((a * (1 - ee)) / (magic * sqrtmagic) * PI);
        dlng = (dlng * 180.0) / (a / sqrtmagic * Math.cos(radlat) * PI);
        var mglat = lat + dlat;
        var mglng = lng + dlng;
        return [mglng, mglat]
    }
}

/**
 * GCJ02 转换为 WGS84
 * @param lng
 * @param lat
 * @returns {*[]}
 */
function gcj02towgs84(lng, lat) {
    if (out_of_china(lng, lat)) {
        return [lng, lat]
    } else {
        var dlat = transformlat(lng - 105.0, lat - 35.0);
        var dlng = transformlng(lng - 105.0, lat - 35.0);
        var radlat = lat / 180.0 * PI;
        var magic = Math.sin(radlat);
        magic = 1 - ee * magic * magic;
        var sqrtmagic = Math.sqrt(magic);
        dlat = (dlat * 180.0) / ((a * (1 - ee)) / (magic * sqrtmagic) * PI);
        dlng = (dlng * 180.0) / (a / sqrtmagic * Math.cos(radlat) * PI);
        mglat = lat + dlat;
        mglng = lng + dlng;
        return [lng * 2 - mglng, lat * 2 - mglat]
    }
}

function transformlat(lng, lat) {
    var ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(
        lng));
    ret += (20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(lat * PI) + 40.0 * Math.sin(lat / 3.0 * PI)) * 2.0 / 3.0;
    ret += (160.0 * Math.sin(lat / 12.0 * PI) + 320 * Math.sin(lat * PI / 30.0)) * 2.0 / 3.0;
    return ret
}

function transformlng(lng, lat) {
    var ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng));
    ret += (20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(lng * PI) + 40.0 * Math.sin(lng / 3.0 * PI)) * 2.0 / 3.0;
    ret += (150.0 * Math.sin(lng / 12.0 * PI) + 300.0 * Math.sin(lng / 30.0 * PI)) * 2.0 / 3.0;
    return ret
}

/**
 * 判断是否在国内，不在国内则不做偏移
 * @param lng
 * @param lat
 * @returns {boolean}
 */
function out_of_china(lng, lat) {
    return (lng < 72.004 || lng > 137.8347) || ((lat < 0.8293 || lat > 55.8271) || false);
}

/**
 * 飞机航线，抛物线，输入两点的经纬度、最高点高程、插值个数可以算出各个点的坐标。
 * options = {
    height:5000,//最高点高程
    num:50,//插值个数
    pt1:{
        lon:-97.0,
        lat:43.0
    },
    pt2:{
        lon:-97.0,
        lat:43.0
    }
  }

  https://github.com/YanzheZhang/Cesium.HPUZYZ.Demo/blob/master/Cesium1.43/MyDemos/Tools-35TrailLine-flypath.html
 * @param {Object} options 
 * @param {Array} resultOut 
 */
function parabolaEquation(options, resultOut) {
    //方程 y=-(4h/L^2)*x^2+h h:顶点高度 L：横纵间距较大者
    var h = options.height && options.height > 5000 ? options.height : 5000;
    var L = Math.abs(options.pt1.lon - options.pt2.lon) > Math.abs(options.pt1.lat - options.pt2.lat) ?
        Math.abs(options.pt1.lon - options.pt2.lon) : Math.abs(options.pt1.lat - options.pt2.lat);
    var num = options.num && options.num > 50 ? options.num : 50;
    var result = [];
    var dlt = L / num;
    if (Math.abs(options.pt1.lon - options.pt2.lon) > Math.abs(options.pt1.lat - options.pt2.lat)) { //以lon为基准
        var delLat = (options.pt2.lat - options.pt1.lat) / num;
        if (options.pt1.lon - options.pt2.lon > 0) {
            dlt = -dlt;
        }
        for (var i = 0; i < num; i++) {
            var tempH = h - Math.pow((-0.5 * L + Math.abs(dlt) * i), 2) * 4 * h / Math.pow(L, 2);
            var lon = options.pt1.lon + dlt * i;
            var lat = options.pt1.lat + delLat * i;
            result.push([lon, lat, tempH]);
        }
    } else { //以lat为基准
        var delLon = (options.pt2.lon - options.pt1.lon) / num;
        if (options.pt1.lat - options.pt2.lat > 0) {
            dlt = -dlt;
        }
        for (var i = 0; i < num; i++) {
            var tempH = h - Math.pow((-0.5 * L + Math.abs(dlt) * i), 2) * 4 * h / Math.pow(L, 2);
            var lon = options.pt1.lon + delLon * i;
            var lat = options.pt1.lat + dlt * i;
            result.push([lon, lat, tempH]);
        }
    }
}














// var direction = getHorizontalDirection(api.viewer.camera);
// var ray = new Cesium.Ray(api.viewer.camera.position,api.viewer.camera.direction);
// //drawRayHelper(api.viewer,ray);
// //var ray = new Cesium.Ray(start, direction);
// var objectsToExclude=api.viewer.scene.primitives._primitives;
// var results = [];
// var drillPick = false;
// if (drillPick) {
//    results = scene.drillPickFromRay(ray, 100000, objectsToExclude);
// } else {
//    var result = scene.pickFromRay(ray, objectsToExclude);
//    if (Cesium.defined(result)) {
//        results = [result];
//    }
// }
// console.log(results);









// /**
//  * Returns an object containing the first object intersected by the ray and the position of intersection,
//  * or <code>undefined</code> if there were no intersections. The intersected object has a <code>primitive</code>
//  * property that contains the intersected primitive. Other properties may be set depending on the type of primitive
//  * and may be used to further identify the picked object. The ray must be given in world coordinates.
//  *
//  * @private
//  *
//  * @param {Ray} ray The ray.
//  * @param {Object[]} [objectsToExclude] A list of primitives, entities, or features to exclude from the ray intersection.
//  * @returns {Object} An object containing the object and position of the first intersection.
//  *
//  * @exception {DeveloperError} Ray intersections are only supported in 3D mode.
//  */
// Cesium.Scene.prototype.pickFromRay = function (ray, objectsToExclude) {
//     var results = getRayIntersections(this, ray, 1, objectsToExclude);
//     if (results.length > 0) {
//         return results[0];
//     }
// };
// /**
//  * Returns a list of objects, each containing the object intersected by the ray and the position of intersection.
//  * The intersected object has a <code>primitive</code> property that contains the intersected primitive. Other
//  * properties may also be set depending on the type of primitive and may be used to further identify the picked object.
//  * The primitives in the list are ordered by first intersection to last intersection. The ray must be given in
//  * world coordinates.
//  *
//  * @private
//  *
//  * @param {Ray} ray The ray.
//  * @param {Number} [limit=Number.MAX_VALUE] If supplied, stop finding intersections after this many intersections.
//  * @param {Object[]} [objectsToExclude] A list of primitives, entities, or features to exclude from the ray intersection.
//  * @returns {Object[]} List of objects containing the object and position of each intersection.
//  *
//  * @exception {DeveloperError} Ray intersections are only supported in 3D mode.
//  */
// Cesium.Scene.prototype.drillPickFromRay = function (ray, limit, objectsToExclude) {
//     return getRayIntersections(this, ray, limit, objectsToExclude);
// };

// function updateDebugFrustumPlanes(scene) {
//     var frameState = scene._frameState;
//     if (scene.debugShowFrustumPlanes !== scene._debugShowFrustumPlanes) {
//         if (scene.debugShowFrustumPlanes) {
//             scene._debugFrustumPlanes = new Cesium.DebugCameraPrimitive({
//                 camera: scene.camera,
//                 updateOnChange: false
//             });
//         } else {
//             scene._debugFrustumPlanes = scene._debugFrustumPlanes && scene._debugFrustumPlanes.destroy();
//         }
//         scene._debugShowFrustumPlanes = scene.debugShowFrustumPlanes;
//     }

//     if (Cesium.defined(scene._debugFrustumPlanes)) {
//         scene._debugFrustumPlanes.update(frameState);
//     }
// }


// function executeShadowMapCastCommands(scene) {
//     var frameState = scene.frameState;
//     var shadowMaps = frameState.shadowState.shadowMaps;
//     var shadowMapLength = shadowMaps.length;

//     if (!frameState.shadowState.shadowsEnabled) {
//         return;
//     }

//     var context = scene.context;
//     var uniformState = context.uniformState;

//     for (var i = 0; i < shadowMapLength; ++i) {
//         var shadowMap = shadowMaps[i];
//         if (shadowMap.outOfView) {
//             continue;
//         }

//         // Reset the command lists
//         var j;
//         var passes = shadowMap.passes;
//         var numberOfPasses = passes.length;
//         for (j = 0; j < numberOfPasses; ++j) {
//             passes[j].commandList.length = 0;
//         }

//         // Insert the primitive/model commands into the command lists
//         var sceneCommands = scene.frameState.commandList;
//         insertShadowCastCommands(scene, sceneCommands, shadowMap);

//         for (j = 0; j < numberOfPasses; ++j) {
//             var pass = shadowMap.passes[j];
//             uniformState.updateCamera(pass.camera);
//             shadowMap.updatePass(context, j);
//             var numberOfCommands = pass.commandList.length;
//             for (var k = 0; k < numberOfCommands; ++k) {
//                 var command = pass.commandList[k];
//                 // Set the correct pass before rendering into the shadow map because some shaders
//                 // conditionally render based on whether the pass is translucent or opaque.
//                 uniformState.updatePass(command.pass);
//                 executeCommand(command.derivedCommands.shadows.castCommands[i], scene, context, pass.passState);
//             }
//         }
//     }
// }
// function executeCommand(command, scene, context, passState, debugFramebuffer) {
//     var frameState = scene._frameState;

//     if ((Cesium.defined(scene.debugCommandFilter)) && !scene.debugCommandFilter(command)) {
//         return;
//     }

//     if (command instanceof Cesium.ClearCommand) {
//         command.execute(context, passState);
//         return;
//     }

//     if (command.debugShowBoundingVolume && (defined(command.boundingVolume))) {
//         debugShowBoundingVolume(command, scene, passState, debugFramebuffer);
//     }

//     if (frameState.useLogDepth && Cesium.defined(command.derivedCommands.logDepth)) {
//         command = command.derivedCommands.logDepth.command;
//     }

//     var passes = frameState.passes;
//     if (passes.pick || passes.depth) {
//         if (passes.pick && !passes.depth && defined(command.derivedCommands.picking)) {
//             command = command.derivedCommands.picking.pickCommand;
//             command.execute(context, passState);
//             return;
//         } else if (defined(command.derivedCommands.depth)) {
//             command = command.derivedCommands.depth.depthOnlyCommand;
//             command.execute(context, passState);
//             return;
//         }
//     }

//     if (scene.debugShowCommands || scene.debugShowFrustums) {
//         executeDebugCommand(command, scene, passState);
//         return;
//     }

//     if (frameState.shadowState.lightShadowsEnabled && command.receiveShadows && defined(command.derivedCommands.shadows)) {
//         // If the command receives shadows, execute the derived shadows command.
//         // Some commands, such as OIT derived commands, do not have derived shadow commands themselves
//         // and instead shadowing is built-in. In this case execute the command regularly below.
//         command.derivedCommands.shadows.receiveCommand.execute(context, passState);
//     } else {
//         command.execute(context, passState);
//     }
// }

// function backToFront(a, b, position) {
//     return b.boundingVolume.distanceSquaredTo(position) - a.boundingVolume.distanceSquaredTo(position);
// }

// function frontToBack(a, b, position) {
//     // When distances are equal equal favor sorting b before a. This gives render priority to commands later in the list.
//     return a.boundingVolume.distanceSquaredTo(position) - b.boundingVolume.distanceSquaredTo(position) + Cesium.Math.EPSILON12;
// }

// function getPickDepth(scene, index) {
//     var pickDepths = scene._view.pickDepths;
//     var pickDepth = pickDepths[index];
//     if (!Cesium.defined(pickDepth)) {
//         pickDepth = new Cesium.PickDepth();
//         pickDepths[index] = pickDepth;
//     }
//     return pickDepth;
// }
// function executeTranslucentCommandsBackToFront(scene, executeFunction, passState, commands, invertClassification) {
//     var context = scene.context;

//     mergeSort(commands, backToFront, scene.camera.positionWC);

//     if (Cesium.defined(invertClassification)) {
//         executeFunction(invertClassification.unclassifiedCommand, scene, context, passState);
//     }

//     var length = commands.length;
//     for (var i = 0; i < length; ++i) {
//         executeFunction(commands[i], scene, context, passState);
//     }
// }

// function executeTranslucentCommandsFrontToBack(scene, executeFunction, passState, commands, invertClassification) {
//     var context = scene.context;

//     Cesium.mergeSort(commands, frontToBack, scene.camera.positionWC);

//     if (Cesium.defined(invertClassification)) {
//         executeFunction(invertClassification.unclassifiedCommand, scene, context, passState);
//     }

//     var length = commands.length;
//     for (var i = 0; i < length; ++i) {
//         executeFunction(commands[i], scene, context, passState);
//     }
// }
// var scratchPerspectiveFrustum = new Cesium.PerspectiveFrustum();
// var scratchPerspectiveOffCenterFrustum = new Cesium.PerspectiveOffCenterFrustum();
// var scratchOrthographicFrustum = new Cesium.OrthographicFrustum();
// var scratchOrthographicOffCenterFrustum = new Cesium.OrthographicOffCenterFrustum();

// function executeCommands(scene, passState) {
//     var camera = scene.camera;
//     var context = scene.context;
//     var us = context.uniformState;

//     us.updateCamera(camera);

//     // Create a working frustum from the original camera frustum.
//     var frustum;
//     if (Cesium.defined(camera.frustum.fov)) {
//         frustum = camera.frustum.clone(scratchPerspectiveFrustum);
//     } else if (Cesium.defined(camera.frustum.infiniteProjectionMatrix)){
//         frustum = camera.frustum.clone(scratchPerspectiveOffCenterFrustum);
//     } else if (Cesium.defined(camera.frustum.width)) {
//         frustum = camera.frustum.clone(scratchOrthographicFrustum);
//     } else {
//         frustum = camera.frustum.clone(scratchOrthographicOffCenterFrustum);
//     }

//     // Ideally, we would render the sky box and atmosphere last for
//     // early-z, but we would have to draw it in each frustum
//     frustum.near = camera.frustum.near;
//     frustum.far = camera.frustum.far;
//     us.updateFrustum(frustum);
//     us.updatePass(Cesium.Pass.ENVIRONMENT);

//     var passes = scene._frameState.passes;
//     var picking = passes.pick;
//     var environmentState = scene._environmentState;
//     var view = scene._view;
//     var renderTranslucentDepthForPick = environmentState.renderTranslucentDepthForPick;
//     var useWebVR = environmentState.useWebVR;

//     // Do not render environment primitives during a pick pass since they do not generate picking commands.
//     if (!picking) {
//         var skyBoxCommand = environmentState.skyBoxCommand;
//         if (Cesium.defined(skyBoxCommand)) {
//             executeCommand(skyBoxCommand, scene, context, passState);
//         }

//         if (environmentState.isSkyAtmosphereVisible) {
//             executeCommand(environmentState.skyAtmosphereCommand, scene, context, passState);
//         }

//         if (environmentState.isSunVisible) {
//             environmentState.sunDrawCommand.execute(context, passState);
//             if (scene.sunBloom && !useWebVR) {
//                 var framebuffer;
//                 if (environmentState.useGlobeDepthFramebuffer) {
//                     framebuffer = view.globeDepth.framebuffer;
//                 } else if (environmentState.usePostProcess) {
//                     framebuffer = view.sceneFramebuffer.getFramebuffer();
//                 } else {
//                     framebuffer = environmentState.originalFramebuffer;
//                 }
//                 scene._sunPostProcess.execute(context);
//                 scene._sunPostProcess.copy(context, framebuffer);
//                 passState.framebuffer = framebuffer;
//             }
//         }

//         // Moon can be seen through the atmosphere, since the sun is rendered after the atmosphere.
//         if (environmentState.isMoonVisible) {
//             environmentState.moonCommand.execute(context, passState);
//         }
//     }

//     // Determine how translucent surfaces will be handled.
//     var executeTranslucentCommands;
//     if (environmentState.useOIT) {
//         if (!Cesium.defined(scene._executeOITFunction)) {
//             scene._executeOITFunction = function(scene, executeFunction, passState, commands, invertClassification) {
//                 view.oit.executeCommands(scene, executeFunction, passState, commands, invertClassification);
//             };
//         }
//         executeTranslucentCommands = scene._executeOITFunction;
//     } else if (passes.render) {
//         executeTranslucentCommands = executeTranslucentCommandsBackToFront;
//     } else {
//         executeTranslucentCommands = executeTranslucentCommandsFrontToBack;
//     }

//     var clearGlobeDepth = environmentState.clearGlobeDepth;
//     var useDepthPlane = environmentState.useDepthPlane;
//     var clearDepth = scene._depthClearCommand;
//     var clearStencil = scene._stencilClearCommand;
//     var depthPlane = scene._depthPlane;
//     var usePostProcessSelected = environmentState.usePostProcessSelected;

//     var height2D = camera.position.z;

//     // Execute commands in each frustum in back to front order
//     var j;
//     var frustumCommandsList = view.frustumCommandsList;
//     var numFrustums = frustumCommandsList.length;

//     for (var i = 0; i < numFrustums; ++i) {
//         var index = numFrustums - i - 1;
//         var frustumCommands = frustumCommandsList[index];

//         if (scene.mode === Cesium.SceneMode.SCENE2D) {
//             // To avoid z-fighting in 2D, move the camera to just before the frustum
//             // and scale the frustum depth to be in [1.0, nearToFarDistance2D].
//             camera.position.z = height2D - frustumCommands.near + 1.0;
//             frustum.far = Math.max(1.0, frustumCommands.far - frustumCommands.near);
//             frustum.near = 1.0;
//             us.update(scene.frameState);
//             us.updateFrustum(frustum);
//         } else {
//             // Avoid tearing artifacts between adjacent frustums in the opaque passes
//             frustum.near = index !== 0 ? frustumCommands.near * scene.opaqueFrustumNearOffset : frustumCommands.near;
//             frustum.far = frustumCommands.far;
//             us.updateFrustum(frustum);
//         }

//         var globeDepth = scene.debugShowGlobeDepth ? getDebugGlobeDepth(scene, index) : view.globeDepth;

//         var fb;
//         if (scene.debugShowGlobeDepth && Cesium.defined(globeDepth) && environmentState.useGlobeDepthFramebuffer) {
//             globeDepth.update(context, passState, view.viewport);
//             globeDepth.clear(context, passState, scene._clearColorCommand.color);
//             fb = passState.framebuffer;
//             passState.framebuffer = globeDepth.framebuffer;
//         }

//         clearDepth.execute(context, passState);

//         if (context.stencilBuffer) {
//             clearStencil.execute(context, passState);
//         }

//         us.updatePass(Cesium.Pass.GLOBE);
//         var commands = frustumCommands.commands[Cesium.Pass.GLOBE];
//         var length = frustumCommands.indices[Cesium.Pass.GLOBE];
//         for (j = 0; j < length; ++j) {
//             executeCommand(commands[j], scene, context, passState);
//         }

//         if (Cesium.defined(globeDepth) && environmentState.useGlobeDepthFramebuffer) {
//             globeDepth.update(context, passState, view.viewport);
//             globeDepth.executeCopyDepth(context, passState);
//         }

//         if (scene.debugShowGlobeDepth && Cesium.defined(globeDepth) && environmentState.useGlobeDepthFramebuffer) {
//             passState.framebuffer = fb;
//         }

//         // Draw terrain classification
//         us.updatePass(Cesium.Pass.TERRAIN_CLASSIFICATION);
//         commands = frustumCommands.commands[Cesium.Pass.TERRAIN_CLASSIFICATION];
//         length = frustumCommands.indices[Cesium.Pass.TERRAIN_CLASSIFICATION];
//         for (j = 0; j < length; ++j) {
//             executeCommand(commands[j], scene, context, passState);
//         }

//         // Draw classification marked for both terrain and 3D Tiles classification
//         us.updatePass(Cesium.Pass.CLASSIFICATION);
//         commands = frustumCommands.commands[Cesium.Pass.CLASSIFICATION];
//         length = frustumCommands.indices[Cesium.Pass.CLASSIFICATION];
//         for (j = 0; j < length; ++j) {
//             executeCommand(commands[j], scene, context, passState);
//         }

//         if (clearGlobeDepth) {
//             clearDepth.execute(context, passState);
//         }

//         if (!environmentState.useInvertClassification || picking) {
//             // Common/fastest path. Draw 3D Tiles and classification normally.

//             // Draw 3D Tiles
//             us.updatePass(Cesium.Pass.CESIUM_3D_TILE);
//             commands = frustumCommands.commands[Cesium.Pass.CESIUM_3D_TILE];
//             length = frustumCommands.indices[Cesium.Pass.CESIUM_3D_TILE];
//             for (j = 0; j < length; ++j) {
//                 executeCommand(commands[j], scene, context, passState);
//             }

//             // Draw classifications. Modifies 3D Tiles color.
//             us.updatePass(Cesium.Pass.CESIUM_3D_TILE_CLASSIFICATION);
//             commands = frustumCommands.commands[Cesium.Pass.CESIUM_3D_TILE_CLASSIFICATION];
//             length = frustumCommands.indices[Cesium.Pass.CESIUM_3D_TILE_CLASSIFICATION];
//             for (j = 0; j < length; ++j) {
//                 executeCommand(commands[j], scene, context, passState);
//             }

//             // Draw classification marked for both terrain and 3D Tiles classification
//             us.updatePass(Cesium.Pass.CLASSIFICATION);
//             commands = frustumCommands.commands[Cesium.Pass.CLASSIFICATION];
//             length = frustumCommands.indices[Cesium.Pass.CLASSIFICATION];
//             for (j = 0; j < length; ++j) {
//                 executeCommand(commands[j], scene, context, passState);
//             }
//         } else {
//             // When the invert classification color is opaque:
//             //    Main FBO (FBO1):                   Main_Color   + Main_DepthStencil
//             //    Invert classification FBO (FBO2) : Invert_Color + Main_DepthStencil
//             //
//             //    1. Clear FBO2 color to vec4(0.0) for each frustum
//             //    2. Draw 3D Tiles to FBO2
//             //    3. Draw classification to FBO2
//             //    4. Fullscreen pass to FBO1, draw Invert_Color when:
//             //           * Main_DepthStencil has the stencil bit set > 0 (classified)
//             //    5. Fullscreen pass to FBO1, draw Invert_Color * czm_invertClassificationColor when:
//             //           * Main_DepthStencil has stencil bit set to 0 (unclassified) and
//             //           * Invert_Color !== vec4(0.0)
//             //
//             // When the invert classification color is translucent:
//             //    Main FBO (FBO1):                  Main_Color         + Main_DepthStencil
//             //    Invert classification FBO (FBO2): Invert_Color       + Invert_DepthStencil
//             //    IsClassified FBO (FBO3):          IsClassified_Color + Invert_DepthStencil
//             //
//             //    1. Clear FBO2 and FBO3 color to vec4(0.0), stencil to 0, and depth to 1.0
//             //    2. Draw 3D Tiles to FBO2
//             //    3. Draw classification to FBO2
//             //    4. Fullscreen pass to FBO3, draw any color when
//             //           * Invert_DepthStencil has the stencil bit set > 0 (classified)
//             //    5. Fullscreen pass to FBO1, draw Invert_Color when:
//             //           * Invert_Color !== vec4(0.0) and
//             //           * IsClassified_Color !== vec4(0.0)
//             //    6. Fullscreen pass to FBO1, draw Invert_Color * czm_invertClassificationColor when:
//             //           * Invert_Color !== vec4(0.0) and
//             //           * IsClassified_Color === vec4(0.0)
//             //
//             // NOTE: Step six when translucent invert color occurs after the TRANSLUCENT pass
//             //
//             scene._invertClassification.clear(context, passState);

//             var opaqueClassificationFramebuffer = passState.framebuffer;
//             passState.framebuffer = scene._invertClassification._fbo;

//             // Draw normally
//             us.updatePass(Cesium.Pass.CESIUM_3D_TILE);
//             commands = frustumCommands.commands[Cesium.Pass.CESIUM_3D_TILE];
//             length = frustumCommands.indices[Cesium.Pass.CESIUM_3D_TILE];
//             for (j = 0; j < length; ++j) {
//                 executeCommand(commands[j], scene, context, passState);
//             }

//             // Set stencil
//             us.updatePass(Cesium.Pass.CESIUM_3D_TILE_CLASSIFICATION_IGNORE_SHOW);
//             commands = frustumCommands.commands[Cesium.Pass.CESIUM_3D_TILE_CLASSIFICATION_IGNORE_SHOW];
//             length = frustumCommands.indices[Cesium.Pass.CESIUM_3D_TILE_CLASSIFICATION_IGNORE_SHOW];
//             for (j = 0; j < length; ++j) {
//                 executeCommand(commands[j], scene, context, passState);
//             }

//             passState.framebuffer = opaqueClassificationFramebuffer;

//             // Fullscreen pass to copy classified fragments
//             scene._invertClassification.executeClassified(context, passState);
//             if (scene.frameState.invertClassificationColor.alpha === 1.0) {
//                 // Fullscreen pass to copy unclassified fragments when alpha == 1.0
//                 scene._invertClassification.executeUnclassified(context, passState);
//             }

//             // Clear stencil set by the classification for the next classification pass
//             if (length > 0 && context.stencilBuffer) {
//                 clearStencil.execute(context, passState);
//             }

//             // Draw style over classification.
//             us.updatePass(Cesium.Pass.CESIUM_3D_TILE_CLASSIFICATION);
//             commands = frustumCommands.commands[Cesium.Pass.CESIUM_3D_TILE_CLASSIFICATION];
//             length = frustumCommands.indices[Cesium.Pass.CESIUM_3D_TILE_CLASSIFICATION];
//             for (j = 0; j < length; ++j) {
//                 executeCommand(commands[j], scene, context, passState);
//             }

//             // Draw style over classification marked for both terrain and 3D Tiles classification
//             us.updatePass(Cesium.Pass.CLASSIFICATION);
//             commands = frustumCommands.commands[Cesium.Pass.CLASSIFICATION];
//             length = frustumCommands.indices[Cesium.Pass.CLASSIFICATION];
//             for (j = 0; j < length; ++j) {
//                 executeCommand(commands[j], scene, context, passState);
//             }
//         }

//         if (length > 0 && context.stencilBuffer) {
//             clearStencil.execute(context, passState);
//         }

//         if (clearGlobeDepth && useDepthPlane) {
//             depthPlane.execute(context, passState);
//         }

//         us.updatePass(Cesium.Pass.OPAQUE);
//         commands = frustumCommands.commands[Cesium.Pass.OPAQUE];
//         length = frustumCommands.indices[Cesium.Pass.OPAQUE];
//         for (j = 0; j < length; ++j) {
//             executeCommand(commands[j], scene, context, passState);
//         }

//         if (index !== 0 && scene.mode !== Cesium.SceneMode.SCENE2D) {
//             // Do not overlap frustums in the translucent pass to avoid blending artifacts
//             frustum.near = frustumCommands.near;
//             us.updateFrustum(frustum);
//         }

//         var invertClassification;
//         if (!picking && environmentState.useInvertClassification && scene.frameState.invertClassificationColor.alpha < 1.0) {
//             // Fullscreen pass to copy unclassified fragments when alpha < 1.0.
//             // Not executed when undefined.
//             invertClassification = scene._invertClassification;
//         }

//         us.updatePass(Cesium.Pass.TRANSLUCENT);
//         commands = frustumCommands.commands[Cesium.Pass.TRANSLUCENT];
//         commands.length = frustumCommands.indices[Cesium.Pass.TRANSLUCENT];
//         executeTranslucentCommands(scene, executeCommand, passState, commands, invertClassification);

//         if (context.depthTexture && scene.useDepthPicking && (environmentState.useGlobeDepthFramebuffer || renderTranslucentDepthForPick)) {
//             // PERFORMANCE_IDEA: Use MRT to avoid the extra copy.
//             var depthStencilTexture = renderTranslucentDepthForPick ? passState.framebuffer.depthStencilTexture : globeDepth.framebuffer.depthStencilTexture;
//             var pickDepth = getPickDepth(scene, index);
//             pickDepth.update(context, depthStencilTexture);
//             pickDepth.executeCopyDepth(context, passState);
//         }

//         if (picking || !usePostProcessSelected) {
//             continue;
//         }

//         var originalFramebuffer = passState.framebuffer;
//         passState.framebuffer = view.sceneFramebuffer.getIdFramebuffer();

//         // reset frustum
//         frustum.near = index !== 0 ? frustumCommands.near * scene.opaqueFrustumNearOffset : frustumCommands.near;
//         frustum.far = frustumCommands.far;
//         us.updateFrustum(frustum);

//         us.updatePass(Cesium.Pass.GLOBE);
//         commands = frustumCommands.commands[Cesium.Pass.GLOBE];
//         length = frustumCommands.indices[Cesium.Pass.GLOBE];
//         for (j = 0; j < length; ++j) {
//             executeIdCommand(commands[j], scene, context, passState);
//         }

//         if (clearGlobeDepth) {
//             clearDepth.framebuffer = passState.framebuffer;
//             clearDepth.execute(context, passState);
//             clearDepth.framebuffer = undefined;
//         }

//         if (clearGlobeDepth && useDepthPlane) {
//             depthPlane.execute(context, passState);
//         }

//         us.updatePass(Cesium.Pass.CESIUM_3D_TILE);
//         commands = frustumCommands.commands[Cesium.Pass.CESIUM_3D_TILE];
//         length = frustumCommands.indices[Cesium.Pass.CESIUM_3D_TILE];
//         for (j = 0; j < length; ++j) {
//             executeIdCommand(commands[j], scene, context, passState);
//         }

//         us.updatePass(Cesium.Pass.OPAQUE);
//         commands = frustumCommands.commands[Cesium.Pass.OPAQUE];
//         length = frustumCommands.indices[Cesium.Pass.OPAQUE];
//         for (j = 0; j < length; ++j) {
//             executeIdCommand(commands[j], scene, context, passState);
//         }

//         us.updatePass(Cesium.Pass.TRANSLUCENT);
//         commands = frustumCommands.commands[Cesium.Pass.TRANSLUCENT];
//         length = frustumCommands.indices[Cesium.Pass.TRANSLUCENT];
//         for (j = 0; j < length; ++j) {
//             executeIdCommand(commands[j], scene, context, passState);
//         }

//         passState.framebuffer = originalFramebuffer;
//     }
// }
// function executeComputeCommands(scene) {
//     var us = scene.context.uniformState;
//     us.updatePass(Cesium.Pass.COMPUTE);

//     var sunComputeCommand = scene._environmentState.sunComputeCommand;
//     if (Cesium.defined(sunComputeCommand)) {
//         sunComputeCommand.execute(scene._computeEngine);
//     }

//     var commandList = scene._computeCommandList;
//     var length = commandList.length;
//     for (var i = 0; i < length; ++i) {
//         commandList[i].execute(scene._computeEngine);
//     }
// }
// function updateShadowMaps(scene) {
//     var frameState = scene._frameState;
//     var shadowMaps = frameState.shadowMaps;
//     var length = shadowMaps.length;

//     var shadowsEnabled = (length > 0) && !frameState.passes.pick && (scene.mode === SceneMode.SCENE3D);
//     if (shadowsEnabled !== frameState.shadowState.shadowsEnabled) {
//         // Update derived commands when shadowsEnabled changes
//         ++frameState.shadowState.lastDirtyTime;
//         frameState.shadowState.shadowsEnabled = shadowsEnabled;
//     }

//     frameState.shadowState.lightShadowsEnabled = false;

//     if (!shadowsEnabled) {
//         return;
//     }

//     // Check if the shadow maps are different than the shadow maps last frame.
//     // If so, the derived commands need to be updated.
//     for (var j = 0; j < length; ++j) {
//         if (shadowMaps[j] !== frameState.shadowState.shadowMaps[j]) {
//             ++frameState.shadowState.lastDirtyTime;
//             break;
//         }
//     }

//     frameState.shadowState.shadowMaps.length = 0;
//     frameState.shadowState.lightShadowMaps.length = 0;

//     for (var i = 0; i < length; ++i) {
//         var shadowMap = shadowMaps[i];
//         shadowMap.update(frameState);

//         frameState.shadowState.shadowMaps.push(shadowMap);

//         if (shadowMap.fromLightSource) {
//             frameState.shadowState.lightShadowMaps.push(shadowMap);
//             frameState.shadowState.lightShadowsEnabled = true;
//         }

//         if (shadowMap.dirty) {
//             ++frameState.shadowState.lastDirtyTime;
//             shadowMap.dirty = false;
//         }
//     }
// }
// function updateAndRenderPrimitives(scene) {
//     var frameState = scene._frameState;

//     scene._groundPrimitives.update(frameState);
//     scene._primitives.update(frameState);

//     updateDebugFrustumPlanes(scene);
//     updateShadowMaps(scene);

//     if (scene._globe) {
//         scene._globe.render(frameState);
//     }
// }

// var scratch2DViewportCartographic = new Cesium.Cartographic(Cesium.Math.PI, Cesium.Math.PI_OVER_TWO);
// var scratch2DViewportMaxCoord = new Cesium.Cartesian3();
// var scratch2DViewportSavedPosition = new Cesium.Cartesian3();
// var scratch2DViewportTransform = new Cesium.Matrix4();
// var scratch2DViewportCameraTransform = new Cesium.Matrix4();
// var scratch2DViewportEyePoint = new Cesium.Cartesian3();
// var scratch2DViewportWindowCoords = new Cesium.Cartesian3();
// var scratch2DViewport = new Cesium.BoundingRectangle();

// function execute2DViewportCommands(scene, passState) {
//     var context = scene.context;
//     var frameState = scene.frameState;
//     var camera = scene.camera;

//     var originalViewport = passState.viewport;
//     var viewport = Cesium.BoundingRectangle.clone(originalViewport, scratch2DViewport);
//     passState.viewport = viewport;

//     var maxCartographic = scratch2DViewportCartographic;
//     var maxCoord = scratch2DViewportMaxCoord;

//     var projection = scene.mapProjection;
//     projection.project(maxCartographic, maxCoord);

//     var position = Cesium.Cartesian3.clone(camera.position, scratch2DViewportSavedPosition);
//     var transform =Cesium. Matrix4.clone(camera.transform, scratch2DViewportCameraTransform);
//     var frustum = camera.frustum.clone();

//     camera._setTransform(Cesium.Matrix4.IDENTITY);

//     var viewportTransformation = Cesium.Matrix4.computeViewportTransformation(viewport, 0.0, 1.0, scratch2DViewportTransform);
//     var projectionMatrix = camera.frustum.projectionMatrix;

//     var x = camera.positionWC.y;
//     var eyePoint = Cesium.Cartesian3.fromElements(Cesium.Math.sign(x) * maxCoord.x - x, 0.0, -camera.positionWC.x, scratch2DViewportEyePoint);
//     var windowCoordinates = Cesium.Transforms.pointToGLWindowCoordinates(projectionMatrix, viewportTransformation, eyePoint, scratch2DViewportWindowCoords);

//     windowCoordinates.x = Math.floor(windowCoordinates.x);

//     var viewportX = viewport.x;
//     var viewportWidth = viewport.width;

//     if (x === 0.0 || windowCoordinates.x <= viewportX  || windowCoordinates.x >= viewportX + viewportWidth) {
//         executeCommandsInViewport(true, scene, passState);
//     } else if (Math.abs(viewportX + viewportWidth * 0.5 - windowCoordinates.x) < 1.0) {
//         viewport.width = windowCoordinates.x - viewport.x;

//         camera.position.x *= Cesium.Math.sign(camera.position.x);

//         camera.frustum.right = 0.0;

//         frameState.cullingVolume = camera.frustum.computeCullingVolume(camera.positionWC, camera.directionWC, camera.upWC);
//         context.uniformState.update(frameState);

//         executeCommandsInViewport(true, scene, passState);

//         viewport.x = windowCoordinates.x;

//         camera.position.x = -camera.position.x;

//         camera.frustum.right = -camera.frustum.left;
//         camera.frustum.left = 0.0;

//         frameState.cullingVolume = camera.frustum.computeCullingVolume(camera.positionWC, camera.directionWC, camera.upWC);
//         context.uniformState.update(frameState);

//         executeCommandsInViewport(false, scene, passState);
//     } else if (windowCoordinates.x > viewportX + viewportWidth * 0.5) {
//         viewport.width = windowCoordinates.x - viewportX;

//         var right = camera.frustum.right;
//         camera.frustum.right = maxCoord.x - x;

//         frameState.cullingVolume = camera.frustum.computeCullingVolume(camera.positionWC, camera.directionWC, camera.upWC);
//         context.uniformState.update(frameState);

//         executeCommandsInViewport(true, scene, passState);

//         viewport.x = windowCoordinates.x;
//         viewport.width = viewportX + viewportWidth - windowCoordinates.x;

//         camera.position.x = -camera.position.x;

//         camera.frustum.left = -camera.frustum.right;
//         camera.frustum.right = right - camera.frustum.right * 2.0;

//         frameState.cullingVolume = camera.frustum.computeCullingVolume(camera.positionWC, camera.directionWC, camera.upWC);
//         context.uniformState.update(frameState);

//         executeCommandsInViewport(false, scene, passState);
//     } else {
//         viewport.x = windowCoordinates.x;
//         viewport.width = viewportX + viewportWidth - windowCoordinates.x;

//         var left = camera.frustum.left;
//         camera.frustum.left = -maxCoord.x - x;

//         frameState.cullingVolume = camera.frustum.computeCullingVolume(camera.positionWC, camera.directionWC, camera.upWC);
//         context.uniformState.update(frameState);

//         executeCommandsInViewport(true, scene, passState);

//         viewport.x = viewportX;
//         viewport.width = windowCoordinates.x - viewportX;

//         camera.position.x = -camera.position.x;

//         camera.frustum.right = -camera.frustum.left;
//         camera.frustum.left = left - camera.frustum.left * 2.0;

//         frameState.cullingVolume = camera.frustum.computeCullingVolume(camera.positionWC, camera.directionWC, camera.upWC);
//         context.uniformState.update(frameState);

//         executeCommandsInViewport(false, scene, passState);
//     }

//     camera._setTransform(transform);
//     Cesium.Cartesian3.clone(position, camera.position);
//     camera.frustum = frustum.clone();
//     passState.viewport = originalViewport;
// }


// function executeCommandsInViewport(firstViewport, scene, passState, backgroundColor) {
//     var environmentState = scene._environmentState;
//     var view = scene._view;
//     var renderTranslucentDepthForPick = environmentState.renderTranslucentDepthForPick;

//     if (!firstViewport && !renderTranslucentDepthForPick) {
//         scene.frameState.commandList.length = 0;
//     }

//     if (!renderTranslucentDepthForPick) {
//         updateAndRenderPrimitives(scene);
//     }

//     view.createPotentiallyVisibleSet(scene);

//     if (firstViewport) {
//         if (defined(backgroundColor)) {
//             updateAndClearFramebuffers(scene, passState, backgroundColor);
//         }
//         if (!renderTranslucentDepthForPick) {
//             executeComputeCommands(scene);
//             executeShadowMapCastCommands(scene);
//         }
//     }

//     executeCommands(scene, passState);
// }

// function updateAndClearFramebuffers(scene, passState, clearColor) {
//     var context = scene._context;
//     var frameState = scene._frameState;
//     var environmentState = scene._environmentState;
//     var view = scene._view;

//     var passes = scene._frameState.passes;
//     var picking = passes.pick;
//     var useWebVR = environmentState.useWebVR;

//     // Preserve the reference to the original framebuffer.
//     environmentState.originalFramebuffer = passState.framebuffer;

//     // Manage sun bloom post-processing effect.
//     if (Cesium.defined(scene.sun) && scene.sunBloom !== scene._sunBloom) {
//         if (scene.sunBloom && !useWebVR) {
//             scene._sunPostProcess = new SunPostProcess();
//         } else if(Cesium.defined(scene._sunPostProcess)){
//             scene._sunPostProcess = scene._sunPostProcess.destroy();
//         }

//         scene._sunBloom = scene.sunBloom;
//     } else if (!Cesium.defined(scene.sun) && Cesium.defined(scene._sunPostProcess)) {
//         scene._sunPostProcess = scene._sunPostProcess.destroy();
//         scene._sunBloom = false;
//     }

//     // Clear the pass state framebuffer.
//     var clear = scene._clearColorCommand;
//     Color.clone(clearColor, clear.color);
//     clear.execute(context, passState);

//     // Update globe depth rendering based on the current context and clear the globe depth framebuffer.
//     // Globe depth is copied for the pick pass to support picking batched geometries in GroundPrimitives.
//     var useGlobeDepthFramebuffer = environmentState.useGlobeDepthFramebuffer = Cesium.defined(view.globeDepth);
//     if (useGlobeDepthFramebuffer) {
//         view.globeDepth.update(context, passState, view.viewport);
//         view.globeDepth.clear(context, passState, clearColor);
//     }

//     // If supported, configure OIT to use the globe depth framebuffer and clear the OIT framebuffer.
//     var oit = view.oit;
//     var useOIT = environmentState.useOIT = !picking && Cesium.defined(oit) && oit.isSupported();
//     if (useOIT) {
//         oit.update(context, passState, view.globeDepth.framebuffer);
//         oit.clear(context, passState, clearColor);
//         environmentState.useOIT = oit.isSupported();
//     }

//     var postProcess = scene.postProcessStages;
//     var usePostProcess = environmentState.usePostProcess = !picking && (postProcess.length > 0 ||
//          postProcess.ambientOcclusion.enabled || postProcess.fxaa.enabled || postProcess.bloom.enabled);
//     environmentState.usePostProcessSelected = false;
//     if (usePostProcess) {
//         view.sceneFramebuffer.update(context, view.viewport);
//         view.sceneFramebuffer.clear(context, passState, clearColor);

//         postProcess.update(context, frameState.useLogDepth);
//         postProcess.clear(context);

//         usePostProcess = environmentState.usePostProcess = postProcess.ready;
//         environmentState.usePostProcessSelected = usePostProcess && postProcess.hasSelected;
//     }

//     if (environmentState.isSunVisible && scene.sunBloom && !useWebVR) {
//         passState.framebuffer = scene._sunPostProcess.update(passState);
//         scene._sunPostProcess.clear(context, passState, clearColor);
//     } else if (useGlobeDepthFramebuffer) {
//         passState.framebuffer = view.globeDepth.framebuffer;
//     } else if (usePostProcess) {
//         passState.framebuffer = view.sceneFramebuffer.getFramebuffer();
//     }

//     if (Cesium.defined(passState.framebuffer)) {
//         clear.execute(context, passState);
//     }

//     var useInvertClassification = environmentState.useInvertClassification = !picking && Cesium.defined(passState.framebuffer) && scene.invertClassification;
//     if (useInvertClassification) {
//         var depthFramebuffer;
//         if (scene.frameState.invertClassificationColor.alpha === 1.0) {
//             if (environmentState.useGlobeDepthFramebuffer) {
//                 depthFramebuffer = view.globeDepth.framebuffer;
//             }
//         }

//         if (Cesium.defined(depthFramebuffer) || context.depthTexture) {
//             scene._invertClassification.previousFramebuffer = depthFramebuffer;
//             scene._invertClassification.update(context);
//             scene._invertClassification.clear(context, passState);

//             if (scene.frameState.invertClassificationColor.alpha < 1.0 && useOIT) {
//                 var command = scene._invertClassification.unclassifiedCommand;
//                 var derivedCommands = command.derivedCommands;
//                 derivedCommands.oit = oit.createDerivedCommands(command, context, derivedCommands.oit);
//             }
//         } else {
//             environmentState.useInvertClassification = false;
//         }
//     }
// }
// function updateAndClearFramebuffers(scene, passState, clearColor) {
//     var context = scene._context;
//     var frameState = scene._frameState;
//     var environmentState = scene._environmentState;
//     var view = scene._view;

//     var passes = scene._frameState.passes;
//     var picking = passes.pick;
//     var useWebVR = environmentState.useWebVR;

//     // Preserve the reference to the original framebuffer.
//     environmentState.originalFramebuffer = passState.framebuffer;

//     // Manage sun bloom post-processing effect.
//     if (Cesium.defined(scene.sun) && scene.sunBloom !== scene._sunBloom) {
//         if (scene.sunBloom && !useWebVR) {
//             scene._sunPostProcess = new SunPostProcess();
//         } else if(Cesium.defined(scene._sunPostProcess)){
//             scene._sunPostProcess = scene._sunPostProcess.destroy();
//         }

//         scene._sunBloom = scene.sunBloom;
//     } else if (!Cesium.defined(scene.sun) && Cesium.defined(scene._sunPostProcess)) {
//         scene._sunPostProcess = scene._sunPostProcess.destroy();
//         scene._sunBloom = false;
//     }

//     // Clear the pass state framebuffer.
//     var clear = scene._clearColorCommand;
//     Cesium.Color.clone(clearColor, clear.color);
//     clear.execute(context, passState);

//     // Update globe depth rendering based on the current context and clear the globe depth framebuffer.
//     // Globe depth is copied for the pick pass to support picking batched geometries in GroundPrimitives.
//     var useGlobeDepthFramebuffer = environmentState.useGlobeDepthFramebuffer = Cesium.defined(view.globeDepth);
//     if (useGlobeDepthFramebuffer) {
//         view.globeDepth.update(context, passState, view.viewport);
//         view.globeDepth.clear(context, passState, clearColor);
//     }

//     // If supported, configure OIT to use the globe depth framebuffer and clear the OIT framebuffer.
//     var oit = view.oit;
//     var useOIT = environmentState.useOIT = !picking && Cesium.defined(oit) && oit.isSupported();
//     if (useOIT) {
//         oit.update(context, passState, view.globeDepth.framebuffer);
//         oit.clear(context, passState, clearColor);
//         environmentState.useOIT = oit.isSupported();
//     }

//     var postProcess = scene.postProcessStages;
//     var usePostProcess = environmentState.usePostProcess = !picking && (postProcess.length > 0 ||
//          postProcess.ambientOcclusion.enabled || postProcess.fxaa.enabled || postProcess.bloom.enabled);
//     environmentState.usePostProcessSelected = false;
//     if (usePostProcess) {
//         view.sceneFramebuffer.update(context, view.viewport);
//         view.sceneFramebuffer.clear(context, passState, clearColor);

//         postProcess.update(context, frameState.useLogDepth);
//         postProcess.clear(context);

//         usePostProcess = environmentState.usePostProcess = postProcess.ready;
//         environmentState.usePostProcessSelected = usePostProcess && postProcess.hasSelected;
//     }

//     if (environmentState.isSunVisible && scene.sunBloom && !useWebVR) {
//         passState.framebuffer = scene._sunPostProcess.update(passState);
//         scene._sunPostProcess.clear(context, passState, clearColor);
//     } else if (useGlobeDepthFramebuffer) {
//         passState.framebuffer = view.globeDepth.framebuffer;
//     } else if (usePostProcess) {
//         passState.framebuffer = view.sceneFramebuffer.getFramebuffer();
//     }

//     if (Cesium.defined(passState.framebuffer)) {
//         clear.execute(context, passState);
//     }

//     var useInvertClassification = environmentState.useInvertClassification = !picking && Cesium.defined(passState.framebuffer) && scene.invertClassification;
//     if (useInvertClassification) {
//         var depthFramebuffer;
//         if (scene.frameState.invertClassificationColor.alpha === 1.0) {
//             if (environmentState.useGlobeDepthFramebuffer) {
//                 depthFramebuffer = view.globeDepth.framebuffer;
//             }
//         }

//         if (Cesium.defined(depthFramebuffer) || context.depthTexture) {
//             scene._invertClassification.previousFramebuffer = depthFramebuffer;
//             scene._invertClassification.update(context);
//             scene._invertClassification.clear(context, passState);

//             if (scene.frameState.invertClassificationColor.alpha < 1.0 && useOIT) {
//                 var command = scene._invertClassification.unclassifiedCommand;
//                 var derivedCommands = command.derivedCommands;
//                 derivedCommands.oit = oit.createDerivedCommands(command, context, derivedCommands.oit);
//             }
//         } else {
//             environmentState.useInvertClassification = false;
//         }
//     }
// }
// var scratchEyeTranslation = new Cesium.Cartesian3();

// function updateAndExecuteCommands(scene, passState, backgroundColor) {
//     // var frameState = scene._frameState;
//     // var mode = frameState.mode;
//     // var useWebVR = scene._environmentState.useWebVR;

//     // if (useWebVR) {
//     //     executeWebVRCommands(scene, passState, backgroundColor);
//     // } else if (mode !== SceneMode.SCENE2D || scene._mapMode2D === MapMode2D.ROTATE) {
//     //     executeCommandsInViewport(true, scene, passState, backgroundColor);
//     // } else {
//         updateAndClearFramebuffers(scene, passState, backgroundColor);
//         execute2DViewportCommands(scene, passState);
//     // }
// }

// var scratchCullingVolume = new Cesium.CullingVolume();
// function updateEnvironment(scene) {
//     var frameState = scene._frameState;
//     var view = scene._view;

//     // Update celestial and terrestrial environment effects.
//     var environmentState = scene._environmentState;
//     var renderPass = frameState.passes.render;
//     var offscreenPass = frameState.passes.offscreen;
//     var skyAtmosphere = scene.skyAtmosphere;
//     var globe = scene.globe;

//     if (!renderPass || (scene._mode !==  Cesium.SceneMode.SCENE2D && view.camera.frustum instanceof  Cesium.OrthographicFrustum)) {
//         environmentState.skyAtmosphereCommand = undefined;
//         environmentState.skyBoxCommand = undefined;
//         environmentState.sunDrawCommand = undefined;
//         environmentState.sunComputeCommand = undefined;
//         environmentState.moonCommand = undefined;
//     } else {
//         if ( Cesium.defined(skyAtmosphere) &&  Cesium.defined(globe)) {
//             skyAtmosphere.setDynamicAtmosphereColor(globe.enableLighting);
//             environmentState.isReadyForAtmosphere = environmentState.isReadyForAtmosphere || globe._surface._tilesToRender.length > 0;
//         }
//         environmentState.skyAtmosphereCommand =  Cesium.defined(skyAtmosphere) ? skyAtmosphere.update(frameState) : undefined;
//         environmentState.skyBoxCommand =  Cesium.defined(scene.skyBox) ? scene.skyBox.update(frameState) : undefined;
//         var sunCommands =  Cesium.defined(scene.sun) ? scene.sun.update(frameState, view.passState) : undefined;
//         environmentState.sunDrawCommand =  Cesium.defined(sunCommands) ? sunCommands.drawCommand : undefined;
//         environmentState.sunComputeCommand =  Cesium.defined(sunCommands) ? sunCommands.computeCommand : undefined;
//         environmentState.moonCommand = Cesium. defined(scene.moon) ? scene.moon.update(frameState) : undefined;
//     }

//     var clearGlobeDepth = environmentState.clearGlobeDepth =  Cesium.defined(globe) && (!globe.depthTestAgainstTerrain || scene.mode ===  Cesium.SceneMode.SCENE2D);
//     var useDepthPlane = environmentState.useDepthPlane = clearGlobeDepth && scene.mode ===  Cesium.SceneMode.SCENE3D;
//     if (useDepthPlane) {
//         // Update the depth plane that is rendered in 3D when the primitives are
//         // not depth tested against terrain so primitives on the backface
//         // of the globe are not picked.
//         scene._depthPlane.update(frameState);
//     }

//     environmentState.renderTranslucentDepthForPick = false;
//     environmentState.useWebVR = scene._useWebVR && scene.mode !== Cesium.SceneMode.SCENE2D  && !offscreenPass;

//     var occluder = (frameState.mode ===  Cesium.SceneMode.SCENE3D) ? frameState.occluder: undefined;
//     var cullingVolume = frameState.cullingVolume;

//     // get user culling volume minus the far plane.
//     var planes = scratchCullingVolume.planes;
//     for (var k = 0; k < 5; ++k) {
//         planes[k] = cullingVolume.planes[k];
//     }
//     cullingVolume = scratchCullingVolume;

//     // Determine visibility of celestial and terrestrial environment effects.
//     environmentState.isSkyAtmosphereVisible = Cesium.defined(environmentState.skyAtmosphereCommand) && environmentState.isReadyForAtmosphere;
//     environmentState.isSunVisible = scene.isVisible(environmentState.sunDrawCommand, cullingVolume, occluder);
//     environmentState.isMoonVisible = scene.isVisible(environmentState.moonCommand, cullingVolume, occluder);
// }

// var scratchOccluderBoundingSphere = new Cesium.BoundingSphere();
// var scratchOccluder;

// function getOccluder(scene) {
//     // TODO: The occluder is the top-level globe. When we add
//     //       support for multiple central bodies, this should be the closest one.
//     var globe = scene.globe;
//     if (scene._mode === Cesium.SceneMode.SCENE3D && Cesium.defined(globe) && globe.show) {
//         var ellipsoid = globe.ellipsoid;
//         scratchOccluderBoundingSphere.radius = ellipsoid.minimumRadius;
//         scratchOccluder = Cesium.Occluder.fromBoundingSphere(scratchOccluderBoundingSphere, scene.camera.positionWC, scratchOccluder);
//         return scratchOccluder;
//     }

//     return undefined;
// }

// function clearPasses(passes) {
//     passes.render = false;
//     passes.pick = false;
//     passes.depth = false;
//     passes.postProcess = false;
//     passes.offscreen = false;
// }

// function updateFrameState(scene, frameNumber, time) {
//     var camera = scene.camera;

//     var frameState = scene._frameState;
//     frameState.commandList.length = 0;
//     frameState.shadowMaps.length = 0;
//     frameState.brdfLutGenerator = scene._brdfLutGenerator;
//     frameState.environmentMap = scene.skyBox && scene.skyBox._cubeMap;
//     frameState.mode = scene._mode;
//     frameState.morphTime = scene.morphTime;
//     frameState.mapProjection = scene.mapProjection;
//     frameState.frameNumber = frameNumber;
//     frameState.time = Cesium.JulianDate.clone(time, frameState.time);
//     frameState.camera = camera;
//     frameState.cullingVolume = camera.frustum.computeCullingVolume(camera.positionWC, camera.directionWC, camera.upWC);
//     frameState.occluder = getOccluder(scene);
//     frameState.terrainExaggeration = scene._terrainExaggeration;
//     frameState.minimumDisableDepthTestDistance = scene._minimumDisableDepthTestDistance;
//     frameState.invertClassification = scene.invertClassification;
//     frameState.useLogDepth = scene._logDepthBuffer && !(scene.camera.frustum instanceof Cesium.OrthographicFrustum || scene.camera.frustum instanceof Cesium.OrthographicOffCenterFrustum);

//     scene._actualInvertClassificationColor = Cesium.Color.clone(scene.invertClassificationColor, scene._actualInvertClassificationColor);
//     if (!Cesium.InvertClassification.isTranslucencySupported(scene._context)) {
//         scene._actualInvertClassificationColor.alpha = 1.0;
//     }

//     frameState.invertClassificationColor = scene._actualInvertClassificationColor;

//     if (Cesium.defined(scene.globe)) {
//         frameState.maximumScreenSpaceError = scene.globe.maximumScreenSpaceError;
//     } else {
//         frameState.maximumScreenSpaceError = 2;
//     }

//     clearPasses(frameState.passes);
// }

// var rectangleWidth = 3.0;
// var rectangleHeight = 3.0;
// var scratchRectangle = new Cesium.BoundingRectangle(0.0, 0.0, rectangleWidth, rectangleHeight);
// function updateCameraFromRay(ray, camera) {
//     var scratchRight = new Cesium.Cartesian3();
//     var scratchUp = new Cesium.Cartesian3();

//     var direction = ray.direction;
//     var orthogonalAxis = Cesium.Cartesian3.mostOrthogonalAxis(direction, scratchRight);
//     var right = Cesium.Cartesian3.cross(direction, orthogonalAxis, scratchRight);
//     var up = Cesium.Cartesian3.cross(direction, right, scratchUp);
//     camera.position = ray.origin;
//     camera.direction = direction;
//     camera.up = up;
//     camera.right = right;
// }
// function resolveFramebuffers(scene, passState) {
//     var context = scene._context;
//     var frameState = scene._frameState;
//     var environmentState = scene._environmentState;
//     var view = scene._view;

//     var useOIT = environmentState.useOIT;
//     var useGlobeDepthFramebuffer = environmentState.useGlobeDepthFramebuffer;
//     var usePostProcess = environmentState.usePostProcess;

//     var defaultFramebuffer = environmentState.originalFramebuffer;
//     var globeFramebuffer = useGlobeDepthFramebuffer ? view.globeDepth.framebuffer : undefined;
//     var sceneFramebuffer = view.sceneFramebuffer.getFramebuffer();
//     var idFramebuffer = view.sceneFramebuffer.getIdFramebuffer();

//     if (useOIT) {
//         passState.framebuffer = usePostProcess ? sceneFramebuffer : defaultFramebuffer;
//         view.oit.execute(context, passState);
//     }

//     if (usePostProcess) {
//         var inputFramebuffer = sceneFramebuffer;
//         if (useGlobeDepthFramebuffer && !useOIT) {
//             inputFramebuffer = globeFramebuffer;
//         }

//         var postProcess = scene.postProcessStages;
//         var colorTexture = inputFramebuffer.getColorTexture(0);
//         var idTexture = idFramebuffer.getColorTexture(0);
//         var depthTexture = defaultValue(globeFramebuffer, sceneFramebuffer).depthStencilTexture;
//         postProcess.execute(context, colorTexture, depthTexture, idTexture);
//         postProcess.copy(context, defaultFramebuffer);
//     }

//     if (!useOIT && !usePostProcess && useGlobeDepthFramebuffer) {
//         passState.framebuffer = defaultFramebuffer;
//         view.globeDepth.executeCopyColor(context, passState);
//     }

//     var useLogDepth = frameState.useLogDepth;

//     if (scene.debugShowGlobeDepth && useGlobeDepthFramebuffer) {
//         var gd = getDebugGlobeDepth(scene, scene.debugShowDepthFrustum - 1);
//         gd.executeDebugGlobeDepth(context, passState, useLogDepth);
//     }

//     if (scene.debugShowPickDepth && useGlobeDepthFramebuffer) {
//         var pd = getPickDepth(scene, scene.debugShowDepthFrustum - 1);
//         pd.executeDebugPickDepth(context, passState, useLogDepth);
//     }
// }
// var scratchColorZero = new Cesium.Color(0.0, 0.0, 0.0, 0.0);
// function getRayIntersection(scene, ray) {
//     var context = scene._context;
//     var uniformState = context.uniformState;
//     var frameState = scene._frameState;

//     var view = scene._pickOffscreenView;
//     if(!Cesium.defined(view)){
//         var pickOffscreenViewport = new Cesium.BoundingRectangle(0, 0, 1, 1);
//         var pickOffscreenCamera = new Cesium.Camera(scene);
//         pickOffscreenCamera.frustum = new Cesium.OrthographicFrustum({
//             width: 0.01,
//             aspectRatio: 1.0,
//             near: 0.1
//         });
//         scene._pickOffscreenView = new Cesium.View(scene, pickOffscreenCamera, pickOffscreenViewport);
//         view = scene._pickOffscreenView;
//     }   
//     scene._view = view;

//     updateCameraFromRay(ray, view.camera);

//     scratchRectangle = Cesium.BoundingRectangle.clone(view.viewport, scratchRectangle);

//     var passState = view.pickFramebuffer.begin(scratchRectangle, view.viewport);

//     scene._jobScheduler.disableThisFrame();

//     // Update with previous frame's number and time, assuming that render is called before picking.
//     updateFrameState(scene, frameState.frameNumber, frameState.time);
//     frameState.invertClassification = false;
//     frameState.passes.pick = true;
//     frameState.passes.offscreen = true;

//     uniformState.update(frameState);

//     updateEnvironment(scene, view);
//     updateAndExecuteCommands(scene, passState, scratchColorZero);
//     resolveFramebuffers(scene, passState);

//     var position;
//     var object = view.pickFramebuffer.end(context);

//     if (scene._context.depthTexture) {
//         var numFrustums = view.frustumCommandsList.length;
//         for (var i = 0; i < numFrustums; ++i) {
//             var pickDepth = getPickDepth(scene, i);
//             var depth = pickDepth.getDepth(context, 0, 0);
//             if (depth > 0.0 && depth < 1.0) {
//                 var renderedFrustum = view.frustumCommandsList[i];
//                 var near = renderedFrustum.near * (i !== 0 ? scene.opaqueFrustumNearOffset : 1.0);
//                 var far = renderedFrustum.far;
//                 var distance = near + depth * (far - near);
//                 position = Cesium.Ray.getPoint(ray, distance);
//                 break;
//             }
//         }
//     }

//     scene._view = scene._defaultView;
//     context.endFrame();
//     callAfterRenderFunctions(scene);

//     if (Cesium.defined(object) || Cesium.defined(position)) {
//         return {
//             object: object,
//             position: position
//         };
//     }
// }
// function callAfterRenderFunctions(scene) {
//     // Functions are queued up during primitive update and executed here in case
//     // the function modifies scene state that should remain constant over the frame.
//     var functions = scene._frameState.afterRender;
//     for (var i = 0, length = functions.length; i < length; ++i) {
//         functions[i]();
//         scene.requestRender();
//     }

//     functions.length = 0;
// }
// function isExcluded(object, objectsToExclude) {
//     if (!Cesium.defined(objectsToExclude) || objectsToExclude.length === 0) {
//         return false;
//     }
//     return (objectsToExclude.indexOf(object) > -1) ||
//            (objectsToExclude.indexOf(object.primitive) > -1) ||
//            (objectsToExclude.indexOf(object.id) > -1);
// }
// function drillPick1(limit, pickCallback, objectsToExclude) {
//     // PERFORMANCE_IDEA: This function calls each primitive's update for each pass. Instead
//     // we could update the primitive once, and then just execute their commands for each pass,
//     // and cull commands for picked primitives.  e.g., base on the command's owner.
//     var i;
//     var attributes;
//     var result = [];
//     var pickedPrimitives = [];
//     var pickedAttributes = [];
//     var pickedFeatures = [];
//     if (!defined(limit)) {
//         limit = Number.MAX_VALUE;
//     }

//     var pickedResult = pickCallback();
//     while (defined(pickedResult)) {
//         var object = pickedResult.object;
//         var position = pickedResult.position;

//         if (defined(position) && !defined(object)) {
//             result.push(pickedResult);
//             break;
//         }

//         if (!defined(object) || !defined(object.primitive)) {
//             break;
//         }

//         if (!isExcluded(object, objectsToExclude)) {
//             result.push(pickedResult);
//             if (0 >= --limit) {
//                 break;
//             }
//         }

//         var primitive = object.primitive;
//         var hasShowAttribute = false;

//         // If the picked object has a show attribute, use it.
//         if (typeof primitive.getGeometryInstanceAttributes === 'function') {
//             if (defined(object.id)) {
//                 attributes = primitive.getGeometryInstanceAttributes(object.id);
//                 if (defined(attributes) && defined(attributes.show)) {
//                     hasShowAttribute = true;
//                     attributes.show = ShowGeometryInstanceAttribute.toValue(false, attributes.show);
//                     pickedAttributes.push(attributes);
//                 }
//             }
//         }

//         if (object instanceof Cesium.Cesium3DTileFeature) {
//             hasShowAttribute = true;
//             object.show = false;
//             pickedFeatures.push(object);
//         }

//         // Otherwise, hide the entire primitive
//         if (!hasShowAttribute) {
//             primitive.show = false;
//             pickedPrimitives.push(primitive);
//         }

//         pickedResult = pickCallback();
//     }

//     // Unhide everything we hid while drill picking
//     for (i = 0; i < pickedPrimitives.length; ++i) {
//         pickedPrimitives[i].show = true;
//     }

//     for (i = 0; i < pickedAttributes.length; ++i) {
//         attributes = pickedAttributes[i];
//         attributes.show = ShowGeometryInstanceAttribute.toValue(true, attributes.show);
//     }

//     for (i = 0; i < pickedFeatures.length; ++i) {
//         pickedFeatures[i].show = true;
//     }

//     return result;
// }

// function getRayIntersections(scene, ray, limit, objectsToExclude) {
//     //>>includeStart('debug', pragmas.debug);
//     Cesium.Check.defined('ray', ray);
//     if (scene._mode !== Cesium.SceneMode.SCENE3D) {
//         throw new Cesium.DeveloperError('Ray intersections are only supported in 3D mode.');
//     }
//     //>>includeEnd('debug');
//     var pickCallback = function () {
//         return getRayIntersection(scene, ray);
//     };
//     return drillPick1(limit, pickCallback, objectsToExclude);
// }