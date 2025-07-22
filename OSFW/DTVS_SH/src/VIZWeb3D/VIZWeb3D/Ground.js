/**
 * @author jhjang@softhills.net
 */

VIZWeb3D.Ground = function (scene, orgModelBBox, orgModelCenter) {
    // Private
    var scope = this;
    var objGround = null;

    // API
    this.Option = {
        get 'Visible'() {
            return objGround.visible;
        },
        set 'Visible'(v) {
            objGround.visible = v;
        }
    };

    // Function
    init();
    function init() {
        objGround = new THREE.Object3D();

        // 좌표 평면 추가
        var offset = 2.2;
        var distanceX = orgModelBBox.max.x - orgModelBBox.min.x;
        var distanceY = orgModelBBox.max.y - orgModelBBox.min.y;
        var distanceCenter = (orgModelBBox.max.z - orgModelBBox.min.z) / 2;
        var distance = null;
        distanceX = distanceX + (distanceX * offset);
        distanceY = distanceY + (distanceY * offset);

        if (distanceX > distanceY)
            distance = distanceX;
        else
            distance = distanceY;

        var ground = new THREE.Mesh(new THREE.PlaneBufferGeometry(distance, distance), new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false, side: THREE.DoubleSide }));
        var vPos = new THREE.Vector3(orgModelCenter.x, orgModelCenter.y, orgModelCenter.z - distanceCenter);
        ground.position.copy(vPos);

        ground.receiveShadow = true;
        objGround.add(ground);

        var grid = new THREE.GridHelper(distance, 20, 0x000000, 0x000000);
        grid.material.opacity = 0.2;
        //grid.material.transparent = true;
        grid.side = THREE.DoubleSide;
        grid.rotation.x = - Math.PI / 2;
        grid.position.copy(vPos);
        objGround.add(grid);

        objGround.visible = visible_ground;
        scene.add(objGround);
    }
};