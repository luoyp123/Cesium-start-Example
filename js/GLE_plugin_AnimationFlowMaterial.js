;
/**
 * 流动材质
 * @nanme Sogrey
 * 
 * @version v1.0.0
 * @param {Cesium.Viewer} Cesium
 */
GLEAnimationFlowMaterial = (function (Cesium) {
    var _viewer, _scene, _canvas, _camera;
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
    }
    _.prototype.config = function (options) {}


    // 流动纹理线  FlowLineMaterialProperty 图案、纹理自定义

    /*
    参数：

    时间间隔,默认值1e3
    贴图（图片链接、canvas base64）
    颜色，默认rgba(0,0,0,0)
    是否Y方向流动,默认否-X方向
    平铺方向：X or Y,默认X

    */

    // https://www.wellyyss.cn/ysCesium//plugins/ysc/ysc.js

    //#region 流动纹理线
    /*
     * 流动纹理线
     * color 颜色
     * duration 持续时间 毫秒
     */
    function FlowLineMaterialProperty(params) {
        //默认值
        this.defaultOption = {
            color: new Cesium.Color(0, 0, 0, 0),
            duration: 0,
            texture: drawCanvas(),
            isAxisY: false,
            repeat: false //X\Y\XY
        };

        //合并参数
        this.option = EXT().merge(this.defaultOption, params);

        this._definitionChanged = new Cesium.Event();
        this._color = undefined;
        this._colorSubscription = undefined;
        this.color = this.option.color;
        this.duration = this.option.duration;
        this._time = (new Date()).getTime();

        Cesium.Material.FlowLineImage = this.option.texture; // 设置材质贴图
    }

    Cesium.defineProperties(FlowLineMaterialProperty.prototype, {
        isConstant: {
            get: function () {
                return false;
            }
        },
        definitionChanged: {
            get: function () {
                return this._definitionChanged;
            }
        },
        color: Cesium.createPropertyDescriptor('color')
    });

    FlowLineMaterialProperty.prototype.getType = function (time) {
        return 'FlowLine';
    }

    FlowLineMaterialProperty.prototype.getValue = function (time, result) {
        if (!Cesium.defined(result)) {
            result = {};
        }

        result.color = Cesium.Property.getValueOrClonedDefault(this._color, time, Cesium.Color.WHITE, result.color);
        result.image = Cesium.Material.FlowLineImage;
        result.time = (((new Date()).getTime() - this._time) % this.duration) / this.duration;

        return result;
    }

    FlowLineMaterialProperty.prototype.equals = function (other) {
        return ((this === other) ||
            ((other instanceof FlowLineMaterialProperty) &&
                (Cesium.Property.equals(this._color, other._color))));
    }


    Cesium.FlowLineMaterialProperty = FlowLineMaterialProperty;
    Cesium.Material.FlowLineType = 'FlowLine';
    Cesium.Material.FlowLineImage = drawCanvas(); //'../../assets/img/p.png';    
    Cesium.Material.FlowLineSource = "czm_material czm_getMaterial(czm_materialInput materialInput)\n\
            {\n\
                czm_material material = czm_getDefaultMaterial(materialInput);\n\
                vec2 st = materialInput.st;\n\
                vec4 colorImage = texture2D(image, vec2(fract(st.s - time), st.t));\n\
                material.alpha = colorImage.a;\n\
                material.diffuse = (colorImage.rgb)/2.0;\n\
                return material;\n\
            }";

    // material.alpha = colorImage.a * color.a;\n\
    // material.diffuse = (colorImage.rgb+color.rgb)/2.0;\n\

    Cesium.Material._materialCache.addMaterial(Cesium.Material.FlowLineType, {
        fabric: {
            type: Cesium.Material.FlowLineType,
            uniforms: {
                color: new Cesium.Color(0, 0, 0, 0),
                image: Cesium.Material.FlowLineImage,
                time: 0
            },
            source: Cesium.Material.FlowLineSource
        },
        translucent: function (material) {
            return true;
        }
    });



    // getTemperatureGradientColors([
    //     0,0,0,
    //     255,0,0
    // ],2);
    /**
     * 
     * @param {*} colors 
     * @param {*} repetitions 
     */
    function getTemperatureGradientColors(colors, repetitions) {
        if (!colors || colors.length === 0 || !(colors.length % 3 === 0 || colors.length % 4 === 0)) {
            throw new Error("无效颜色值。颜色值数组长度应为3的倍数（RGB，比如 [255,0,0]）,或4的倍数（RGBA,比如 [255,0,0,0.3]）");
        }
        var colorList = [];
        if (colors.length % 3 == 0) { //RGB
            for (let i = 0; i < colors.length; i += 3) {
                colorList.push('rgb(' + colors[i] + ',' + colors[i + 1] + ',' + colors[i + 2] + ')');
            }
        } else if (colors.length % 4 == 0) { //RGBA
            for (let i = 0; i < colors.length; i += 4) {
                colorList.push('rgba(' + colors[i] + ',' + colors[i + 1] + ',' + colors[i + 2] + ',' + colors[i + 3] + ')');
            }
        }
        if (!repetitions || repetitions < 1) {
            repetitions = 1;
        }
        var snum = colorList.length * repetitions - 1;
        var step = 1.0 / snum;
        var startStop = 0.0;
        var result = [];
        for (let i = 0; i < repetitions; i++) {
            for (let j = 0; j < colorList.length; j++) {
                result.push({
                    stop: startStop,
                    color: colorList[j]
                });
                startStop += step;
            }
        }
        return result;
    }

    function drawCanvas(colors, repetitions) {
        var ColorStop = [{
            stop: 0,
            color: "rgba(255,255,0,0.2)"
        }, {
            stop: 1,
            color: "rgba(0,255,0,1)"
        }];
        if (colors && colors.length > 1 && repetitions) {
            ColorStop = getTemperatureGradientColors(colors, repetitions);
        }

        let canvas = document.createElement('canvas');
        canvas.width = 50;
        canvas.height = 50;
        let ctx = canvas.getContext('2d');
        let grd = ctx.createLinearGradient(0, 0, 50, 0);

        for (let i = 0; i < ColorStop.length; i++) {
            let item = ColorStop[i];
            grd.addColorStop(item.stop, item.color);
        }

        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, 50, 50);
        return canvas.toDataURL("image/png");
    }
    /**
     * 
     * @param {Cesium.Viewer} viewer 
     * @param {Cesium.Cartesian3} src 起点 经纬度高程
     * @param {Cesium.Cartesian3} dst 终点 经纬度高程
     * @param {Cesium.Color} color 颜色
     * @param {Number} duration 时间间隔
     */
    drawLine = function (viewer, src, dst, color, duration, colors, repetitions) {
        var curLinePointsArr = generateCurve(src, dst);
        if (!Cesium.defined(duration)) {
            duration = 20;
        }

        if (repetitions) {
            repetitions = Math.round(repetitions);
        }

        viewer.entities.add({
            description: 'trail-line',
            name: 'test',
            polyline: {
                clampToGround: true, //贴地
                width: 10,
                positions: curLinePointsArr,
                material: new Cesium.FlowLineMaterialProperty({
                    color: color,
                    texture: drawCanvas(colors, repetitions), //'../../assets/img/flow5.png',//
                    duration: duration
                })
            }
        });

        // viewer.entities.add({
        //     description: 'trail-line',
        //     name: 'test',
        //     polyline: {
        //         clampToGround: true, //贴地
        //         width: 10,
        //         positions: curLinePointsArr,
        //         material: new Cesium.Material({
        //             fabric : {
        //                 type : 'Color',
        //                 uniforms : {
        //                     color : new Cesium.Color(1.0, 1.0, 0.0, 1.0)
        //                 }
        //             }
        //         })
        //     }
        // });
        // viewer.entities[_0x42bb("0xc")]({
        //     name: x[_0x42bb("0x4")],
        //     polyline: {
        //         positions: Cesium[_0x42bb("0x15")][_0x42bb("0x29")]([117.204289, 31.763824, 32.05,
        //             117.228083, 31.791911, 41.73
        //         ]),
        //         width: 40,
        //         material: new(mars3d[_0x42bb("0x23")])({
        //             color: Cesium[_0x42bb("0x7")][_0x42bb("0xe")],
        //             duration: 1e3,
        //             url: _0x42bb("0x1c"),
        //             repeat: new(Cesium[_0x42bb("0x24")])(10, 1)
        //         })
        //     }
        // })
    }
    drawLine2 = function (viewer, positions, color, duration, colors, repetitions) {
        var curLinePointsArr = [];
        var cartesian3s = [];
        if (Cesium.defined(positions) && positions.length > 0) {
            for (let i = 0; i < positions.length; i += 3) {
                cartesian3s.push(new Cesium.Cartesian3(positions[i], positions[i + 1], positions[i + 2]));
            }
        }
        console.log(cartesian3s);
        if (cartesian3s.length >= 2) {
            for (let i = 0; i < cartesian3s.length-1; i++) {
                var curveArray = generateCurve(cartesian3s[i], cartesian3s[i + 1]);
                if(i == 0)
                curLinePointsArr = curLinePointsArr.concat(curveArray);
                else
                curLinePointsArr.push(curveArray[1]);
            }
        }

        if (!Cesium.defined(duration)) {
            duration = 20;
        }

        if (repetitions) {
            repetitions = Math.round(repetitions);
        }

        viewer.entities.add({
            description: 'trail-line',
            name: 'test',
            polyline: {
                clampToGround: true, //贴地
                width: 10,
                positions: curLinePointsArr,
                material: new Cesium.FlowLineMaterialProperty({
                    color: color,
                    texture: drawCanvas(colors, repetitions), //'../../assets/img/flow5.png',//
                    duration: duration
                })
            }
        });
    }


    function generateCurve(src, dst) {

        var cartesian3s = [];
        var times = [];
        var time = 0;
        var curvePointsArr = [];
        var spline;

        cartesian3s.push(Cesium.Cartesian3.fromDegrees(src.x, src.y, src.z));
        times.push(time);
        time += 1;

        cartesian3s.push(Cesium.Cartesian3.fromDegrees(dst.x, dst.y, dst.z));
        times.push(time);

        spline = new Cesium.CatmullRomSpline({
            times: times,
            points: cartesian3s
        });

        for (var i = 0, len = times.length; i < len; i++) {
            curvePointsArr.push(spline.evaluate(times[i]));
        }

        return curvePointsArr;
    }
    //#endregion

    //#region 雷达扫描
    function EllipsoidFadeMaterialProperty(color, duration) {
        this._definitionChanged = new Cesium.Event();
        this._color = undefined;
        this._colorSubscription = undefined;
        this.color = color;
        this.duration = duration;
        this._time = (new Date()).getTime();
    }
    Cesium.defineProperties(EllipsoidFadeMaterialProperty.prototype, {
        isConstant: {
            get: function () {
                return false;
            }
        },
        definitionChanged: {
            get: function () {
                return this._definitionChanged;
            }
        },
        color: Cesium.createPropertyDescriptor('color')
    });
    EllipsoidFadeMaterialProperty.prototype.getType = function (time) {
        return 'EllipsoidFade';
    }
    EllipsoidFadeMaterialProperty.prototype.getValue = function (time, result) {
        if (!Cesium.defined(result)) {
            result = {};
        }
        result.color = Cesium.Property.getValueOrClonedDefault(this._color, time, Cesium.Color.WHITE, result.color);

        result.time = (((new Date()).getTime() - this._time) % this.duration) / this.duration;
        return result;

        // return Cesium.defined(result) || (result = {}),
        //     result.color = Cesium.Property.getValueOrClonedDefault(this._color, time, Cesium.Color.WHITE, result.color),
        //     void 0 === this._time && (this._time = time.secondsOfDay),
        //     result.time = time.secondsOfDay - this._time,
        //     result
    }
    EllipsoidFadeMaterialProperty.prototype.equals = function (other) {
        return this === other ||
            (other instanceof EllipsoidFadeMaterialProperty &&
                Property.equals(this._color, other._color))
    }
    Cesium.EllipsoidFadeMaterialProperty = EllipsoidFadeMaterialProperty;
    Cesium.Material.EllipsoidFadeType = 'EllipsoidFade';
    Cesium.Material.EllipsoidFadeSource =
        "czm_material czm_getMaterial(czm_materialInput materialInput)\n" +
        "{\n" +
        "czm_material material = czm_getDefaultMaterial(materialInput);\n" +
        "material.diffuse = 1.5 * color.rgb;\n" +
        "vec2 st = materialInput.st;\n" +
        "float dis = distance(st, vec2(0.5, 0.5));\n" +
        "float per = fract(time);\n" +
        "if(dis > per * 0.5){\n" +
        "material.alpha = 0.0;\n" +
        "discard;\n" +
        "}else {\n" +
        "material.alpha = color.a  * dis / per / 1.0;\n" +
        "}\n" +
        "return material;\n" +
        "}";
    Cesium.Material._materialCache.addMaterial(Cesium.Material.EllipsoidFadeType, {
        fabric: {
            type: Cesium.Material.EllipsoidFadeType,
            uniforms: {
                color: new Cesium.Color(1.0, 0.0, 0.0, 1),
                time: 0
            },
            source: Cesium.Material.EllipsoidFadeSource
        },
        translucent: function (material) {
            return true;
        }
    });

    // viewer.entities.add({
    //     name: 'EllipsoidFade',
    //     position: Cesium.Cartesian3.fromDegrees(104.0, 30.0, 100.0),
    //     ellipse: {
    //         height: 0,
    //         semiMinorAxis: 30000.0,
    //         semiMajorAxis: 30000.0,
    //         material: new Cesium.EllipsoidFadeMaterialProperty(Cesium.Color.ORANGE, 2000)
    //     }
    // });
    //#endregion
    var init = function () {
        console.log("GLEAnimationFlowMaterial inited.");
    }
    init();
    // return _;
})(window.Cesium || {});