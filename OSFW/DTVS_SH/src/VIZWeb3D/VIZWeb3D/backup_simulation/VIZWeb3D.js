define([
    'VIZWeb3D/View'
],
    function (VIEW) {
        var scope = this;

        function VIZWeb3D(viewContainer) {
            this.Container = viewContainer;
            this.View = new VIEW(this.Container);
        }

        VIZWeb3D.prototype = {
            Constructor: VIZWeb3D,

            Container : null,
            View: null,
            Coordinate: null,
            Clipping: null,

            Init: function () {
                //this.View = new VIEW(this.Container);
                this.View.Init();
                this.Coordinate = this.View.Coordinate;
                this.Clipping = this.View.Clipping;
            },
            Animate: function () {
                this.View.Animate();
            }
        };
        return VIZWeb3D;
    }
);

