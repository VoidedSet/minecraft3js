export class VRAMUsage {
    constructor(renderer, scene) {
        this.renderer = renderer;
        // scene is not needed anymore for renderer.info
    }

    getStats(world) {
        // 1. Get Three.js Internal Stats
        // These are 100% accurate because the Renderer tracks them internally
        const memory = this.renderer.info.memory;
        const render = this.renderer.info.render;
        const programs = this.renderer.info.programs;

        // 2. Get System Memory (Chrome only)
        const jsHeap = performance.memory
            ? (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)
            : "N/A";

        return {
            gpu: {
                geometries: memory.geometries, // Active Geometries in VRAM
                textures: memory.textures,     // Active Textures in VRAM
            },
            frame: {
                calls: render.calls,           // Draw calls this frame
                triangles: render.triangles,   // Total triangles drawn
                points: render.points,
                lines: render.lines
            },
            system: {
                chunks: world.world.size,
                jsHeap: jsHeap + " MB",
                limit: performance.memory ? (performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(0) + " MB" : "N/A"
            },
            shaders: programs ? programs.length : 0
        };
    }
}