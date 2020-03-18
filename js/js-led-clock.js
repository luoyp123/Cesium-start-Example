/**
 * LED时钟
 * @nanme Sogrey
 * 
 * @version v1
 */
var LEDClock = (function (window) {
    var a = ["0 1 2 4 5 6", "2 5", "0 2 3 4 6", "0 2 3 5 6", "1 2 3 5", "0 1 3 5 6", "0 1 3 4 5 6", "0 2 5", "0 1 2 3 4 5 6", "0 1 2 3 5 6"];
    var b = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
    var backImg = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFUAAAASCAYAAAAqqJKOAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAABGdBTUEAALGOfPtRkwAAACBjSFJNAAB6JQAAgIMAAPn/AACA6QAAdTAAAOpgAAA6mAAAF2+SX8VGAAAAxElEQVR42mJUtuBgwAVEOAL/M4wCrODNj/WMuOQAAohpNEDJA/jCByCAmEYDlPoBCxBATKMBSv2ABQggptEApX7AAgQQ02iAUj9gAQKIaTRAqR+wAAHENBqg1A9YgABiGg0G6gOAABoNVBoAgAAaDVQaAIAAYsLX3RoF5HVfAQKIiVA/dhSQPh4AEEBMxAwQjALiAxQEAAKICZfEKCAvQEEAIICYCCkYBaQFKAgABBATsQpHAfHhBBBATKRqGAWEwwcgwAD/jDyHhccDLQAAAABJRU5ErkJggg==';
    var frontImg = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFUAAAASCAYAAAAqqJKOAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAABGdBTUEAALGOfPtRkwAAACBjSFJNAAB6JQAAgIMAAPn/AACA6QAAdTAAAOpgAAA6mAAAF2+SX8VGAAAAx0lEQVR42mJc/F+SARc4u/v+f4ZRgBUYuyoy4pIDCCCm0QAlD+ALH4AAYhoNUOoHLEAAMY0GKPUDFiCAmEYDlPoBCxBATKMBSv2ABQggptEApX7AAgQQY8GuH6MBSmUAEEBMo0FAfQAQQKOBSgMAEECjgUoDABBATPi6W6OAvO4rQAAxEerHjgLSxwMAAoiJmAGCUUB8gIIAQAAx4ZIYBeQFKAgABBATIQWjgLQABQGAAGIiVuEoID6cAAKIiVQNo4Bw+AAEGADGBToz9pejvAAAAABJRU5ErkJggg==';

    function showTime() {
        var time = new Date;
        var y = time.getFullYear();
        var M = time.getMonth();
        var d = time.getDate();
        var h = time.getHours();
        var m = time.getMinutes();
        var s = time.getSeconds();
        M = M + 1;
        var str = y.toString() + "年"
        if (M < 10)
            str = str + "0" + M.toString() + "月";
        else
            str = str + M.toString() + "月";
        if (d < 10)
            str = str + "0" + d.toString() + "日";
        else
            str = str + d.toString() + "日";

        document.getElementById("clock-date-ymd").innerHTML = str;
        document.getElementById("clock-date-week").innerHTML = b[time.getDay()%7];
        modiflyNum(1, parseInt(h / 10));
        modiflyNum(2, h % 10);
        modiflyNum(3, parseInt(m / 10));
        modiflyNum(4, m % 10);
        modiflyNum(5, parseInt(s / 10));
        modiflyNum(6, s % 10);
    }

    function modiflyNum(id, value) {
        var elm = document.getElementById('clock-time' + id.toString()).getElementsByTagName('li');
        var str = a[value];
        var cc = str.split(' ');
        for (var i = 0; i < 7; i++) {
            elm[i].getElementsByTagName('img')[0].src = backImg;
        }
        for (var i = 0; i < cc.length; i++) {
            elm[parseInt(cc[i])].getElementsByTagName('img')[0].src = frontImg;
        }
    }

    function _(divId) {
        if (divId) {
            var div = document.getElementById(divId);
            if (div) {
                div.innerHTML =`
                <style>
                *{margin:0;padding: 0;}
                .clock-wrap li{list-style-type: none;}
                .clock-wrap{width:250px;height:56px;}
                .clock-wrap .clock{height: 73px;}
                .clock-wrap .clock ul li{width: 24px;height: 54px;float: left;margin:0 6px;}
                .clock-wrap .clock ul li ul{position: relative;}
                .clock-wrap .clock ul li ul li{width:21px;height: 5px;display: block;}
                .clock-wrap .clock ul li ul li:nth-child(1){position:absolute;left: -6px;top:-9px;}
                .clock-wrap .clock ul li ul li:nth-child(2){ position:absolute; transform:rotateZ(90deg); left:-5px; top:17px; -webkit-transform:rotateZ(90deg); -moz-transform:rotateZ(90deg); -ms-transform:rotateZ(90deg); -o-transform:rotateZ(90deg); }
                .clock-wrap .clock ul li ul li:nth-child(3){position:absolute;transform:rotateZ(90deg);left:21px;top:17px;}
                .clock-wrap .clock ul li ul li:nth-child(4){position:absolute;top: 15px;left: -6px;}
                .clock-wrap .clock ul li ul li:nth-child(5){position:absolute;transform:rotateZ(90deg);top:42px;left:-5px;}
                .clock-wrap .clock ul li ul li:nth-child(6){position:absolute;transform:rotateZ(90deg);left:22px;top: 42px;}
                .clock-wrap .clock ul li ul li:nth-child(7){position:absolute;top:40px;left: -6px;}
                .clock-wrap .clock ul .point{width: 2px;position: relative;left: -4px;top: -2px;}
                .clock-wrap .clock ul .point span{display:block;height: 5px;width: 5px;background: #70baf8;margin:20px 2px;}
                .clock-wrap .date{position:relative; color: #70baf8; font-size:19px;}
                .clock-wrap .date span:first-child{float: left;margin-left: 3px;}
                .clock-wrap .date span:last-child{float: right;margin-right:10px;}
                </style>
                <div class="clock-wrap">
                    <div class="clock">
                        <ul>
                            <li>
                                <ul id="clock-time1">
                                    <li><img src="` + backImg + `" width="100%" height="100%"></li>
                                    <li><img src="` + backImg + `" width="100%" height="100%"></li>
                                    <li><img src="` + backImg + `" width="100%" height="100%"></li>
                                    <li><img src="` + backImg + `" width="100%" height="100%"></li>
                                    <li><img src="` + backImg + `" width="100%" height="100%"></li>
                                    <li><img src="` + backImg + `" width="100%" height="100%"></li>
                                    <li><img src="` + backImg + `" width="100%" height="100%"></li>
                                </ul>
                            </li>
                                    <li>
                                <ul id="clock-time2">
                                    <li><img src="` + backImg + `" width="100%" height="100%"></li>
                                    <li><img src="` + backImg + `" width="100%" height="100%"></li>
                                    <li><img src="` + backImg + `" width="100%" height="100%"></li>
                                    <li><img src="` + backImg + `" width="100%" height="100%"></li>
                                    <li><img src="` + backImg + `" width="100%" height="100%"></li>
                                    <li><img src="` + backImg + `" width="100%" height="100%"></li>
                                    <li><img src="` + backImg + `" width="100%" height="100%"></li>
                                </ul>
                            </li>
                            <li class="point"><span></span><span></span></li>
                                <li>
                                <ul id="clock-time3">
                                    <li><img src="` + backImg + `" width="100%" height="100%"></li>
                                    <li><img src="` + backImg + `" width="100%" height="100%"></li>
                                    <li><img src="` + backImg + `" width="100%" height="100%"></li>
                                    <li><img src="` + backImg + `" width="100%" height="100%"></li>
                                    <li><img src="` + backImg + `" width="100%" height="100%"></li>
                                    <li><img src="` + backImg + `" width="100%" height="100%"></li>
                                    <li><img src="` + backImg + `" width="100%" height="100%"></li>
                                </ul>
                            </li>
                            <li>
                                <ul id="clock-time4">
                                    <li><img src="` + backImg + `" width="100%" height="100%"></li>
                                    <li><img src="` + backImg + `" width="100%" height="100%"></li>
                                    <li><img src="` + backImg + `" width="100%" height="100%"></li>
                                    <li><img src="` + backImg + `" width="100%" height="100%"></li>
                                    <li><img src="` + backImg + `" width="100%" height="100%"></li>
                                    <li><img src="` + backImg + `" width="100%" height="100%"></li>
                                    <li><img src="` + backImg + `" width="100%" height="100%"></li>
                                </ul>
                            </li>
                            <li class="point"><span></span><span></span></li>
                                <li>
                                <ul id="clock-time5">
                                    <li><img src="` + backImg + `" width="100%" height="100%"></li>
                                    <li><img src="` + backImg + `" width="100%" height="100%"></li>
                                    <li><img src="` + backImg + `" width="100%" height="100%"></li>
                                    <li><img src="` + backImg + `" width="100%" height="100%"></li>
                                    <li><img src="` + backImg + `" width="100%" height="100%"></li>
                                    <li><img src="` + backImg + `" width="100%" height="100%"></li>
                                    <li><img src="` + backImg + `" width="100%" height="100%"></li>
                                </ul>
                            </li>
                                    <li>
                                <ul id="clock-time6">
                                    <li><img src="` + backImg + `" width="100%" height="100%"></li>
                                    <li><img src="` + backImg + `" width="100%" height="100%"></li>
                                    <li><img src="` + backImg + `" width="100%" height="100%"></li>
                                    <li><img src="` + backImg + `" width="100%" height="100%"></li>
                                    <li><img src="` + backImg + `" width="100%" height="100%"></li>
                                    <li><img src="` + backImg + `" width="100%" height="100%"></li>
                                    <li><img src="` + backImg + `" width="100%" height="100%"></li>
                                </ul>
                            </li>
                        </ul>
                    </div>
                    <div class="date">
                        <span id="clock-date-ymd">2015年12月11日</span>            
                        <span id="clock-date-week">星期三</span>
                    </div>
                </div>`;

                div.style = "position:fixed;background: transparent;";//自定义css
                showTime();
                setInterval(function () {
                    showTime();
                }, 1000);
            }
        }
    }

    return _;
})(window || {});