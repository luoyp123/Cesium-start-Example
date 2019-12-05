;
/**
 * 第一人称漫游（沉浸式漫游）
 * @nanme Sogrey
 * 
 * @version v1
 * @param {*} Cesium
 */
ImmersionRoaming = (function (Cesium) {
    var _viewer;
    var lookFactor = .2; //调整视角速度
    var moveRate = 2.0; //移动速度
    var footerHeight = 2.0; //相机距地2.0米高度
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
    }

    //获取视角
    function getCamera() {
        return {
            position: _viewer.camera.position, //位置
            direction: _viewer.camera.direction, //方向
            heading: _viewer.camera.heading, //航向角
            pitch: _viewer.camera.pitch //俯仰角
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
        if (options.hasOwnProperty("lookFactor"))
            lookFactor = options["lookFactor"];
        if (options.hasOwnProperty("moveRate"))
            moveRate = options["moveRate"];
        if (options.hasOwnProperty("footerHeight"))
            footerHeight = options["footerHeight"];
    }
    /**
     * 漫游初始化
     */
    function initIR() {
        //获取当前相机位置，经纬度 - 设置漫游初始相机位置
        //获取相机世界坐标
        var position = _viewer.camera.position;
        //heading 弧度
        var heading = _viewer.camera.heading;
        //弧度转角度
        heading = radian2Angle(heading);
        //世界坐标转经纬度
        var degrees = cartesian3ToWgs84(position);
        //调整视角水平、高程为2米
        _viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(degrees[0], degrees[1], footerHeight),
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
        var scene = _viewer.scene;
        var ellipsoid = _viewer.scene.globe.ellipsoid; //获取椭球体
        var screenSpaceCameraController = scene.screenSpaceCameraController; //获取用于摄像机输入处理的控制器。
        screenSpaceCameraController.enableRotate = enable; //如果为true，则允许用户旋转世界以平移用户的位置。该标志仅适用于2D和3D。
        screenSpaceCameraController.enableTranslate = enable; //如果为true，则允许用户在地图上平移。如果为false，则相机保持锁定在当前位置。
        screenSpaceCameraController.enableZoom = enable; //如果为true，则允许用户放大和缩小。如果为false，则将相机锁定到距椭球的当前距离。
        screenSpaceCameraController.enableTilt = enable; //如果为true，则允许用户倾斜相机。如果为false，则将相机锁定到当前heading。
        screenSpaceCameraController.enableLook = enable; //如果为true，则允许用户使用自由外观。如果为false，则只能通过平移或旋转来更改摄像机的观看方向。
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
        var canvas = _viewer.canvas;
        var camera = _viewer.camera;
        var currentCamera = getCamera();
        if (flags.looking) {
            var width = canvas.clientWidth;
            var height = canvas.clientHeight;

            var x = (mousePosition.x - startMousePosition.x) / width;
            var y = -(mousePosition.y - startMousePosition.y) / height;
            //如果相机没有在2D模式下，则以弧度沿其上向量的相反方向围绕其右向量旋转
            // camera.lookRight(x * lookFactor); //参数是弧度，这是转换成弧度
            var heading = radian2Angle(currentCamera.heading) + radian2Angle(x * lookFactor);
            //如果相机没有在2D模式下，则沿其右向量的相反方向围绕其up轴旋转
            // camera.lookUp(y * lookFactor);
            var pitch = radian2Angle(currentCamera.pitch) + radian2Angle(y * lookFactor);
            camera.setView({
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
        //     camera.moveForward(moveRate);            
        // }
        // if (flags.moveBackward) {
        //     camera.moveBackward(moveRate);
        // }

        var direction = new Cesium.Cartesian3();
        getHorizontalDirection(camera, direction);

        // var ray = new Cesium.Ray(currentCamera.position, direction);
        // drawRayHelper(viewer,ray);

        if (flags.moveForward) {
            camera.move(direction, moveRate);
        }
        if (flags.moveBackward) {
            camera.move(direction, -moveRate);
        }
        if (flags.moveUp) {
            camera.moveUp(moveRate);
        }
        if (flags.moveDown) {
            camera.moveDown(moveRate);
        }
        if (flags.moveLeft) {
            camera.moveLeft(moveRate);
        }
        if (flags.moveRight) {
            camera.moveRight(moveRate);
        }
    }

    function iREvents(clock) {
        var canvas = _viewer.canvas;
        var camera = _viewer.camera;
        canvas.setAttribute('tabindex', '0');
        canvas.onclick = function () {
            canvas.focus();
        }
        //处理用户输入事件。可以添加自定义函数，以便在用户输入时执行
        handler = new Cesium.ScreenSpaceEventHandler(canvas);
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

        viewer.clock.onTick.removeEventListener(iRClockOnTickEventListener);
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