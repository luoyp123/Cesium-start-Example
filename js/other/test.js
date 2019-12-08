/***
 * @nanme 卫星扫描
 * @entity 扫描物实体
 * @satellite 卫星实体
 * 
 * 来自 http://www.freesion.com/article/174055756/
 * 
 * @version v1
 */
var _CesiumSatellite = (function () {
    var viewer, _cesiumRadar, entitys = [];

    function _() {}

    _.init = function (param) {
        if (null === param || undefined === param) return;
        var t = this;
        for (var key in param) {
            t[key] = param[key];
        }

        this.config();
    }
    _.config = function () {
        var _self = this;
        _self.createtoolbar();
        var viewModel = {
            entitySlices: _self.entitySlices,
            entityColor: _self.entityColor,
            RadarRPC: _self.RadarRPC
        };
        Cesium.knockout.track(viewModel);
        var toolbar = document.getElementById('toolbar');
        Cesium.knockout.applyBindings(viewModel, toolbar);

        var subscribeParameter = function (name) {
            Cesium.knockout.getObservable(viewModel, name).subscribe(
                function (newValue) {
                    _self.controller({
                        key: name,
                        value: newValue
                    });
                }
            );
        }
        subscribeParameter('entitySlices');
        subscribeParameter('entityColor');
        subscribeParameter('RadarRPC');

        this.clickButton();
    }

    _.build = function (param) {
        var t = this;
        viewer = this.viewer, this.popParam = param.popParam;
        try {
            switch (t.handleType) {
                case "": {
                    break;
                }
                default: {
                    t.createSatellite();
                }
            }
        } catch (error) {
            console.log("error mannager:" + error);
        }
    }
    _.createSatellite = function () {
        var t = this;
        viewer.dataSources.add(Cesium.CzmlDataSource.load(t.sources)).then(function (dataSource) { //czml文件
            try {
                t.satellite = dataSource;

                t.createRadar();

                t.add();

                t.click();
            } catch (e) {
                console.log(e);
            }

        });
    }
    _.createRadar = function () { //创建地面雷达
        _cesiumRadar = new CesiumRadar();
        _cesiumRadar.init({
            viewer: this.viewer,
            pixelRange: 15,
            minimumClusterSize: 3,
            enabled: false,
            showtoolbar: false
        });
        _cesiumRadar.build({
            handleType: "def",
            kml: '../../Apps/SampleData/kml/facilities/facilities.kml'
        });
    }
    _.createEntity = function (height) { //创建扫描物
        var _self = this;
        var param = {
            length: Math.max.apply(null, height),
            slices: _self.entitySlices,
            material: _self.entityColor
        }
        entity = new _cesiumTool({
            viewer: this.viewer
        }).createEntity({
            handleType: "cylinder",
            p: param
        });
        return entity;
    }
    /**
     * CZML是一种JSON格式的字符串，用于描述与时间有关的动画场景，
     * CZML包含点、线、地标、模型、和其他的一些图形元素，并指明了这些元素如何随时间而变化。
     * 某种程度上说, Cesium 和 CZML的关系就像 Google Earth 和 KML。
     * 
     * 其中如动图所示，扫描的样式是用cylinder做的，这个后续会再完善成波纹形状；
     * 主要还是运用了sampleproperty，将卫星运动的time和position也绑定到cylinder上，
     * 并且将cylinder的高度修改为卫星的一半；
     * @property 动态物
     */
    _.add = function () { //绑定卫星
        var satellites = this.satellite;
        if (satellites === null) return;
        var ids = this.ids;
        timeNum = this.timeNum;
        for (var i in ids) {
            var satellite = satellites.entities.getById(ids[i]);
            var property = new Cesium.SampledPositionProperty();
            var height = [];
            //将提供的秒数添加到提供的日期实例 格式化日期
            for (var ind = 0; ind < timeNum; ind++) { //300 * n 秒数
                //结束时间
                var time = Cesium.JulianDate.addSeconds(viewer.clock.startTime, 300 * ind, new Cesium.JulianDate());
                //获取结束时间的位置
                var position = satellite.position.getValue(time); //satellite的属性
                //获取移动运动点
                var cartographic = viewer.scene.globe.ellipsoid.cartesianToCartographic(position);
                var lat = Cesium.Math.toDegrees(cartographic.latitude),
                    lng = Cesium.Math.toDegrees(cartographic.longitude),
                    hei = cartographic.height / 2;
                height.push(cartographic.height);
                //绑定卫星点    
                property.addSample(time, Cesium.Cartesian3.fromDegrees(lng, lat, hei));
            }
            var entity = this.createEntity(height);
            //设置插值位置时使用的算法和度数。
            entity.position = property;
            entity.position.setInterpolationOptions({ //设定位置的插值算法
                interpolationDegree: 5,
                interpolationAlgorithm: Cesium.LagrangePolynomialApproximation
            });
            entitys.push(entity);
        }
    }
    _.controller = function (obj) {
        if (obj == null) return;
        var key = obj.key,
            value = parseInt(obj.value);
        var change = function (geom, property, value) {
            for (var i in entitys) {
                entitys[i][geom][property] = value;
            }
        }
        if ("entitySlices" == key) change("cylinder", "slices", value);
        if ("entityColor" == key) change("cylinder", "material", new _cesiumTool({
            viewer: viewer
        }).getColor(value));
        if ("RadarRPC" == key) _cesiumRadar.setPixelRange(value);
    }
    _.click = function () {
        var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas),
            _self = this;
        handler.setInputAction(function (movement) {
            try {
                var pickedLabel = viewer.scene.pick(movement.position);
                if (Cesium.defined(pickedLabel)) {
                    var featrue = pickedLabel.id;
                    if (featrue == null) return;
                    _PopController.init({
                        featrue: featrue,
                        paramArr: _self.popParam //build穿的参数

                    });
                    _PopController.show()
                }
            } catch (error) {
                console.log(error);
            }

        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }
    _.clickButton = function () {
        var t = this;
        $("._button").prop("checked", true);
        $('[type="checkbox"]').click(function () {
            var name = $(this).attr('name');
            if ("satellite" == name) {
                t[name].show = !t[name].show;
            } else if ("radar" == name) {
                _cesiumRadar._raderData.show = !_cesiumRadar._raderData.show;
            } else if ("entity") {
                for (var i in entitys) {
                    entitys[i].show = !entitys[i].show;
                }
            }

        })
    }
    _.createtoolbar = function () {
        var toolbar =
            '<div id="toolbar">' +
            '<table>' +
            '<tbody>' +
            '<tr>' +
            '<td>entity slices</td>' +
            '<td>' +
            '<input type="range" min="1" max="20" step="1" data-bind="value: entitySlices, valueUpdate: "input" ">' +
            '<input type="text" size="2" data-bind="value: entitySlices">' +
            '</td>' +
            '</tr>' +
            '<tr>' +
            '<td>entity Color</td>' +
            '<td>' +
            '<input type="range" min="0" max="147" step="1" data-bind="value: entityColor, valueUpdate: "input" ">' +
            '<input type="text" size="2" data-bind="value: entityColor">' +
            '</td>' +
            '</tr>' +
            '<tr>' +
            '<td>RadarRPC</td>' +
            '<td>' +
            '<input type="range" min="2" max="20" step="1" data-bind="value: RadarRPC, valueUpdate: "input" ">' +
            '<input type="text" size="2" data-bind="value: RadarRPC">' +
            '</td>' +
            '</tr>' +
            '</tbody>' +
            '</table>' +
            '<button type="button" class="cesium-button"><label><input type="checkbox" class="_button" flag="0" name="satellite">卫星</label></button>' +
            '<button type="button" class="cesium-button"><label><input type="checkbox" class="_button" flag="0" name="radar">雷达</label></button>' +
            '<button type="button" class="cesium-button"><label><input type="checkbox" class="_button" flag="0" name="entity">扫描物</label></button>' +
            '</div>';
        $("#toolbar").remove();
        $("body").append(toolbar);
        $("#toolbar").css("background", "rgba(42, 42, 42, 0.8)").css("padding", "4px;").css("border-radius", "4px");
        $("#toolbar input").css("vertical-align", "middle").css("padding-top", "2px").css("padding-bottom", "2px");
    }
    return _;
})();













//以entity方式添加到场景中

function doTest(points) {
    let curLinePointsArr = generateCurve(points);
    // 背景线
    viewer.entities.add({
        description: 'background-line',
        name: '测试流向',
        polyline: {
            width: 3,
            followSurface: true,
            positions: curLinePointsArr,
            /* material: new Cesium.PolylineGlowMaterialProperty({    
                                color: new Cesium.Color(255 / 255, 249 / 255, 0, 0.5)    
                            })*/
            material: new Cesium.PolylineDashMaterialProperty({
                color: new Cesium.Color(255 / 255, 249 / 255, 0, 0.5)
            })
        }
    });

    // 尾迹线
    viewer.entities.add({
        description: 'trail-line',
        name: 'test',
        polyline: {
            width: 5,
            positions: curLinePointsArr,
            material: new Cesium.PolylineTrailMaterialProperty({ // 尾迹线材质
                color: Cesium.Color.fromCssColorString("rgba(118, 233, 241, 1.0)"),
                trailLength: 0.2,
                period: 5.0
            })
        }
    });

    points.forEach(function (point) {
        var cartesian = Cesium.Cartesian3.fromDegrees(point.x, point.y, point.z);
        viewer.entities.add({
            position: cartesian,
            point: {
                color: Cesium.Color.Blue,
                pixelSize: 20,
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
            }
        });
    });
}

//生成样条曲线，返回坐标数组

function generateCurve(points) {
    var cartesian3s = [];
    var times = [];
    var time = 0;
    points.forEach(function (point) {
        cartesian3s.push(Cesium.Cartesian3.fromDegrees(point.x, point.y, point.z));
        times.push(time);
        time += 0.1;
    });
    let spline = new Cesium.CatmullRomSpline({
        times: times,
        points: cartesian3s
    });

    let curvePointsArr = [];
    for (let i = 0, len = times.length; i < len; i++) {
        curvePointsArr.push(spline.evaluate(times[i]));
    }
    return curvePointsArr;
}















/**
 * https://blog.csdn.net/weixin_44265800/article/details/103106321
 * @param {Array<Float>} lats 经度数组
 * @param {Array<Float>} lngs 纬度数组
 * @param {Array<Float>} values 已知的值数组
 * @param {Array<Float>} coords 一个cesium的数据格式，[114,25,114,23,114,22],不用闭合，就一个面上所有点。
 * @param {Object<geojson>} ex 普通的geojson格式的面的格式的coordinates。
 */
function drawKriging(lats, lngs, values, coords, ex) {
    if (values.length > 3) {
        let colors = [
            "#006837", "#1a9850", "#66bd63", "#a6d96a", "#d9ef8b", "#ffffbf",
            "#fee08b", "#fdae61", "#f46d43", "#d73027", "#a50026"
        ];
        const polygon = new Cesium.PolygonGeometry({
            polygonHierarchy: new Cesium.PolygonHierarchy(
                Cesium.Cartesian3.fromDegreesArray(coords)
            )
        }); //构造面，方便计算范围
        let extent = Cesium.PolygonGeometry.computeRectangle({
            polygonHierarchy: new Cesium.PolygonHierarchy(
                Cesium.Cartesian3.fromDegreesArray(coords)
            )
        }); //范围（弧度）
        let minx = Cesium.Math.toDegrees(extent.west); //转换为经纬度
        let miny = Cesium.Math.toDegrees(extent.south);
        let maxx = Cesium.Math.toDegrees(extent.east);
        let maxy = Cesium.Math.toDegrees(extent.north);
        let canvas = null; //画布
        function getCanvas() {
            //1.用克里金训练一个variogram对象
            let variogram = kriging.train(values, lngs, lats, 'exponential', 0, 100);
            //2.使用刚才的variogram对象使polygons描述的地理位置内的格网元素具备不一样的预测值；
            let grid = kriging.grid(ex, variogram, (maxy - miny) / 500);
            canvas = document.createElement('canvas');
            canvas.width = 800;
            canvas.height = 800;
            canvas.style.display = 'block';
            canvas.getContext('2d').globalAlpha = 0.75; //设置透明度
            //3.将得到的格网预测值渲染到canvas画布上
            kriging.plot(canvas, grid, [minx, maxx], [miny, maxy], colors);
        }

        getCanvas();
        if (canvas != null) {
            viewer.entities.add({
                polygon: {
                    hierarchy: {
                        positions: Cesium.Cartesian3.fromDegreesArray(coords)
                    },
                    material: new Cesium.ImageMaterialProperty({
                        image: canvas //使用贴图的方式将结果贴到面上
                    })
                }
            });
        }
    }
}