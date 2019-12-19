;
/**
 * 第一人称漫游（沉浸式漫游）
 * @nanme Sogrey
 * 
 * @version v1
 * @param {*} Cesium
 */
GLEImmersionRoaming = (function (Cesium) {
    var _viewer, _scene, _canvas, _camera, _globe;
    var rayHorizontal, rayVertical;

    var defaultConfig = {
        lookFactor: .2, //调整视角速度
        moveRate: 0.5, //水平移动速度
        horizontalDistance: 1.0, //水平碰撞距离，单位米
        gravityRate: 9.8, //重力方向加速度
        footerHeight: 2.0, //相机距地2.0米高度
    };
    var _config = defaultConfig;

    var isLanded = false;
    var velocity = new Cesium.Cartesian3(
        /*前进+x/后退-x,
          向右+y/向左-y,
          向上+z/向下-z*/
    ); //移动速度变量

    //创建变量来记录当前的鼠标位置，以及用于跟踪相机如何移动的标志
    var startMousePosition; //开始时鼠标位置
    var mousePosition; //当前鼠标位置
    var flags = {
        //是否调整视角
        looking: false,
        //下为控制方向
        moveForward: false,
        moveBackward: false,
        moveUp: false,
        moveDown: false,
        moveLeft: false,
        moveRight: false
    };
    var handler;

    function _(viewer) {
        _viewer = viewer;
        this._viewer = viewer;
        _scene = _viewer.scene;
        _canvas = _viewer.canvas;
        _camera = _viewer.camera;
        _globe = _viewer.scene.globe;

        _scene.screenSpaceCameraController.enableCollisionDetection = true;

        var directionVertical = Cesium.Cartesian3.negate(Cesium.Cartesian3.UNIT_Z, new Cesium.Cartesian3());

        if (!Cesium.defined(rayHorizontal)) {
            rayHorizontal = new Cesium.Ray(_camera.position.clone(), _camera.direction.clone())
        } else {
            rayHorizontal.origin = _camera.position.clone();
            rayHorizontal.direction = _camera.direction.clone();
        }

        if (!Cesium.defined(rayVertical)) {
            rayVertical = new Cesium.Ray(_camera.position.clone(), directionVertical.clone())
        } else {
            rayVertical.origin = _camera.position.clone();
            rayVertical.direction = directionVertical.clone();
        }
    }

    //获取视角
    function getCamera() {
        return {
            position: _camera.position, //位置
            direction: _camera.direction, //方向
            heading: _camera.heading, //航向角
            pitch: _camera.pitch //俯仰角
        }
    }

    /**
     * 不同键值对应不同的执行方法
     * @param {char} keyCode 
     */
    function getFlagForKeyCode(keyCode) {
        // console.log(keyCode);
        switch (keyCode) {
            case KEY_W:
                return 'moveForward';
            case KEY_S:
                return 'moveBackward';
            case KEY_Q:
                return 'moveUp';
            case KEY_E:
                return 'moveDown';
            case KEY_D:
                return 'moveRight';
            case KEY_A:
                return 'moveLeft';
            case KEY_ESCAPE:
                stopIR();
                break;
            default:
                return undefined;
        }
    }
    /**
     * 配置
     * 
     * var options = {
            lookFactor: .2, //调整视角速度
            moveRate: 0.5, //水平移动速度
            horizontalDistance: 1.0, //水平碰撞距离，单位米
            gravityRate: 9.8, //重力方向加速度
            footerHeight: 2.0, //相机距地2.0米高度
        };
     * @param {Object} options 配置信息
     */
    _.prototype.setConfig = function (options) {
        for (var o in options) {
            if (options.hasOwnProperty(o))
                _config[o] = options[o];
        }
    }
    /**
     * 漫游初始化
     */
    function initIR() {
        //获取当前相机位置，经纬度 - 设置漫游初始相机位置
        //获取相机世界坐标
        var position = _camera.position;
        //heading 弧度
        var heading = _camera.heading;
        //弧度转角度
        heading = Cesium.Math.toDegrees(heading);
        //世界坐标转经纬度
        var degrees = cartesian3ToWgs84(position);
        //调整视角水平、高程为2米
        _camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(degrees[0], degrees[1], _config.footerHeight),
            orientation: {
                heading: Cesium.Math.toRadians(heading),
                pitch: Cesium.Math.toRadians(0.0),
                roll: 0.0
            }
        });
    }

    /**
     * 漫游前对cesium空间相机控制器重新配置，禁用之前的
     * @param {boolean} enable true:开启空间相机控制器默认动作,false：禁用空间相机控制器默认动作
     */
    function setIRConfig(enable) {
        var ellipsoid = _scene.globe.ellipsoid; //获取椭球体
        var screenSpaceCameraController = _scene.screenSpaceCameraController; //获取用于摄像机输入处理的控制器。
        screenSpaceCameraController.enableRotate = enable; //如果为true，则允许用户旋转世界以平移用户的位置。该标志仅适用于2D和3D。
        screenSpaceCameraController.enableTranslate = enable; //如果为true，则允许用户在地图上平移。如果为false，则相机保持锁定在当前位置。
        screenSpaceCameraController.enableZoom = enable; //如果为true，则允许用户放大和缩小。如果为false，则将相机锁定到距椭球的当前距离。
        screenSpaceCameraController.enableTilt = enable; //如果为true，则允许用户倾斜相机。如果为false，则将相机锁定到当前heading。
        screenSpaceCameraController.enableLook = enable; //如果为true，则允许用户使用自由外观。如果为false，则只能通过平移或旋转来更改摄像机的观看方向。
    }

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

    function iRKeyDownEvent(e) {
        var flagName = getFlagForKeyCode(e.keyCode);
        if (typeof flagName !== 'undefined') {
            flags[flagName] = true;
        }
    }

    function iRKeyUpEvent(e) {
        var flagName = getFlagForKeyCode(e.keyCode);
        if (typeof flagName !== 'undefined') {
            flags[flagName] = false;
        }
    }

    function iRClockOnTickEventListener(clock) {
        var currentCamera = getCamera();
        if (flags.looking) {
            var width = _canvas.clientWidth;
            var height = _canvas.clientHeight;

            var x = (mousePosition.x - startMousePosition.x) / width;
            var y = -(mousePosition.y - startMousePosition.y) / height;
            //如果相机没有在2D模式下，则以弧度沿其上向量的相反方向围绕其右向量旋转
            var heading = Cesium.Math.toDegrees(currentCamera.heading) + Cesium.Math.toDegrees(x * _config.lookFactor);
            //如果相机没有在2D模式下，则沿其右向量的相反方向围绕其up轴旋转
            var pitch = Cesium.Math.toDegrees(currentCamera.pitch) + Cesium.Math.toDegrees(y * _config.lookFactor);
            _camera.setView({
                destination: currentCamera.position,
                orientation: {
                    heading: Cesium.Math.toRadians(heading), //航向角
                    pitch: Cesium.Math.toRadians(pitch), //俯仰角
                    roll: 0.0 //设为默认值0.0 防止侧翻
                }
            });
        }

        /*
                
                          moveUp      moveLeft
                            +z          -y
                            │         ╱
                            │       ╱
                            │     ╱
                 direction  │   ╱     
                    ─────>  │ ╱
             -x ────────────┼──────────────── +x
          moveBackward    ╱ │               moveForward
                        ╱   │
                      ╱     │
                    +y        -z
                moveRight  moveDown
        
        */

        //前进后退
        if (flags.moveForward || flags.moveBackward) {
            if (velocity.x == 0) velocity.x = 0.1;
            velocity.x += velocity.x * 0.5;
            if (velocity.x >= _config.moveRate) velocity.x = _config.moveRate;
        } else {
            if (velocity.x > 0) {
                velocity.x -= velocity.x * 0.5;
                if (velocity.x < _config.moveRate / 8) {
                    velocity.x = 0;
                }
            }
        }
        //左右移动
        if (flags.moveLeft || flags.moveRight) {
            if (velocity.y == 0) velocity.y = 0.1;
            velocity.y += velocity.y * 0.5;
            if (velocity.y >= _config.moveRate) velocity.y = _config.moveRate;
        } else {
            if (velocity.y > 0) {
                velocity.y -= velocity.y * 0.5;
                if (velocity.y < _config.moveRate / 8) {
                    velocity.y = 0;
                }
            }
        }
        //上下移动
        if (!isLanded) { //未落地 上下移动无效
            velocity.z += 9.8 * 5.0; //没落地 默认下降的速度
        }
        //手动调节
        if (flags.moveUp || flags.moveDown) {
            if (velocity.z == 0) velocity.z = 0.1;
            velocity.z += velocity.z * 0.5;
            if (velocity.z >= _config.moveRate) velocity.z = _config.moveRate;
        } else {
            if (velocity.z > 0) {
                velocity.z -= velocity.z * 0.5;
                if (velocity.z < _config.moveRate / 8) {
                    velocity.z = 0;
                }
            }
        }

        console.log(velocity);

        var direction = new Cesium.Cartesian3();
        var runDirection= new Cesium.Cartesian3();
        getHorizontalDirection(_camera, direction);
        //默认前进方向就是相机方向在水平面上头像方向
        runDirection = direction.clone();
        //如果后退则是前进方向的反方向
        if (flags.moveBackward) {
            Cesium.Cartesian3.negate(direction.clone(), runDirection);
        }
        if (flags.moveRight) {
            // Cesium.Cartesian3.negate(direction.clone(), runDirection);
        }
        if (flags.moveLeft) {
            // Cesium.Cartesian3.negate(direction.clone(), runDirection);
        }
        
        rayHorizontal.origin = _camera.position.clone();
        rayHorizontal.direction = runDirection.clone();

        rayVertical.origin = _camera.position.clone();
        var gDirection = new Cesium.Cartesian3();
        Cesium.Cartesian3.negate(_camera.position.clone(), gDirection);
        var gDirectionNormalize = new Cesium.Cartesian3();
        Cesium.Cartesian3.normalize(gDirection, gDirectionNormalize)
        rayVertical.direction = gDirectionNormalize;

        var pointHorizontal = new Cesium.Cartesian3();
        var pointVertical = new Cesium.Cartesian3();

        //发射线与场景中碰撞得到第一个碰撞结果，
        //碰撞到场景中3D瓦片模型，返回碰撞结果，包括碰撞到的模型及位置
        //未检测到碰撞返回undefined,
        //碰撞地形返回object是undefined,但position有值
        var resultHorizontal = _scene.pickFromRay(rayHorizontal /*,[],0.1*/ );
        var resultGravity = _scene.pickFromRay(rayVertical /*,[],0.1*/ );

        if (Cesium.defined(resultHorizontal) && Cesium.defined(resultHorizontal.position)) { //水平方向碰撞到东西了
            pointHorizontal = resultHorizontal.position.clone();
        }
        if (Cesium.defined(resultGravity) && Cesium.defined(resultGravity.position)) { //重力方向碰撞到东西了
            pointVertical = resultGravity.position.clone();
        }

        var currentCameraPosition = _camera.position.clone();

        //计算碰撞点与相机位置之间的距离
        var distanceHorizontal = Cesium.Cartesian3.distance(currentCameraPosition, pointHorizontal);
        var distanceVertical = Cesium.Cartesian3.distance(currentCameraPosition, pointVertical);

        //水平碰撞距离小于最小水平碰撞距离 => 已碰撞
        if (distanceHorizontal < _config.horizontalDistance) {
            console.log("水平已碰撞");
            if (flags.moveForward || flags.moveBackward || flags.moveLeft || flags.moveRight) {
                velocity.x = 0; //velocity.x / 2;
                velocity.y = 0; //velocity.y / 2;
            }
        }
        //上次检测未落地，本次重力碰撞距离小于最小重力碰撞距离 => 已碰撞 -> 已落地
        if (!isLanded && distanceVertical < _config.footerHeight) {
            isLanded = true;
            console.log("重力已碰撞")
            velocity.z = 0; //_config.gravityRate / 2;
            var degrees = cartesian3ToWgs84(_camera.position.clone());
            _camera.setView({
                destination: Cesium.Cartesian3.fromDegrees(degrees[0], degrees[1], _config.footerHeight),
                orientation: {
                    heading: _camera.heading,
                    pitch: _camera.pitch,
                    roll: 0.0
                }
            });
        } else {
            //未落地 
            isLanded = false;
            velocity.z = 0;
        }

        if (flags.moveForward) {
            _camera.move(direction, velocity.x);
        }
        if (flags.moveBackward) {
            _camera.move(direction, -velocity.x);
        }
        if (flags.moveLeft) {
            _camera.moveLeft(velocity.y);
        }
        if (flags.moveRight) {
            _camera.moveRight(velocity.y);
        }
        if (flags.moveUp) {
            _camera.moveUp(velocity.z);
        }
        if (!isLanded && flags.moveDown) {
            _camera.moveDown(velocity.z);
        }


        // if (flags.moveForward) {
        //     _camera.move(direction, _config.moveRate);
        // }
        // if (flags.moveBackward) {
        //     _camera.move(direction, -_config.moveRate);
        // }
        // if (flags.moveUp) {
        //     _camera.moveUp(_config.moveRate);
        // }
        // if (!isLanded && flags.moveDown) {
        //     _camera.moveDown(_config.moveRate);
        // }
        // if (flags.moveLeft) {
        //     _camera.moveLeft(_config.moveRate);
        // }
        // if (flags.moveRight) {
        //     _camera.moveRight(_config.moveRate);
        // }
    }
    //测试用
    // _.prototype.drawRayHelper = function () {
    //     drawRayHelper(_viewer,rayHorizontal);
    //     drawRayHelper(_viewer,rayVertical);
    // }

    function iREvents(clock) {
        _canvas.setAttribute('tabindex', '0');
        _canvas.onclick = function () {
            _canvas.focus();
        }
        //处理用户输入事件。可以添加自定义函数，以便在用户输入时执行
        handler = new Cesium.ScreenSpaceEventHandler(_canvas);
        handler.setInputAction(function (movement) {
            flags.looking = true;
            mousePosition = startMousePosition = Cesium.Cartesian3.clone(movement.position);
        }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

        handler.setInputAction(function (movement) {
            mousePosition = movement.endPosition;
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        handler.setInputAction(function (position) {
            flags.looking = false;
        }, Cesium.ScreenSpaceEventType.LEFT_UP);

        document.addEventListener('keydown', iRKeyDownEvent, false);
        document.addEventListener('keyup', iRKeyUpEvent, false);

        //事件发生时更新相机
        //点击获取坐标，
        _viewer.clock.onTick.addEventListener(iRClockOnTickEventListener);
    }

    /**
     * 开始漫游
     */
    _.prototype.start = function () {
        initIR();
        //禁用空间相机控制器默认动作
        setIRConfig(false);
        //添加漫游时的自定义事件
        iREvents();
        onImmersionRoamingStart();
        console.log("开始漫游");
    }

    function stopIR() {
        //重新启用空间相机控制器默认动作
        setIRConfig(true);

        //移除漫游时添加的自定义事件
        handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
        handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);

        document.removeEventListener('keydown', iRKeyDownEvent, false);
        document.removeEventListener('keyup', iRKeyUpEvent, false);

        _viewer.clock.onTick.removeEventListener(iRClockOnTickEventListener);
        onImmersionRoamingEnd();
        console.log("结束漫游");
    }
    /**
     * 结束漫游
     */
    _.prototype.stop = stopIR;

    /**
     * 漫游开始事件
     */
    function onImmersionRoamingStart() {
        console.log("漫游开始...");
    }
    /**
     * 漫游结束事件
     */
    function onImmersionRoamingEnd() {
        console.log("漫游结束...");
    };

    return _;
})(window.Cesium || {});