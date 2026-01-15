import * as THREE from 'three';
import { PlayerPhysics } from '../player/PlayerPhysics.js';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';
import { Mobs } from './Mobs.js';

export class BaseMob {
    constructor(world, startPos, config) {

        this.modelLoader = new GLTFLoader();

        this.world = world;
        this.position = startPos.clone();
        this.velocity = new THREE.Vector3();
        this.onGround = false;

        this.config = config;
        this.health = config.health;
        this.walkSpeed = config.walk_speed;
        this.runSpeed = config.run_speed;

        const { width, height, depth } = config.collider;
        this.collider = {
            size: new THREE.Vector3(width, height, depth),
            offset: new THREE.Vector3(0, -height / 2, 0)
        };

        this.physics = new PlayerPhysics(this, world.chunkManager);
        this.physics.collider = this.collider;

        this.maxHealth = config.health;
        this.health = this.maxHealth;
        this.isDead = false;
        this.isBaby = false;

        this.hasInteracted = false;

        this.buildMesh(config);
    }

    loadModel(width, height, depth, url) {
        this.modelLoader.load("/assets/models.glb", (gltf) => {
            this.model = gltf.scene.getObjectByName(url);
            this.mesh.add(this.model);


            this.model.material.transparent = false;

            this.model.material.alphaTest = 0.5;

            this.model.material.depthWrite = true;

            this.model.material.side = THREE.FrontSide;
        }, undefined, (error) => {
            console.error(`Error loading mob model ${url}:`, error);
            const errorBox = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 0.5, 0.5),
                new THREE.MeshBasicMaterial({ color: 'red' })
            );
            this.mesh.add(errorBox);
        });

        if (url === Mobs.dog.modelSrc)
            console.log("dog")
    }

    buildMesh(config) {
        this.mesh = new THREE.Group();
        this.mesh.position.copy(this.position);
        this.world.scene.add(this.mesh);

        const { width, height, depth } = config.collider;

        if (config.modelSrc)
            this.loadModel(width, height, depth, config.modelSrc);

        const hitboxGeo = new THREE.BoxGeometry(width, height, depth);

        const hitboxMat = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            wireframe: true,
            visible: false
        });

        this.hitbox = new THREE.Mesh(hitboxGeo, hitboxMat);

        this.hitbox.position.copy(this.collider.offset).negate();

        this.hitbox.userData.mobInstance = this;
        this.hitbox.name = "Hitbox";

        this.mesh.add(this.hitbox);
    }

    setFocused(isFocused) {
        if (this.hitbox) {
            this.hitbox.material.visible = isFocused;
        }
    }

    updatePhysics(delta) {
        this.velocity.y -= 18 * delta;
        if (this.onGround && this.velocity.y < 0) this.velocity.y = 0;
        this.position.addScaledVector(this.velocity, delta);
        this.physics.update(this.velocity);
        const friction = this.onGround ? 6.0 : 0.1;
        this.velocity.x -= this.velocity.x * friction * delta;
        this.velocity.z -= this.velocity.z * friction * delta;
        this.mesh.position.copy(this.position);
        if (new THREE.Vector2(this.velocity.x, this.velocity.z).length() > 0.1) {
            this.mesh.rotation.y = Math.atan2(this.velocity.x, this.velocity.z);
        }
    }

    takeDamage(amount, attackerPos) {
        if (this.isDead) return;

        this.health -= amount;

        // 1. Knockback Calculation
        const knockbackDir = new THREE.Vector3()
            .subVectors(this.position, attackerPos) // Direction AWAY from attacker
            .normalize();

        this.velocity.x += knockbackDir.x * 6; // Horizontal force
        this.velocity.y += 4;                  // Vertical hop
        this.velocity.z += knockbackDir.z * 6;
        this.onGround = false;

        this.flashRed();

        if (this.health <= 0) {
            this.die();
        }
    }

    flashRed() {
        this.mesh.traverse((child) => {
            if (child.isMesh && child.material) {
                const oldColor = child.material.color;
                child.material.color.add(new THREE.Color("rgb(255, 0, 0)"));

                setTimeout(() => {
                    if (child.material) child.material.color.sub(new THREE.Color("rgb(255, 0, 0)"));
                }, 200);
            }
        });
    }

    die() {
        this.isDead = true;
        this.world.scene.remove(this.mesh);
    }
}