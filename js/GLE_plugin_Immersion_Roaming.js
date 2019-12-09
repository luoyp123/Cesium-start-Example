;
/**
 * 第一人称漫游（沉浸式漫游）
 * @nanme Sogrey
 * 
 * @version v1
 * @param {*} Cesium
 */
GLEImmersionRoaming = (function (Cesium) {
    var _viewer, _scene, _canvas, _camera;
    var cameraHorizontal, cameraVertical;
    var rayHorizontal, rayVertical;

    var defaultConfig = {
        lookFactor: .2, //调整视角速度
        moveRate: 0.5, //移动速度
        footerHeight: 2.0, //相机距地2.0米高度
    };
    var config = defaultConfig;

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

        cameraHorizontal = new Cesium.Camera(scene);
        cameraVertical = new Cesium.Camera(scene);

        cameraHorizontal.position = _camera.position.clone();
        cameraHorizontal.direction = _camera.direction.clone();
        cameraHorizontal.up = _camera.up.clone();
        cameraHorizontal.frustum.fov = _camera.frustum.fov;
        cameraHorizontal.frustum.near = _camera.frustum.near;
        cameraHorizontal.frustum.far = _camera.frustum.far;

        var directionVertical = Cesium.Cartesian3.negate(Cesium.Cartesian3.UNIT_Z, new Cesium.Cartesian3());
        cameraVertical.position = _camera.position.clone();
        cameraVertical.direction = directionVertical;
        cameraVertical.up = _camera.up.clone();
        cameraVertical.frustum.fov = _camera.frustum.fov;
        cameraVertical.frustum.near = _camera.frustum.near;
        cameraVertical.frustum.far = _camera.frustum.far;


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
        switch (keyCode) {
            case 'W'.charCodeAt(0):
                return 'moveForward';
            case 'S'.charCodeAt(0):
                return 'moveBackward';
            case 'Q'.charCodeAt(0):
                return 'moveUp';
            case "E".charCodeAt(0):
                return 'moveDown';
            case "D".charCodeAt(0):
                return 'moveRight';
            case 'A'.charCodeAt(0):
                return 'moveLeft';
            default:
                return undefined;
        }
    }
    /**
     * 配置
     * 
     * var options = {
     *    lookFactor : .2,//调整视角速度
     *    moveRate : .2,//移动速度
     *    footerHeight : 2.0//相机距地高度
     * }
     * @param {Object} options 配置信息
     */
    _.prototype.setConfig = function (options) {
        for (var o in options) {
            if (options.hasOwnProperty(o))
                config[o] = options[o];
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
            destination: Cesium.Cartesian3.fromDegrees(degrees[0], degrees[1], config.footerHeight),
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
            var heading = Cesium.Math.toDegrees(currentCamera.heading) + Cesium.Math.toDegrees(x * config.lookFactor);
            //如果相机没有在2D模式下，则沿其右向量的相反方向围绕其up轴旋转
            var pitch = Cesium.Math.toDegrees(currentCamera.pitch) + Cesium.Math.toDegrees(y * config.lookFactor);
            _camera.setView({
                destination: currentCamera.position,
                orientation: {
                    heading: Cesium.Math.toRadians(heading), //航向角
                    pitch: Cesium.Math.toRadians(pitch), //俯仰角
                    roll: 0.0 //设为默认值0.0 防止侧翻
                }
            });
        }

        // currentCamera.position;
        // if (flags.moveForward) {
        //     _camera.moveForward(moveRate);            
        // }
        // if (flags.moveBackward) {
        //     _camera.moveBackward(moveRate);
        // }

        var direction = new Cesium.Cartesian3();
        getHorizontalDirection(_camera, direction);

        // var ray = new Cesium.Ray(currentCamera.position, direction);
        // drawRayHelper(viewer,ray);

        if (flags.moveForward) {
            _camera.move(direction, config.moveRate);
        }
        if (flags.moveBackward) {
            _camera.move(direction, -config.moveRate);
        }
        if (flags.moveUp) {
            _camera.moveUp(config.moveRate);
        }
        if (flags.moveDown) {
            _camera.moveDown(config.moveRate);
        }
        if (flags.moveLeft) {
            _camera.moveLeft(config.moveRate);
        }
        if (flags.moveRight) {
            _camera.moveRight(config.moveRate);
        }
        cameraHorizontal.position = _camera.position.clone();
        cameraHorizontal.direction = direction.clone();
        rayHorizontal.origin = _camera.position.clone();
        rayHorizontal.direction = direction.clone();

        cameraVertical.position = _camera.position.clone();
        cameraVertical.direction = direction.clone();
        cameraVertical.lookDown(Cesium.Math.toRadians(-90.0));
        rayVertical.origin = _camera.position.clone();
        rayVertical.direction = cameraVertical.direction.clone();

        // var dot  = new Cesium.Cartesian3();
        // Cesium.Cartesian3.dot(cameraHorizontal.direction.clone(),cameraVertical.direction.clone(),dot);
        // console.log(cameraHorizontal.direction.equals(cameraVertical.direction),dot);
        
        //水平方向
        // cameraHorizontal.getPickRay(windowPosition, rayHorizontal)
        //垂直方向
        // cameraVertical.getPickRay(windowPosition, rayVertical)
    }

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
    /**
     * 结束漫游
     */
    _.prototype.stop = function () {
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