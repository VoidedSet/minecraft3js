import * as CANNON from 'cannon-es'

export default class Physics {
    constructor(player) {
        this.world = new CANNON.World();
        this.player = player;

        this.init()
    }

    init() {
        this.world.gravity.set(0, -9.82, 0);

        const playerShape = new CANNON.Sphere(0.5); // or a capsule if you want later
        const playerBody = new CANNON.Body({
            mass: 1,
            shape: playerShape,
            position: this.player.position,
            fixedRotation: true,
        });
        this.world.addBody(playerBody);

        console.log(this.world)
        console.log(this.player.position)
    }
}