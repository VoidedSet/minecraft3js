// src/lib/player/UI.js
import { BlockDict } from "../Blocks";

export class UI {
    constructor(controls) {
        this.controls = controls;

        this.hotbar = [1, 2, 3, 4, 5, 6, 7, 8, 10];
        this.selectedSlot = 0;
        this.maxSlots = 9;

        // Overlay Elements
        this.infoOverlay = null;
        this.blockNameOverlay = null;
        this.blockNameTimer = null;

        this.initUI();
        this.initDOM(); // Create new UI elements
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
            if (this.infoOverlay) this.infoOverlay.style.display = 'block';
        });

        this.controls.addEventListener('unlock', () => {
            blocker.style.display = 'block';
            instructions.style.display = '';
            crosshair.style.display = 'none';
            if (this.infoOverlay) this.infoOverlay.style.display = 'none';
        });
    }

    initDOM() {
        // 1. Info Overlay (Top Left)
        this.infoOverlay = document.createElement('div');
        this.infoOverlay.style.position = 'fixed';
        this.infoOverlay.style.top = '10px';
        this.infoOverlay.style.left = '10px';
        this.infoOverlay.style.color = 'white';
        this.infoOverlay.style.fontFamily = 'monospace';
        this.infoOverlay.style.fontSize = '16px';
        this.infoOverlay.style.textShadow = '1px 1px 0 #000';
        this.infoOverlay.style.zIndex = '10';
        this.infoOverlay.style.display = 'none'; // Hidden until locked
        document.body.appendChild(this.infoOverlay);

        // 2. Block Name Popup (Above Hotbar)
        this.blockNameOverlay = document.createElement('div');
        this.blockNameOverlay.style.position = 'fixed';
        this.blockNameOverlay.style.bottom = '10%'; // Just above hotbar
        this.blockNameOverlay.style.left = '50%';
        this.blockNameOverlay.style.transform = 'translateX(-50%)';
        this.blockNameOverlay.style.color = '#ffff55'; // Minecraft yellow
        this.blockNameOverlay.style.fontFamily = 'monospace';
        this.blockNameOverlay.style.fontSize = '20px';
        this.blockNameOverlay.style.textShadow = '2px 2px 0 #000';
        this.blockNameOverlay.style.zIndex = '10';
        this.blockNameOverlay.style.opacity = '0';
        this.blockNameOverlay.style.transition = 'opacity 0.5s';
        document.body.appendChild(this.blockNameOverlay);

        this.mobInfoOverlay = document.createElement('div');
        this.mobInfoOverlay.style.position = 'fixed';
        this.mobInfoOverlay.style.top = '55%'; // Slightly below center
        this.mobInfoOverlay.style.left = '50%';
        this.mobInfoOverlay.style.transform = 'translate(-50%, 0)';
        this.mobInfoOverlay.style.color = 'red';
        this.mobInfoOverlay.style.fontFamily = 'monospace';
        this.mobInfoOverlay.style.fontSize = '18px';
        this.mobInfoOverlay.style.textShadow = '1px 1px 0 #000';
        this.mobInfoOverlay.style.display = 'none';
        document.body.appendChild(this.mobInfoOverlay);

        this.mobStats = document.createElement('div');
        this.mobStats.style.position = 'absolute';
        this.mobStats.style.top = '10px';
        this.mobStats.style.right = '10px'; // Top Right
        this.mobStats.style.color = 'white';
        this.mobStats.style.fontFamily = 'monospace';
        this.mobStats.style.fontSize = '16px';
        this.mobStats.style.textShadow = '1px 1px 0 #000';
        this.mobStats.innerHTML = 'Active: 0 | Saved: 0';
        document.body.appendChild(this.mobStats);

        this.debugPanel = document.createElement('div');
        this.debugPanel.style.position = 'absolute';
        this.debugPanel.style.top = '50px';
        this.debugPanel.style.right = '10px';
        this.debugPanel.style.color = '#00ff00'; // Matrix Green
        this.debugPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.debugPanel.style.padding = '10px';
        this.debugPanel.style.fontFamily = 'monospace';
        this.debugPanel.style.fontSize = '12px';
        this.debugPanel.style.pointerEvents = 'none'; // Click through
        this.debugPanel.innerHTML = 'Calculating VRAM...';
        document.body.appendChild(this.debugPanel);
    }

    updatevramDebugInfo(stats) {
        this.debugPanel.innerHTML =
            `[System]<br>
            Chunks    : ${stats.system.chunks}<br>
            JS Heap   : ${stats.system.jsHeap}<br><br>
           
           [GPU Est.]<br>
            Textures  : ${stats.textures.size} (${stats.textures.count})<br>
            Geometry  : ${stats.geometries.size}<br>
            Draw Calls: ${stats.scene.drawCalls}<br>
            Entities  : ${stats.scene.meshes}`;
    }

    updateMobCounts(active, saved) {
        this.mobStats.innerHTML = `Active: ${active} | Saved: ${saved}`;
    }

    showMobInfo(mob) {
        if (!mob) {
            this.mobInfoOverlay.style.display = 'none';
            return;
        }

        this.mobInfoOverlay.style.display = 'block';
        this.mobInfoOverlay.innerHTML = `
            ${mob.config.name} <br>
            Health: ${mob.health} <br>
            State: ${mob.state}
        `;
    }

    updateDebugInfo(player, world) {
        if (!this.infoOverlay) return;

        const pos = player.position;
        const x = Math.floor(pos.x);
        const y = Math.floor(pos.y);
        const z = Math.floor(pos.z);

        // Get Biome
        const biome = world.getBiome(pos.x, pos.z);
        // Get Dimension (Capitalized)
        const dim = world.dimension.charAt(0).toUpperCase() + world.dimension.slice(1);

        this.infoOverlay.innerHTML = `
            XYZ: ${x}, ${y}, ${z}<br>
            Biome: ${biome}<br>
            Dimension: ${dim}
        `;
    }

    showBlockName(blockId) {
        if (!blockId) return;
        const block = Object.values(BlockDict).find(b => b.id === blockId);
        const name = block ? block.name : "Unknown";

        this.blockNameOverlay.innerText = name;
        this.blockNameOverlay.style.opacity = '1';

        // Clear previous timer
        if (this.blockNameTimer) clearTimeout(this.blockNameTimer);

        // Fade out after 2 seconds
        this.blockNameTimer = setTimeout(() => {
            this.blockNameOverlay.style.opacity = '0';
        }, 2000);
    }

    initHotbarScroll() {
        window.addEventListener('wheel', (event) => {
            this.selectedSlot = (this.selectedSlot + (event.deltaY > 0 ? 1 : -1) + this.maxSlots) % this.maxSlots;
            this.updateHotbarUI();

            // Show block name on scroll
            this.showBlockName(this.hotbar[this.selectedSlot]);
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
                slot.style.borderColor = i === this.selectedSlot ? "white" : "#555";
                slot.style.transform = i === this.selectedSlot ? "scale(1.1)" : "scale(1)";
            }

            if (icon) {
                if (blockData && blockData.uv && blockData.uv.top) {
                    const [u, v] = blockData.uv.top;
                    const texSize = 32;
                    icon.style.backgroundImage = "url('blocks.png')";
                    icon.style.backgroundPosition = `-${u * texSize}px -${v * texSize}px`;
                } else {
                    icon.style.backgroundImage = '';
                }
            }
        }
    }

    initInventoryUI() {
        // ... (Keep existing implementation) ...
        const inventory = document.getElementById("inventory");
        document.addEventListener("keydown", (e) => {
            if (e.key === "e") {
                this.controls.unlock();
                inventory.style.display = inventory.style.display === "none" ? "flex" : "none";
            }
        });

        const texSize = 32;
        const blockValues = Object.values(BlockDict);

        for (const block of blockValues) {
            const div = document.createElement("div");
            div.className = "block-slot";
            const [u, v] = block.uv?.top || [0, 0];
            div.style.width = "32px";
            div.style.height = "32px";
            div.style.backgroundImage = "url('blocks.png')";
            div.style.backgroundSize = "512px 512px";
            div.style.backgroundPosition = `-${u * texSize}px -${v * texSize}px`;
            div.style.border = "2px solid #888";
            div.style.margin = "4px";
            div.style.cursor = "pointer";

            div.onclick = () => {
                this.hotbar[this.selectedSlot] = block.id;
                this.updateHotbarUI();
                this.showBlockName(block.id); // Show name on pick
                inventory.style.display = "none";
                this.controls.lock();
            };
            inventory.appendChild(div);
        }
    }

    setHotbarSlot(blockID) {
        this.hotbar[this.selectedSlot] = blockID;
        this.updateHotbarUI();
        this.showBlockName(blockID);
    }
}