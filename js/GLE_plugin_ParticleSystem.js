;
/**
 * 粒子系统
 * @nanme Sogrey
 * 
 * @version v1
 * @param {*} Cesium
 */
GLEParticleSystem = (function (Cesium) {
    var _viewer, _scene, _canvas, _camera;

    var particleSystems = [];
    var defaultConfig = { //默认配置
        rain: { //天气-雨

        },
        snow: { //天气-雪

        },
        fire: { //火焰
            image: "", //【必需】贴图
            minimumImageSize: [20.0, 20.0], //图片尺寸 width & height 最小 单位像素
            maximumImageSize: [40.0, 40.0], //图片尺寸 width & height 最大 单位像素
            startScale: 1.0, //粒子出生时大小倍率
            endScale: 4.0, //粒子死亡时大小倍率
            emitterType: 2, //发射器类型：0：BoxEmitter 盒式，1：CircleEmitter 圆形，2：ConeEmitter 圆锥，3：SphereEmitter 球体
            emitterRadian: 20.0, //发射器张角
            startColor: Cesium.Color.YELLOW.withAlpha(0.85), //开始颜色
            endColor: Cesium.Color.DARKORANGE.withAlpha(0.0), //结束颜色
            emissionRate: 15, //粒子发射速率
            lifetime: 16.0, //粒子生命周期 单位秒
            loop: true, //是否循环，设为false，生命周期结束的粒子也结束了
            speedRange: [1.0, 3.0], //速度范围

            position: [0, 0, 0], //【必需】位置 WGS84 坐标【经度（角度）、维度（角度）、高程】，也能传入3D模型，将取模型中点位置
            //position:computeModelMatrix(modelEntity, Cesium.JulianDate.now()),
            positionOffset: [0, 0, 0], //偏移
        },
        smoke: { //雪

        },
        fountain: { //喷泉

        }
    }
    var _config = {}; //生效配置

    function _(viewer) {
        _viewer = viewer;
        this._viewer = viewer;
        _scene = _viewer.scene;
        _canvas = _viewer.canvas;
        _camera = _viewer.camera;
    }

    /**
     * 更新粒子效果配置
     */
    function setConfigs() {
        for (var i = 0; i < arguments.length; i++) {
            var item = arguments[i];
            // console.log(i, item);
            for (var o in item) {
                if (item.hasOwnProperty(o))
                    _config[o] = item[o];
            }
        }
    }
    /**
     * 更新粒子效果配置
     * @param {*} tag 
     * @param {*} config 配置
     */
    function updateParticleSystem(tag, config) {}
    /**
     * 更新粒子效果配置
     * @param {*} particleSystem 粒子对象
     * @param {*} config 配置
     */
    function updateConfig(particleSystem, config) {}

    /**
     * 清除所有粒子效果
     */
    function cleanAllParticleSystem() {
        for (let index = 0; index < particleSystems.length; index++) {
            var element = particleSystems[index];
            if (element && element instanceof Cesium.ParticleSystem && !element.isDestroyed()) {
                element.destroyed();
            }
        }
    }

    /**
     * 计算坐标矩阵
     * @param {*} position Array(16) or Array(3) or Entity
     */
    function transformPosition(position) {
        var time = Cesium.JulianDate.now();
        if (position instanceof Array && position.length == 16) { //4x4
            return position;
        } else if (position instanceof Array && position.length == 3) { //WGS84 坐标
            //WGS84 转 Cartesian3
            var positionCartesian3 = Cesium.Cartesian3.fromDegrees(position[0], position[1], position[2]);

            if (!Cesium.defined(positionCartesian3)) {
                return undefined;
            }

            //获取位置
            var positionTmp = Cesium.Property.getValueOrUndefined(
                positionCartesian3, time, new Cesium.Cartesian3());
            if (!Cesium.defined(positionTmp)) {
                return undefined;
            }

            var modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(positionTmp, undefined, new Cesium.Matrix4());

            return modelMatrix;
        } else { //传入模型
            var entity = position;
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
    }

    /**
     * 产出粒子
     * @param {*} tag 
     * @param {*} psType 粒子类型
     */
    function makeParticleSystem(tag, psType) {
        console.log(tag, _config);
        var particleSystem;
        switch (psType) {
            case "rain": //天气-雨
                break;
            case "snow": //天气-雪
                break;
            case "fire": //天气-火焰
                //#region 创建火焰粒子
                if (!Cesium.defined(_config.image)) {
                    console.error("image must not be null.");
                    return;
                }
                if (!Cesium.defined(_config.position)) {
                    console.error("position must not be null.");
                    return;
                }
                var emitter;
                switch (_config.emitterType) {
                    case 0:
                        emitter = new Cesium.BoxEmitter(new Cesium.Cartesian3(_config.emitterRadian, _config.emitterRadian, _config.emitterRadian));
                        break;
                    case 1:
                        emitter = new Cesium.CircleEmitter(_config.emitterRadian);
                        break;
                    case 2:
                        emitter = new Cesium.ConeEmitter(_config.emitterRadian);
                        break;
                    case 3:
                        emitter = new Cesium.SphereEmitter(_config.emitterRadian);
                        break;
                    default:
                        break;
                }

                var position = transformPosition(_config.position);

                particleSystem = new Cesium.ParticleSystem({
                    //贴图
                    image: _config.image,

                    //粒子发射器 锥形发射器
                    emitter: emitter,

                    //颜色
                    startColor: _config.startColor instanceof Cesium.Color ? _config.startColor : new Cesium.Color(_config.startColor[0], _config.startColor[1], _config.startColor[2], _config.startColor[3]),
                    endColor: _config.endColor instanceof Cesium.Color ? _config.endColor : new Cesium.Color(_config.endColor[0], _config.endColor[1], _config.endColor[2], _config.endColor[3]),

                    //尺寸
                    startScale: _config.startScale,
                    endScale: _config.endScale,
                    minimumImageSize: new Cesium.Cartesian2(_config.minimumImageSize[0], _config.minimumImageSize[1]),
                    maximumImageSize: new Cesium.Cartesian2(_config.maximumImageSize[0], _config.maximumImageSize[1]),

                    //粒子生命周期
                    lifetime: _config.lifetime,
                    loop: _config.loop,

                    //速度
                    // speed: 5.0,
                    minimumSpeed: _config.speedRange[0],
                    maximumSpeed: _config.speedRange[1],

                    //粒子产生速率  
                    emissionRate: _config.emissionRate,

                    //粒子发生位置
                    modelMatrix: position,
                    //粒子发射器位置矩阵
                    emitterModelMatrix: computeEmitterModelMatrix(_config.positionOffset[0], _config.positionOffset[1], _config.positionOffset[2]), //设置偏移为0
                });
                //#endregion
                break;
            case "smoke": //天气-烟雾
                break;
        }
        if (Cesium.defined(particleSystem))
            return _viewer.scene.primitives.add(particleSystem);
        else null;
    }

    _.prototype.addParticleSystem = function (tag, psType, config) {
        switch (psType) {
            case "rain": //天气-雨
                setConfigs(defaultConfig.rain, config);
                break;
            case "snow": //天气-雪
                setConfigs(defaultConfig.snow, config);
                break;
            case "fire": //火焰
                setConfigs(defaultConfig.fire, config);
                break;
            case "smoke": //烟雾
                setConfigs(defaultConfig.smoke, config);
                break;
            case "fountain": //喷泉
                setConfigs(defaultConfig.fountain, config);
                break;
        }
        //配置已合并存在 _config 中。
        // console.log(tag, _config);

        return makeParticleSystem(tag, psType)
    }

    return _;
})(window.Cesium || {});


















function createParticleSystems(options, systemsArray) {
    var length = options.numberOfSystems;
    for (var i = 0; i < length; ++i) {
        scratchAngleForOffset = Math.PI * 2.0 * i / options.numberOfSystems;
        scratchOffset.x += options.baseRadius * Math.cos(scratchAngleForOffset);
        scratchOffset.y += options.baseRadius * Math.sin(scratchAngleForOffset);

        var emitterModelMatrix = Cesium.Matrix4.fromTranslation(scratchOffset, matrix4Scratch);
        var color = Cesium.Color.fromRandom(options.colorOptions[i % options.colorOptions.length]);
        var force = forceFunction(options, i);

        var item = viewer.scene.primitives.add(new Cesium.ParticleSystem({
            image: getImage(),
            startColor: color,
            endColor: color.withAlpha(0.0),
            particleLife: 3.5,
            speed: 0.00005,
            imageSize: new Cesium.Cartesian2(15.0, 15.0),
            emissionRate: 30.0,
            emitter: new Cesium.CircleEmitter(0.1),
            bursts: [],
            lifetime: 0.1,
            forces: force,
            modelMatrix: particlesModelMatrix,
            emitterModelMatrix: emitterModelMatrix
        }));
        systemsArray.push(item);
    }
}