define(
    [
        'VIZWeb3D/VIZWeb3D',
        'VIZWeb3D/Enum'
    ],
    function (
        VIZWeb3D
    ) {
        function Softhills(viewContainer) {
            var scope = this;
            core = new VIZWeb3D(viewContainer);
            this.VIZCore = core;
        }

        Softhills.prototype = {
            Constructor: Softhills,
            VIZCore: null,
            Init: function () {
                core.Init();
                this.VIZCore = core;
                animate();
            },
        };

        function animate() {
            requestAnimationFrame(animate);
            core.Animate();
        }

        var init = function (viewContainer) {
            core.Init(viewContainer);
            this.VIZCore = core;
            animate();
        };

        return Softhills;
    }
);