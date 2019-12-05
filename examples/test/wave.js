var constructor_wv = function (settings, core) {
    return oCanvas.extend({
        core: core,
        shapeType: "rectangular",
        //init函数主要完成初始化工作
        init: function () {
            this.firstX = this.cells[0].x_cell;//起点的X坐标
            this.firstY = this.cells[0].y_cell;//起点的Y坐标
            this.lastX = this.cells[1].x_cell;//终点的X坐标
            this.lastY = this.cells[1].y_cell;//终点的Y坐标
            this.deta_x = this.cells[1].x_cell - this.cells[0].x_cell;//管道2点之间的X  矢量差
            this.deta_y = this.cells[1].y_cell - this.cells[0].y_cell;//管道2点之间的Y  矢量差
            this.deta = Math.sqrt(this.deta_x * this.deta_x + this.deta_y * this.deta_y);//管道2点之间距离
            this.deta_cos = this.deta_x / this.deta;//余弦
            this.deta_sin = this.deta_y / this.deta;//正弦
        },
        //advance函数主要实现每次动画的刷新步进操作
        advance: function () {
            if (this.paused == 0) {
                if(this.flowDirection==1){
                    var indexPY = this.maxPY; //起点偏移量  也就是说起点的X值偏移了多少

                    this.indexPY = this.indexPY - this.Speed;
                    if (this.indexPY >= Math.PI) {
                        this.indexPY = this.maxPY;
                    }
                }
                else{
                    var indexPY = -this.maxPY; //起点偏移量  也就是说起点的X值偏移了多少
                    this.indexPY = this.indexPY + this.Speed;
                    if (this.indexPY >= -Math.PI) {
                        this.indexPY = -this.maxPY;
                    }
                }

            }

        },
        //draw函数在每次advance之后执行，将每次的步进更新重新绘制到画布上
        draw: function () {
            var canvas = this.core.canvas;
            canvas.beginPath();
            canvas.fillStyle = this.fill;
            canvas.strokeStyle = this.stroke;
            for (var i = this.firstX; i < this.deta +this.firstX; i = i + 10) {

                //x1,y1,绕平面上另一点x2,y2
                /*y=(y1-y2)cosθ+(x1-x2)sinθ+y2
                x=(x1-x2)cosθ-(y1-y2)sinθ+x2*/
                var x1= i, y1= Math.sin((x1-this.firstX)/this.indexCH+this.indexPY)*this.blHeight +this.firstY;
                var x2 = this.firstX, y2 = this.firstY;
                var y=(y1-y2)*this.deta_cos+(x1-x2)*this.deta_sin+y2;
                var x=(x1-x2)*this.deta_cos-(y1-y2)*this.deta_sin+x2;

                canvas.lineTo(x, y);
            }
            for (var i = this.deta+this.firstX; i > this.firstX; i = i - 10) {
                var x1= i, y1= Math.sin((x1-this.firstX)/this.indexCH+this.indexPY-Math.PI/3)*this.blHeight+this.firstY+this.LineHeight ;
                var x2 = this.firstX, y2 = this.firstY;
                var y=(y1-y2)*this.deta_cos+(x1-x2)*this.deta_sin+y2 ;
                var x=(x1-x2)*this.deta_cos-(y1-y2)*this.deta_sin+x2 ;
                canvas.lineTo(x, y);
            }
            canvas.fill();
            canvas.closePath();

        }
    }, settings);
};
oCanvas.registerDisplayObject("myWv", constructor_wv, "init");


