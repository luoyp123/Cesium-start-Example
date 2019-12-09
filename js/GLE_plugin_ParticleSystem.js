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

    var particleSystems = {};
    var defaultSkyAndFog = { //默认环境
        skyAtmosphere: { //天空大气
            hueShift: 0.0, //色调变化适用于大气。默认为0.0（无移位）。色相偏移1.0表示可用色相完全旋转。
            saturationShift: 0.0, //饱和度偏移将应用于大气。默认为0.0（无移位）。-1.0的饱和度偏移是单色的。
            brightnessShift: 0.0, //亮度变化适用于大气。默认为0.0（无移位）。-1.0的亮度偏移是完全黑暗，这将使空间显示出来。
        },
        fog: { //雾
            density: 2.0e-4, //确定雾的密度的标量。默认值2.0e-4
            minimumBrightness: 0.0, //照明产生的雾色的最小亮度。值为0.0可能会使雾完全变黑。值为1.0完全不会影响亮度。
        }
    };
    var defaultConfig = { //默认配置
        rain: { //天气-雨
            skyAtmosphere: { //天空大气
                hueShift: -0.97, //色调变化适用于大气。默认为0.0（无移位）。色相偏移1.0表示可用色相完全旋转。
                saturationShift: 0.25, //饱和度偏移将应用于大气。默认为0.0（无移位）。-1.0的饱和度偏移是单色的。
                brightnessShift: -0.4, //亮度变化适用于大气。默认为0.0（无移位）。-1.0的亮度偏移是完全黑暗，这将使空间显示出来。
            },
            fog: { //雾
                density: 0.00025, //确定雾的密度的标量。默认值2.0e-4
                minimumBrightness: 0.01, //照明产生的雾色的最小亮度。值为0.0可能会使雾完全变黑。值为1.0完全不会影响亮度。
            },
            image: "", //【必需】贴图
            minimumImageSize: [15.0, 15.0], //图片尺寸 width & height 最小 单位像素
            maximumImageSize: [20.0, 20.0], //图片尺寸 width & height 最大 单位像素
            startScale: 1.0, //粒子出生时大小倍率
            endScale: 0.5, //粒子死亡时大小倍率
            emitterType: 3, //发射器类型：0：BoxEmitter 盒式，1：CircleEmitter 圆形，2：ConeEmitter 圆锥，3：SphereEmitter 球体
            emitterRadian: 10000.0, //发射器张角
            startColor: new Cesium.Color(0.27, 0.6, 0.80, 0.5), //开始颜色
            endColor: new Cesium.Color(0.27, 0.6, 0.80, 1.0), //结束颜色
            emissionRate: 9000.0, //粒子发射频率
            lifetime: 16.0, //粒子生命周期 单位秒
            loop: true, //是否循环，设为false，生命周期结束的粒子也结束了
            speedRange: [-1.0, -1.5], //速度范围

            position: [0, 0, 0], // 【可选】位置 WGS84 坐标【经纬度（角度）、高程】，不设置默认采用相机当前位置
            positionOffset: [0, 0, 0], //偏移

            gravity: -9.8, //重力作用
            // updateCallback: rainUpdate
        },
        snow: { //天气-雪
            skyAtmosphere: { //天空大气
                hueShift: -0.8, //色调变化适用于大气。默认为0.0（无移位）。色相偏移1.0表示可用色相完全旋转。
                saturationShift: -0.7, //饱和度偏移将应用于大气。默认为0.0（无移位）。-1.0的饱和度偏移是单色的。
                brightnessShift: -0.33, //亮度变化适用于大气。默认为0.0（无移位）。-1.0的亮度偏移是完全黑暗，这将使空间显示出来。
            },
            fog: { //雾
                density: 0.001, //确定雾的密度的标量。默认值2.0e-4
                minimumBrightness: 0.8, //照明产生的雾色的最小亮度。值为0.0可能会使雾完全变黑。值为1.0完全不会影响亮度。
            },
            image: "", //【必需】贴图
            minimumImageSize: [12.0, 12.0], //图片尺寸 width & height 最小 单位像素
            maximumImageSize: [24.0, 24.0], //图片尺寸 width & height 最大 单位像素
            startScale: 0.5, //粒子出生时大小倍率
            endScale: 1.0, //粒子死亡时大小倍率
            emitterType: 3, //发射器类型：0：BoxEmitter 盒式，1：CircleEmitter 圆形，2：ConeEmitter 圆锥，3：SphereEmitter 球体
            emitterRadian: 10000.0, //发射器张角
            startColor: Cesium.Color.WHITE.withAlpha(0.3), //开始颜色
            endColor: Cesium.Color.WHITE.withAlpha(0.7), //结束颜色
            emissionRate: 9000.0, //粒子发射频率
            lifetime: 20.0, //粒子生命周期 单位秒
            loop: true, //是否循环，设为false，生命周期结束的粒子也结束了
            speedRange: [-0.1, 0.0], //速度范围

            position: [0, 0, 0], // 【可选】位置 WGS84 坐标【经纬度（角度）、高程】，不设置默认采用相机当前位置
            positionOffset: [0, 0, 0], //偏移

            gravity: -9.8, //重力作用
            // updateCallback: rainUpdate
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

            position: [0, 0, 0], //【必需】位置 WGS84 坐标【经纬度（角度）、高程】，也能传入3D模型，将取模型中点位置
            positionOffset: [0, 0, 0], //偏移

            gravity: 0, //重力作用
        },
        smoke: { //烟雾
            image: "", //【必需】贴图
            minimumImageSize: [20.0, 20.0], //图片尺寸 width & height 最小 单位像素
            maximumImageSize: [40.0, 40.0], //图片尺寸 width & height 最大 单位像素
            startScale: 1.0, //粒子出生时大小倍率
            endScale: 6.0, //粒子死亡时大小倍率
            emitterType: 2, //发射器类型：0：BoxEmitter 盒式，1：CircleEmitter 圆形，2：ConeEmitter 圆锥，3：SphereEmitter 球体
            emitterRadian: 20.0, //发射器张角
            startColor: Cesium.Color.BLACK.withAlpha(0.7), //开始颜色
            endColor: Cesium.Color.BLACK.withAlpha(0.0), //结束颜色
            emissionRate: 15, //粒子发射速率
            lifetime: 60.0, //粒子生命周期 单位秒
            loop: true, //是否循环，设为false，生命周期结束的粒子也结束了
            speedRange: [0.5, 1.5], //速度范围

            position: [0, 0, 0], //【必需】位置 WGS84 坐标【经纬度（角度）、高程】，也能传入3D模型，将取模型中点位置
            positionOffset: [0, 0, 0], //偏移

            gravity: 0, //重力作用
        },
        fountain: { //喷泉
            image: "", //【必需】贴图
            minimumImageSize: [5.0, 5.0], //图片尺寸 width & height 最小 单位像素
            maximumImageSize: [10.0, 10.0], //图片尺寸 width & height 最大 单位像素
            startScale: 1.0, //粒子出生时大小倍率
            endScale: 20.0, //粒子死亡时大小倍率
            emitterType: 2, //发射器类型：0：BoxEmitter 盒式，1：CircleEmitter 圆形，2：ConeEmitter 圆锥，3：SphereEmitter 球体
            emitterRadian: 6.0, //发射器张角
            startColor: new Cesium.Color(1, 1, 1, 0.8), //开始颜色
            endColor: new Cesium.Color(0.80, 0.86, 1, 0.6), //结束颜色
            emissionRate: 100, //粒子发射速率
            lifetime: 16.0, //粒子生命周期 单位秒
            loop: true, //是否循环，设为false，生命周期结束的粒子也结束了
            speedRange: [9, 9.5], //速度范围

            position: [0, 0, 0], //【必需】位置 WGS84 坐标【经纬度（角度）、高程】，也能传入3D模型，将取模型中点位置
            positionOffset: [0, 0, 0], //偏移

            gravity: -3.5, //重力作用
        }
    }

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
        var _config = {}; //生效配置
        for (var i = 0; i < arguments.length; i++) {
            var item = arguments[i];
            // console.log(i, item);
            for (var o in item) {
                if (item.hasOwnProperty(o))
                    _config[o] = item[o];
            }
        }
        return _config;
    }
    /**
     * 更新粒子效果配置
     * @param {*} tag 
     * @param {*} config 配置
     */
    _.prototype.updateParticleSystem = function (tag, config) {
        if (particleSystems.hasOwnProperty(tag)) {
            var ps = particleSystems[tag];
            return updateConfig(tag, ps, config)
        }
        return null;
    }

    /**
     * 更新粒子效果配置
     * @param {*} tag 
     * @param {*} particleSystem 粒子对象
     * @param {*} config 配置
     */
    function updateConfig(tag, particleSystem, config) {
        if (Cesium.defined(particleSystem) &&
            particleSystem instanceof Cesium.ParticleSystem &&
            !particleSystem.isDestroyed()) {
            var _config = setConfigs(particleSystem.config, config)
            return makeParticleSystem(tag, particleSystem.psType, _config)


            // TODO
            // for (const key in config) {
            //     if (config.hasOwnProperty(key)) {
            //         var value = config[key];



            //         // minimumImageSize: [20.0, 20.0], //图片尺寸 width & height 最小 单位像素
            //         // maximumImageSize: [40.0, 40.0], //图片尺寸 width & height 最大 单位像素
            //         // startScale: 1.0, //粒子出生时大小倍率
            //         // endScale: 6.0, //粒子死亡时大小倍率
            //         // emitterType: 2, //发射器类型：0：BoxEmitter 盒式，1：CircleEmitter 圆形，2：ConeEmitter 圆锥，3：SphereEmitter 球体
            //         // emitterRadian: 20.0, //发射器张角
            //         // startColor: Cesium.Color.BLACK.withAlpha(0.7), //开始颜色
            //         // endColor: Cesium.Color.BLACK.withAlpha(0.0), //结束颜色
            //         // emissionRate: 20, //粒子发射速率
            //         // lifetime: 40.0, //粒子生命周期 单位秒
            //         // loop: true, //是否循环，设为false，生命周期结束的粒子也结束了
            //         // speedRange: [0.5, 1.5], //速度范围

            //         // position: [0, 0, 0], //【必需】位置 WGS84 坐标【经纬度（角度）、高程】，也能传入3D模型，将取模型中点位置
            //         // positionOffset: [0, 0, 0], //偏移

            //         // gravity: 0, //重力作用


            //     }

            //     particleSystem = new Cesium.ParticleSystem({
            //         //贴图
            //         image: _config.image,

            //         //粒子发射器 锥形发射器
            //         emitter: emitter,

            //         bursts: bursts,

            //         //颜色
            //         startColor: _config.startColor instanceof Cesium.Color ? _config.startColor : new Cesium.Color(_config.startColor[0], _config.startColor[1], _config.startColor[2], _config.startColor[3]),
            //         endColor: _config.endColor instanceof Cesium.Color ? _config.endColor : new Cesium.Color(_config.endColor[0], _config.endColor[1], _config.endColor[2], _config.endColor[3]),

            //         //尺寸
            //         startScale: _config.startScale,
            //         endScale: _config.endScale,
            //         minimumImageSize: new Cesium.Cartesian2(_config.minimumImageSize[0], _config.minimumImageSize[1]),
            //         maximumImageSize: new Cesium.Cartesian2(_config.maximumImageSize[0], _config.maximumImageSize[1]),

            //         //粒子生命周期
            //         lifetime: _config.lifetime,
            //         loop: _config.loop,

            //         //速度
            //         // speed: 5.0,
            //         minimumSpeed: _config.speedRange[0],
            //         maximumSpeed: _config.speedRange[1],

            //         //粒子产生速率  
            //         emissionRate: _config.emissionRate,

            //         //粒子发生位置
            //         modelMatrix: modelMatrix,
            //         //粒子发射器位置矩阵
            //         emitterModelMatrix: computeEmitterModelMatrix(_config.positionOffset[0], _config.positionOffset[1], _config.positionOffset[2]), //设置偏移为0
            //         updateCallback: rainUpdate,
            //     });
            // }

        }
        return null;
    }
    /**
     * 移除粒子效果
     */
    _.prototype.removeParticleSystem = function (tag) {
        if (particleSystems.hasOwnProperty(tag)) {
            var ps = particleSystems[tag];
            if (ps && ps instanceof Cesium.ParticleSystem && !ps.isDestroyed()) {
                // ps.destroy();
                // ps.show = false;
                if (_viewer.scene.primitives.contains(ps)) {
                    _viewer.scene.primitives.remove(ps);
                }

                if (ps.psType == "rain" || ps.psType == "snow") {
                    //天气类粒子效果需恢复天空
                    setSceneSkyAndFog(defaultSkyAndFog);
                }
            }
        }
    }
    /**
     * 清除所有粒子效果
     */
    _.prototype.cleanAllParticleSystem = function () {
        for (const key in particleSystems) {
            if (particleSystems.hasOwnProperty(key)) {
                var ps = particleSystems[key];
                if (ps && ps instanceof Cesium.ParticleSystem && !ps.isDestroyed()) {
                    // ps.destroy();
                    // ps.show = false;
                    if (_viewer.scene.primitives.contains(ps)) {
                        _viewer.scene.primitives.remove(ps);
                    }
                }
            }
        }
        setSceneSkyAndFog(defaultSkyAndFog);
    }

    /**
     * 计算坐标矩阵
     * @param {*} position Array(16) or Array(3) or Entity
     * @returns Cesium.Matrix4 4x4矩阵
     */
    function transformPosition(position) {
        var time = Cesium.JulianDate.now();
        if (position instanceof Cesium.Matrix4 && position.length == 16) { //4x4位置矩阵            
            return position;
        } else if (position instanceof Array && position.length == 16) { //长度16的数组            
            return Cesium.Matrix4.fromArray(position);
        } else if (position instanceof Array && position.length == 3) { //WGS84 坐标
            var wgs84 = new Cesium.Cartesian3(position[0], position[1], position[2]);
            return computeWgs84Matrix(wgs84, time);
        } else if (position instanceof Cesium.Cartesian3) { //笛卡尔坐标-世界坐标
            return computePositionMatrix(position, time);
        } else if (position instanceof Cesium.ConstantPositionProperty) { //模型的position属性
            return computePositionPropertyMatrix(position, time);
        } else { //传入模型
            var entity = position;
            if (!Cesium.defined(entity)) {
                return undefined;
            }
            return computeModelMatrix(entity, time);
        }
    }
    /**
     * 设置场景环境
     * @param {Onject} _config 配置
     */
    function setSceneSkyAndFog(_config) {
        if (Cesium.defined(_config.skyAtmosphere)) {
            if (Cesium.defined(_config.skyAtmosphere.hueShift)) {
                _scene.skyAtmosphere.hueShift = _config.skyAtmosphere.hueShift;
            }
            if (Cesium.defined(_config.skyAtmosphere.saturationShift)) {
                _scene.skyAtmosphere.saturationShift = _config.skyAtmosphere.saturationShift;
            }
            if (Cesium.defined(_config.skyAtmosphere.brightnessShift)) {
                _scene.skyAtmosphere.brightnessShift = _config.skyAtmosphere.brightnessShift;
            }
        }
        if (Cesium.defined(_config.fog)) {
            if (Cesium.defined(_config.fog.density)) {
                _scene.fog.density = _config.fog.density;
            }
            if (Cesium.defined(_config.fog.minimumBrightness)) {
                _scene.fog.minimumBrightness = _config.fog.minimumBrightness;
            }
        }
    }

    /**
     * 产出粒子
     * @param {*} tag 
     * @param {*} psType 粒子类型
     * @param {Object} _config 配置
     */
    function makeParticleSystem(tag, psType, _config) {
        console.log(tag, _config);
        setSceneSkyAndFog(_config);
        if (!Cesium.defined(_config.image)) {
            console.error("image must not be null.");
            return;
        }
        if (!Cesium.defined(_config.position)) {
            console.error("position must not be null.");
            return;
        }

        var startColor = _config.startColor instanceof Cesium.Color ? _config.startColor :
            new Cesium.Color(_config.startColor[0], _config.startColor[1], _config.startColor[2], _config.startColor[3]);
        var endColor = _config.endColor instanceof Cesium.Color ? _config.endColor :
            new Cesium.Color(_config.endColor[0], _config.endColor[1], _config.endColor[2], _config.endColor[3]);


        var emitter;
        if (Cesium.defined(_config.emitterType)) { //使用内置发射器
            switch (_config.emitterType) {
                case 0: //盒式发射器
                    emitter = new Cesium.BoxEmitter(new Cesium.Cartesian3(_config.emitterRadian, _config.emitterRadian, _config.emitterRadian));
                    break;
                case 1: //圆形发射器
                    emitter = new Cesium.CircleEmitter(_config.emitterRadian);
                    break;
                case 2: //圆锥形发射器
                    emitter = new Cesium.ConeEmitter(Cesium.Math.toRadians(_config.emitterRadian));
                    break;
                case 3: //球体发射器
                    emitter = new Cesium.SphereEmitter(_config.emitterRadian);
                    break;
                default:
                    break;
            }
        } else if (Cesium.defined(_config.emitterCustom)) { //自定义发射器
            emitter = _config.emitterCustom;
        } else { //无效发射器
            console.error("emitter must not be null.");
            return;
        }

        //表示在系统生命周期中给定时间的粒子系统中的粒子爆发。 控制每隔n秒发射m个粒子，从而改变系统中粒子的密度。
        var bursts = [];
        if (Cesium.defined(_config.bursts) && _config.bursts instanceof Array && _config.bursts.length > 0) {
            for (let index = 0; index < _config.bursts.length; index++) {
                var burst = _config.bursts[index];
                if (Cesium.defined(burst)) {
                    bursts.push(new Cesium.ParticleBurst({
                        time: burst.time,
                        minimum: burst.minimum,
                        maximum: burst.maximum
                    }));
                }
            }
        }
        var particleSystem;
        switch (psType) {
            case "rain": //天气-雨
            case "snow": //天气-雪
                //#region 创建天气雨雪
                var position
                if (Cesium.defined(_config.position) &&
                    Cesium.Cartesian3.distanceSquared(_config.position, new Cesium.Cartesian3()) > 0) {
                    //WGS84 转 Cartesian3
                    position = Cesium.Cartesian3.fromDegrees(
                        _config.position[0] /*longitude*/ ,
                        _config.position[1] /*longitude*/ ,
                        _config.position[2] /*height*/ );
                } else {
                    position = _camera.position;
                }

                var modelMatrix = new Cesium.Matrix4.fromTranslation(position);

                if (!(modelMatrix && modelMatrix instanceof Cesium.Matrix4 && modelMatrix.length == 16)) { //4x4位置矩阵    
                    //无效位置矩阵
                    return;
                }

                //重力作用
                if (!Cesium.defined(_config.gravity)) {
                    _config.gravity = -9.8;
                }

                var rainUpdate = function (particle, dt) {
                    var rainGravityScratch = new Cesium.Cartesian3();
                    rainGravityScratch = Cesium.Cartesian3.normalize(particle.position, rainGravityScratch);
                    rainGravityScratch = Cesium.Cartesian3.multiplyByScalar(
                        rainGravityScratch,
                        // -1050.0,
                        -_config.gravity * _config.gravity * dt,
                        rainGravityScratch
                    );

                    particle.position = Cesium.Cartesian3.add(particle.position, rainGravityScratch,
                        particle.position);

                    var distance = Cesium.Cartesian3.distance(_camera.position, particle.position);
                    if (distance > _config.emitterRadian) {
                        particle.endColor.alpha = 0.0;
                    } else {
                        particle.endColor.alpha = endColor.alpha / (distance /
                            _config.emitterRadian + 0.1);
                    }
                };

                // var snowUpdate = function (particle, dt) {
                //     var snowGravityScratch = new Cesium.Cartesian3();
                //     snowGravityScratch = Cesium.Cartesian3.normalize(particle.position, snowGravityScratch);
                //     Cesium.Cartesian3.multiplyByScalar(
                //         snowGravityScratch,
                //         // Cesium.Math.randomBetween(-30.0, -300.0),
                //         -_config.gravity * _config.gravity * dt,
                //         snowGravityScratch
                //     );
                //     particle.velocity = Cesium.Cartesian3.add(particle.velocity, snowGravityScratch,
                //         particle.velocity);

                //     var distance = Cesium.Cartesian3.distance(_camera.position, particle.position);
                //     if (distance > _config.emitterRadian) {
                //         particle.endColor.alpha = 0.0;
                //     } else {
                //         particle.endColor.alpha = endColor.alpha / (distance /
                //             _config.emitterRadian + 0.1);
                //     }
                // };


                particleSystem = new Cesium.ParticleSystem({
                    //贴图
                    image: _config.image,

                    //粒子发射器 锥形发射器
                    emitter: emitter,

                    bursts: bursts,

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
                    modelMatrix: modelMatrix,
                    //粒子发射器位置矩阵
                    emitterModelMatrix: computeEmitterModelMatrix(_config.positionOffset[0], _config.positionOffset[1], _config.positionOffset[2]), //设置偏移为0
                    updateCallback: rainUpdate,
                });
                //#endregion
                break;
            case "fire": //火焰
            case "smoke": //烟雾
            case "fountain": //喷泉
                //#region 创建火焰/烟雾粒子
                var modelMatrix = transformPosition(_config.position);

                if (!(modelMatrix && modelMatrix instanceof Cesium.Matrix4 && modelMatrix.length == 16)) { //4x4位置矩阵    
                    //无效位置矩阵
                    return;
                }

                //重力作用
                if (!Cesium.defined(_config.gravity)) {
                    _config.gravity = 0;
                }

                /**
                 * 用于在每个时间步修改粒子属性的函数。这可以包括力的修改，颜色，大小等。
                 * @param {Particle} particle 正在更新的粒子。
                 * @param {Number} dt 自上次更新以来的时间（以秒为单位）。
                 */
                var applyGravity = function (particle, dt) {
                    var gravityScratch = new Cesium.Cartesian3();
                    // 计算每个粒子的向上向量（相对地心） 
                    var position = particle.position;
                    Cesium.Cartesian3.normalize(position, gravityScratch);
                    Cesium.Cartesian3.multiplyByScalar(gravityScratch, _config.gravity * dt, gravityScratch);
                    particle.velocity = Cesium.Cartesian3.add(particle.velocity, gravityScratch, particle.velocity);
                }

                particleSystem = new Cesium.ParticleSystem({
                    //贴图
                    image: _config.image,

                    //粒子发射器 锥形发射器
                    emitter: emitter,

                    bursts: bursts,

                    //颜色
                    startColor: _config.startColor instanceof Cesium.Color ? _config.startColor : new Cesium.Color(_config.startColor[0], _config.startColor[1], _config.startColor[2], _config.startColor[3]),
                    endColor: _config.endColor instanceof Cesium.Color ? _config.endColor : new Cesium.Color(_config.endColor[0], _config.endColor[1], _config.endColor[2], _config.endColor[3]),

                    //尺寸
                    startScale: _config.startScale,
                    endScale: _config.endScale,
                    minimumImageSize: new Cesium.Cartesian2(_config.minimumImageSize[0], _config.minimumImageSize[0]),
                    maximumImageSize: new Cesium.Cartesian2(_config.maximumImageSize[1], _config.maximumImageSize[1]),

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
                    modelMatrix: modelMatrix,
                    //粒子发射器位置矩阵
                    emitterModelMatrix: computeEmitterModelMatrix(_config.positionOffset[0], _config.positionOffset[1], _config.positionOffset[2]), //设置偏移为0
                    updateCallback: applyGravity,
                });
                //#endregion
                break;
            default:
                break;
        }

        if (Cesium.defined(particleSystem)) {
            if (Cesium.defined(particleSystems[tag])) {
                particleSystems[tag].show = false;
            }
            // 配置暂存在对象中
            particleSystem.config = _config;
            particleSystem.psType = psType;
            // 已生成的粒子记录下来
            particleSystems[tag] = particleSystem;
            // console.log(particleSystems);
            return _viewer.scene.primitives.add(particleSystem);
        } else return null;
    }
    /**
     * 产出粒子(对外暴露API)
     * @param {*} tag 
     * @param {String} psType 粒子类型
     * @param {Object} config 配置
     */
    _.prototype.addParticleSystem = function (tag, psType, config) {
        var _config = {};
        switch (psType) {
            case "rain": //天气-雨
                _config = setConfigs(defaultConfig.rain, config);
                break;
            case "snow": //天气-雪
                _config = setConfigs(defaultConfig.snow, config);
                break;
            case "fire": //火焰
                _config = setConfigs(defaultConfig.fire, config);
                break;
            case "smoke": //烟雾
                _config = setConfigs(defaultConfig.smoke, config);
                break;
            case "fountain": //喷泉
                _config = setConfigs(defaultConfig.fountain, config);
                break;
        }
        //配置已合并存在 _config 中。
        // console.log(tag, _config);

        return makeParticleSystem(tag, psType, _config);
    }

    //#region 工具方法

    /**
     * 计算当前时间点飞机模型的位置矩阵
     * @param {Cesium.Entity} entity 3D实体
     * @param {Number} time 时间：Cesium.JulianDate.now()
     */
    function computeModelMatrix(entity, time) {
        try {
            if (!Cesium.defined(entity)) {
                return undefined;
            }

            if (!Cesium.defined(time)) {
                time = Cesium.JulianDate.now();
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
        } catch (error) {
            console.error(error);
        }
        return undefined;
    }
    /**
     * 根据位置坐标（WGS84）计算当前时间点飞机模型的位置矩阵
     * @param {Cesium.Cartesian3} wgs84 Wgs84经纬度坐标（角度制）
     * @param {Number} time 时间：Cesium.JulianDate.now()
     */
    function computeWgs84Matrix(wgs84, time) {
        //WGS84 转 Cartesian3
        var positionCartesian3 = Cesium.Cartesian3.fromDegrees(wgs84.x /*longitude*/ , wgs84.y /*longitude*/ , wgs84.z /*height*/ );
        return computePositionMatrix(positionCartesian3, time)
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

        // return new Cesium.Matrix4.fromTranslation(position);
    }
    /**
     * 根据ConstantPositionProperty计算当前时间点飞机模型的位置矩阵
     * @param {Cesium.ConstantPositionProperty} positionProperty 
     * @param {Number} time 时间：Cesium.JulianDate.now()
     */
    function computePositionPropertyMatrix(positionProperty, time) {
        if (!Cesium.defined(positionProperty)) {
            console.error("positionProperty must not be null.");
        }
        if (!Cesium.defined(time)) {
            time = Cesium.JulianDate.now();
        }
        //获取位置
        var positionTmp = Cesium.Property.getValueOrUndefined(positionProperty, time, new Cesium.Cartesian3());
        if (!Cesium.defined(positionTmp)) {
            return undefined;
        }

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
    //#endregion

    return _;
})(window.Cesium || {});