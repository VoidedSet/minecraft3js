import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { PlayerPhysics } from './PlayerPhysics';
import { UI } from './UI';
import { Raycaster } from './Raycast';
import { PlayerMovement } from './PlayerMovement';

export class Player {
    constructor(scene, camera, chunkManager, world) {
        this.scene = scene;
        this.camera = camera;
        this.chunkManager = chunkManager;
        this.debugRay = true;

        this.controls = new PointerLockControls(camera, document.body);
        scene.add(this.controls.object);

        world.safeSpawn(this);


        this.position = this.controls.object.position.clone();

        this.UI = new UI(this.controls);
        this.physics = new PlayerPhysics(this, this.chunkManager)
        this.movement = new PlayerMovement(this);

        // this.world.safeSpawn(this)

        this.marker = new THREE.Mesh(
            new THREE.BoxGeometry(1.01, 1.01, 1.01),
            new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.05 })
        );
        this.marker.visible = false;
        this.marker.renderOrder = 3;
        this.scene.add(this.marker);

        this.initAim();

        console.log(this)
    }

    initAim() {

        document.addEventListener('mousedown', (event) => {
            if (!this.controls.isLocked) return;

            const dir = new THREE.Vector3();
            this.camera.getWorldDirection(dir);

            const origin = this.camera.position.clone();

            const result = Raycaster.raycastVoxel(origin, dir, 8, (pos) => {
                return this.chunkManager.returnBlockId(pos); // Your block getter
            });

            if (!result) return;

            const { hitPos, placePos } = result;
            const blockId = this.chunkManager.returnBlockId(hitPos);
            let light;
            switch (event.button) {
                case 0: // Left click - place
                    if (this.UI.hotbar[this.UI.selectedSlot] == 10) {
                        light = new THREE.PointLight(0xffff00, 8, 10);
                        this.scene.add(light)
                        light.position.set(placePos.x + 0.5, placePos.y + 1, placePos.z + 0.5)
                    }
                    this.chunkManager.placeBlockAt(this.UI.hotbar[this.UI.selectedSlot], placePos)

                    break;
                case 2: // Right click - break
                    if (this.chunkManager.returnBlockId(hitPos) === 10) {
                        this.scene.remove(light);
                        console.log(light)
                    }

                    this.chunkManager.placeBlockAt(0, hitPos);
                    break;
                case 1: // Middle click - pick
                    this.UI.setHotbarSlot(blockId);
                    break;
            }
        });
    }

    update(delta) {
        this.movement.update(delta);

        // Raycast for marker
        const origin = this.camera.getWorldPosition(new THREE.Vector3()).add(
            this.camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(0.01)
        );
        const dir = this.camera.getWorldDirection(new THREE.Vector3()).normalize();
        const result = Raycaster.raycastVoxel(origin, dir, 8, pos => this.chunkManager.returnBlockId(pos));

        if (result) {
            this.marker.position.set(
                result.hitPos.x + 0.5,
                result.hitPos.y + 0.5,
                result.hitPos.z + 0.5
            );
            this.marker.visible = true;
        } else {
            this.marker.visible = false;
        }
    }

    getControls() {
        return this.controls;
    }
}
