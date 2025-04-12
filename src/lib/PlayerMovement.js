import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { BlockDict } from './Blocks';

export class Player {
    constructor(scene, camera, chunkManager) {
        this.scene = scene;
        this.camera = camera;
        this.chunkManager = chunkManager;
        this.debugRay = true;

        this.controls = new PointerLockControls(camera, document.body);
        this.controls.object.position.set(0, 0, 0);
        scene.add(this.controls.object);
        this.position = this.controls.object.position;

        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canJump = false;

        this.hotbar = [1, 2, 3, 4, 5, 6, 7, 8, 11];
        this.selectedSlot = 0;
        this.maxSlots = 9;

        this.marker = new THREE.Mesh(
            new THREE.BoxGeometry(1.01, 1.01, 1.01),
            new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 })
        );
        this.marker.visible = false;
        this.marker.renderOrder = 3;
        this.scene.add(this.marker);

        this.initUI();
        this.initInput();
        this.initHotbarScroll();
        this.updateHotbarUI();
        this.initInventoryUI();
    }

    initUI() {
        const blocker = document.getElementById('blocker');
        const instructions = document.getElementById('instructions');
        const crosshair = document.getElementById('crosshair');

        instructions.addEventListener('click', () => this.controls.lock());

        this.controls.addEventListener('lock', () => {
            instructions.style.display = 'none';
            blocker.style.display = 'none';
            crosshair.style.display = 'block';
        });

        this.controls.addEventListener('unlock', () => {
            blocker.style.display = 'block';
            instructions.style.display = '';
            crosshair.style.display = 'none';
        });
    }

    raycastVoxel(origin, direction, maxDistance, getBlockAt) {
        const pos = origin.clone();

        const step = new THREE.Vector3(
            Math.sign(direction.x),
            Math.sign(direction.y),
            Math.sign(direction.z)
        );

        const tDelta = new THREE.Vector3(
            Math.abs(1 / direction.x),
            Math.abs(1 / direction.y),
            Math.abs(1 / direction.z)
        );

        // Floor current position to get voxel we're in
        const voxel = new THREE.Vector3(
            Math.floor(pos.x),
            Math.floor(pos.y),
            Math.floor(pos.z)
        );

        // Add +1 when stepping forward so we don't miss the boundary on positive rays
        const nextVoxelBoundary = new THREE.Vector3(
            voxel.x + (step.x > 0 ? 1 : 0),
            voxel.y + (step.y > 0 ? 1 : 0),
            voxel.z + (step.z > 0 ? 1 : 0)
        );

        const tMax = new THREE.Vector3(
            (nextVoxelBoundary.x - pos.x) / direction.x,
            (nextVoxelBoundary.y - pos.y) / direction.y,
            (nextVoxelBoundary.z - pos.z) / direction.z
        );

        tMax.x = isFinite(tMax.x) ? Math.abs(tMax.x) : Infinity;
        tMax.y = isFinite(tMax.y) ? Math.abs(tMax.y) : Infinity;
        tMax.z = isFinite(tMax.z) ? Math.abs(tMax.z) : Infinity;

        let traveled = 0;
        let lastStep = new THREE.Vector3();

        while (traveled <= maxDistance) {
            const block = getBlockAt(voxel);

            if (block !== 0) {
                return {
                    hitPos: voxel.clone(),
                    placePos: voxel.clone().sub(lastStep),
                    faceNormal: lastStep.clone(),
                };
            }

            // Standard DDA step
            if (tMax.x < tMax.y && tMax.x < tMax.z) {
                voxel.x += step.x;
                traveled = tMax.x;
                tMax.x += tDelta.x;
                lastStep.set(step.x, 0, 0);
            } else if (tMax.y < tMax.z) {
                voxel.y += step.y;
                traveled = tMax.y;
                tMax.y += tDelta.y;
                lastStep.set(0, step.y, 0);
            } else {
                voxel.z += step.z;
                traveled = tMax.z;
                tMax.z += tDelta.z;
                lastStep.set(0, 0, step.z);
            }
        }

        return null;
    }

    initInput() {
        document.addEventListener('keydown', (event) => {
            switch (event.code) {
                case 'KeyW': this.moveForward = true; break;
                case 'KeyA': this.moveLeft = true; break;
                case 'KeyS': this.moveBackward = true; break;
                case 'KeyD': this.moveRight = true; break;
                case 'Space':
                    if (this.canJump) {
                        this.velocity.y += 20; // Jump speed
                        this.canJump = false;
                    }
                    break;
                case 'ShiftLeft':
                    this.isDescending = true; // Hold Shift to go down
                    break;
                case 'ControlLeft':
                    this.isSprinting = true; // Sprinting
                    break;
            }
        });

        document.addEventListener('keyup', (event) => {
            switch (event.code) {
                case 'KeyW': this.moveForward = false; break;
                case 'KeyA': this.moveLeft = false; break;
                case 'KeyS': this.moveBackward = false; break;
                case 'KeyD': this.moveRight = false; break;
                case 'ShiftLeft':
                    this.isDescending = false;
                    break;
                case 'ControlLeft':
                    this.isSprinting = false;
                    break;
            }
        });

        document.addEventListener('mousedown', (event) => {
            if (!this.controls.isLocked) return;

            const dir = new THREE.Vector3();
            this.camera.getWorldDirection(dir);

            const origin = this.camera.position.clone();

            const result = this.raycastVoxel(origin, dir, 8, (pos) => {
                return this.chunkManager.returnBlockId(pos); // Your block getter
            });

            if (!result) return;

            const { hitPos, placePos } = result;
            const blockId = this.chunkManager.returnBlockId(hitPos);

            switch (event.button) {
                case 0: // Left click - place

                    if (this.hotbar[this.selectedSlot] == 10) {
                        const torch = new THREE.PointLight(0xffaa00, 5, 32); // intensity, distance
                        torch.position.set(placePos);

                        torch.position.set(placePos.x + 0.5, placePos.y + 1, placePos.z + 0.5); // slightly above the block

                        this.scene.add(torch);
                    }
                    this.chunkManager.placeBlockAt(this.hotbar[this.selectedSlot], placePos)

                    break;
                case 2: // Right click - break
                    this.chunkManager.placeBlockAt(0, hitPos);
                    break;
                case 1: // Middle click - pick
                    this.hotbar[this.selectedSlot] = blockId;
                    this.updateHotbarUI?.();
                    break;
            }
        });


    }

    smartFloor(pos, dir) {
        return new THREE.Vector3(
            dir.x < 0 ? Math.ceil(pos.x) - 1 : Math.floor(pos.x),
            dir.y < 0 ? Math.ceil(pos.y) - 1 : Math.floor(pos.y),
            dir.z < 0 ? Math.ceil(pos.z) - 1 : Math.floor(pos.z)
        );
    }

    initHotbarScroll() {
        window.addEventListener('wheel', (event) => {
            this.selectedSlot = (this.selectedSlot + (event.deltaY > 0 ? 1 : -1) + this.maxSlots) % this.maxSlots;
            this.updateHotbarUI();
        });
    }
    fillHotbar() {
        const blockValues = Object.values(BlockDict);
        for (let i = 0; i < this.maxSlots; i++) {
            this.hotbar[i] = blockValues[i % blockValues.length].id;
        }
        this.updateHotbarUI();
    }

    updateHotbarUI() {
        for (let i = 0; i < this.maxSlots; i++) {
            const slot = document.getElementById(`slot${i + 1}`);
            const icon = document.getElementById(`icon${i + 1}`);

            const blockId = this.hotbar[i];
            const blockData = blockId != null
                ? Object.values(BlockDict).find(b => b.id === blockId)
                : null;

            if (slot) {
                slot.style.borderWidth = i === this.selectedSlot ? "3px" : "2px";
                slot.style.borderColor = i === this.selectedSlot ? "black" : "white";
            }

            if (icon) {
                if (blockData && blockData.uv && blockData.uv.top) {
                    const [u, v] = blockData.uv.top;
                    const texSize = 32;
                    icon.style.backgroundImage = "url('blocks.png')";
                    icon.style.backgroundPosition = `-${u * texSize}px -${v * texSize}px`;
                } else {
                    icon.style.backgroundImage = '';
                    icon.style.backgroundPosition = '';
                }
            }
        }
    }

    initInventoryUI() {
        const inventory = document.getElementById("inventory");
        document.addEventListener("keydown", (e) => {
            if (e.key === "e") {
                this.controls.unlock();
                inventory.style.display = inventory.style.display === "none" ? "flex" : "none";
            }
        });

        const texSize = 32; // if you use 512/16 = 32px per tile
        const blockValues = Object.values(BlockDict);

        for (const block of blockValues) {
            const div = document.createElement("div");
            div.className = "block-slot";

            const [u, v] = block.uv?.top || [0, 0];

            div.style.width = "16px";
            div.style.height = "16px";
            div.style.backgroundImage = "url('blocks.png')";
            div.style.backgroundSize = "256px 256px"; // match your atlas
            div.style.backgroundPosition = `-${u * texSize}px -${v * texSize}px`;
            div.style.border = "2px solid #444";
            div.style.margin = "4px";
            div.style.cursor = "pointer";

            div.onclick = () => {
                // Add block to current selected hotbar slot
                this.hotbar[this.selectedSlot] = block.id;
                this.updateHotbarUI();
                inventory.style.display = "none";
            };

            inventory.appendChild(div);
        }
    }


    update(delta, blockId) {
        const velocity = this.velocity;
        const direction = this.direction;

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        direction.z = Number(this.moveForward) - Number(this.moveBackward);
        direction.x = Number(this.moveRight) - Number(this.moveLeft);
        direction.normalize();

        const baseSpeed = 150.0;
        const sprintMultiplier = this.isSprinting ? 2.0 : 1.0;
        const speed = baseSpeed * sprintMultiplier;

        if (this.moveForward || this.moveBackward) velocity.z -= direction.z * speed * delta;
        if (this.moveLeft || this.moveRight) velocity.x -= direction.x * speed * delta;

        this.controls.moveRight(-velocity.x * delta);
        this.controls.moveForward(-velocity.z * delta);

        if (this.isDescending) this.velocity.y -= 200 * delta;

        this.position.y += velocity.y * delta;

        const blockEntry = Object.values(BlockDict).find(b => b.id === blockId);
        if ((blockEntry?.isSolid) || this.position.y < 10) {
            velocity.y = 0;
            this.position.y = Math.max(this.position.y, 10);
            this.canJump = true;
        }

        const origin = this.camera.getWorldPosition(new THREE.Vector3()).add(
            this.camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(0.01)
        );

        const dir = this.camera.getWorldDirection(new THREE.Vector3()).normalize();

        const result = this.raycastVoxel(origin, dir, 8, pos => this.chunkManager.returnBlockId(pos));

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
