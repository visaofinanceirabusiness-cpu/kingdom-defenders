/* =========================================================================
   KINGDOM DEFENDERS — RENDER 3D (Three.js)
   Motor de render real en 3D: escena, cámara con perspectiva, luces y
   sombras, geometría con volumen real (cajas/conos/esferas). No conoce
   reglas de juego: solo lee el estado de Game (towers/enemies/proyectiles/
   efectos/mapa) y lo sincroniza contra sus propios objetos de Three.js.

   Coordenadas: el mundo del juego (x,y en px, 0-960/0-540, definido en
   config.js) se centra en el origen de la escena y se achica por
   SCENE_CONFIG.unit para trabajar en unidades razonables de Three.js.
   world.x/world.y -> scene.x/scene.z (el plano del suelo). scene.y es la
   altura real (donde antes solo había un truco isométrico de dibujo).

   Las barras de vida, el texto flotante y los rayos (LightningEffect)
   siguen siendo overlay 2D: se proyectan del mundo 3D a la pantalla con
   projectToScreen() y se dibujan en un <canvas> transparente encima del
   canvas de Three.js. Todo lo demás (terreno, camino, castillo, torres,
   enemigos, proyectiles, decoración) es geometría 3D real, con sombras.
   ========================================================================= */

function buildCheckerTexture(colorA, colorB) {
  const size = 16;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const cx = c.getContext("2d");
  cx.fillStyle = colorA;
  cx.fillRect(0, 0, size, size);
  cx.fillStyle = colorB;
  cx.fillRect(0, 0, size / 2, size / 2);
  cx.fillRect(size / 2, size / 2, size / 2, size / 2);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.NearestFilter;
  return tex;
}

class Renderer3D {
  constructor(canvas, overlayCanvas) {
    this.canvas = canvas;
    this.overlayCanvas = overlayCanvas;
    this.overlayCtx = overlayCanvas.getContext("2d");
    this.unit = SCENE_CONFIG.unit;
    this.halfW = 480;
    this.halfH = 270;
    this._cssW = 1;
    this._cssH = 1;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(SCENE_CONFIG.skyColor);
    this.scene.fog = new THREE.Fog(SCENE_CONFIG.skyColor, SCENE_CONFIG.fogNear, SCENE_CONFIG.fogFar);

    this.camera = new THREE.PerspectiveCamera(SCENE_CONFIG.cameraFov, 1, 0.1, 300);
    const cp = SCENE_CONFIG.cameraPosition;
    this.camera.position.set(cp.x, cp.y, cp.z);
    const la = SCENE_CONFIG.cameraLookAt;
    this.camera.lookAt(la.x, la.y, la.z);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    this.sun = new THREE.DirectionalLight(0xfff2d0, 1.15);
    this.sun.position.set(22, 30, 14);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    const sc = this.sun.shadow.camera;
    sc.left = -30;
    sc.right = 30;
    sc.top = 30;
    sc.bottom = -30;
    sc.far = 80;
    this.scene.add(this.sun);

    this.raycaster = new THREE.Raycaster();
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    this.mapGroup = null;
    this.map = null;
    this.spotMeshes = new Map();
    this.towerMeshes = new Map();
    this.enemyMeshes = new Map();
    this.projectileMeshes = new Map();
  }

  // -----------------------------------------------------------------------
  // Coordenadas
  // -----------------------------------------------------------------------
  _worldToScene(x, y) {
    return { x: (x - this.halfW) / this.unit, z: (y - this.halfH) / this.unit };
  }

  sceneToWorld(x, z) {
    return { x: x * this.unit + this.halfW, y: z * this.unit + this.halfH };
  }

  screenToWorld(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera({ x: ndcX, y: ndcY }, this.camera);
    const hit = new THREE.Vector3();
    const ok = this.raycaster.ray.intersectPlane(this.groundPlane, hit);
    if (!ok) return null;
    return this.sceneToWorld(hit.x, hit.z);
  }

  // Proyecta un punto del mundo (x,y de mapa) + una altura en unidades de
  // escena a coordenadas de pantalla (px CSS), para el overlay 2D.
  projectToScreen(worldX, worldY, heightUnits) {
    const s = this._worldToScene(worldX, worldY);
    const v = new THREE.Vector3(s.x, heightUnits || 0, s.z);
    v.project(this.camera);
    return {
      sx: (v.x * 0.5 + 0.5) * this._cssW,
      sy: (-v.y * 0.5 + 0.5) * this._cssH,
      visible: v.z < 1
    };
  }

  resize(cssWidth, cssHeight, dpr) {
    this._cssW = cssWidth;
    this._cssH = cssHeight;
    this.renderer.setPixelRatio(1); // el buffer ya viene escalado por dpr vía canvas.width/height
    this.renderer.setSize(cssWidth * dpr, cssHeight * dpr, false);
    this.camera.aspect = cssWidth / cssHeight;
    this.camera.updateProjectionMatrix();
    this.overlayCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // -----------------------------------------------------------------------
  // Mapa (terreno, camino, spots, castillo, decoración): geometría estática,
  // se reconstruye cada vez que se elige o cambia de mapa.
  // -----------------------------------------------------------------------
  setMap(map) {
    if (this.mapGroup) {
      this.scene.remove(this.mapGroup);
      this.mapGroup.traverse((o) => {
        o.geometry?.dispose();
        o.material?.dispose();
      });
    }

    this.map = map;
    this.halfW = map.width / 2;
    this.halfH = map.height / 2;

    const group = new THREE.Group();
    const w = map.width / this.unit;
    const h = map.height / this.unit;
    const thickness = SCENE_CONFIG.groundThickness;

    const checkerTex = buildCheckerTexture(map.terrainColors.top, map.terrainColors.bottom);
    checkerTex.repeat.set(w / 2.5, h / 2.5);
    const topMat = new THREE.MeshStandardMaterial({ map: checkerTex });
    const sideColor = new THREE.Color(map.terrainColors.bottom).multiplyScalar(0.45);
    const sideMat = new THREE.MeshStandardMaterial({ color: sideColor });
    const groundGeo = new THREE.BoxGeometry(w, thickness, h);
    // Orden de materiales de BoxGeometry: +x,-x,+y,-y,+z,-z. Solo la cara de
    // arriba (+y) usa el piso a cuadros; el resto son las paredes de la
    // plataforma, más oscuras (le dan grosor real, no una foto pegada en el aire).
    const groundMesh = new THREE.Mesh(groundGeo, [sideMat, sideMat, topMat, sideMat, sideMat, sideMat]);
    groundMesh.position.y = -thickness / 2;
    groundMesh.receiveShadow = true;
    group.add(groundMesh);

    group.add(this._buildPath(map));

    this.spotMeshes = new Map();
    for (const spot of map.buildSpots) {
      const geo = new THREE.CircleGeometry(1.3, 24);
      const mat = new THREE.MeshBasicMaterial({ color: 0xffe696, transparent: true, opacity: 0.22, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      const s = this._worldToScene(spot.x, spot.y);
      mesh.position.set(s.x, 0.02, s.z);
      group.add(mesh);
      this.spotMeshes.set(`${spot.x},${spot.y}`, mesh);
    }

    const castle = this._buildCastle(map);
    group.add(castle);

    for (const deco of map.decorations || []) {
      const mesh = map.decorationType === "rock" ? this._buildRock() : this._buildTree();
      const s = this._worldToScene(deco.x, deco.y);
      mesh.position.set(s.x, 0, s.z);
      group.add(mesh);
    }

    this.scene.add(group);
    this.mapGroup = group;

    // Un mapa nuevo implica un Game nuevo: las torres/enemigos/proyectiles
    // del mapa anterior ya no existen. Se limpia todo lo trackeado.
    this._disposeTracked(this.towerMeshes);
    this._disposeTracked(this.enemyMeshes);
    this._disposeTracked(this.projectileMeshes);
  }

  _buildPath(map) {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0xa9835a });
    const pathW = (map.pathWidth / this.unit) * 0.8;
    const pts = map.path.map((p) => this._worldToScene(p.x, p.y));
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const len = Math.hypot(dx, dz);
      if (len < 0.001) continue;
      const seg = new THREE.Mesh(new THREE.BoxGeometry(len, 0.08, pathW), mat);
      seg.position.set((a.x + b.x) / 2, 0.045, (a.z + b.z) / 2);
      seg.rotation.y = -Math.atan2(dz, dx);
      seg.receiveShadow = true;
      group.add(seg);
    }
    return group;
  }

  _buildCastle(map) {
    const group = new THREE.Group();
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x8a877d });

    const wall = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.2, 2.4), wallMat);
    wall.position.y = 1.6;
    wall.castShadow = true;
    wall.receiveShadow = true;
    group.add(wall);

    for (let i = -1; i <= 1; i++) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.5), wallMat);
      b.position.set(i * 0.8, 3.2 + 0.22, 0);
      b.castShadow = true;
      group.add(b);
    }

    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 1.2, 6),
      new THREE.MeshStandardMaterial({ color: 0x3a3833 })
    );
    pole.position.set(0, 3.2 + 0.6, 0);
    group.add(pole);

    const flag = new THREE.Mesh(
      new THREE.PlaneGeometry(0.7, 0.4),
      new THREE.MeshStandardMaterial({ color: 0xa3283c, side: THREE.DoubleSide })
    );
    flag.position.set(0.35, 3.2 + 1.0, 0);
    group.add(flag);

    const s = this._worldToScene(map.castle.x, map.castle.y);
    group.position.set(s.x, 0, s.z);
    return group;
  }

  _buildTree() {
    const group = new THREE.Group();
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.1, 0.6, 6),
      new THREE.MeshStandardMaterial({ color: 0x4a3420 })
    );
    trunk.position.y = 0.3;
    trunk.castShadow = true;
    group.add(trunk);

    const foliage = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0x4c7a3a })
    );
    foliage.position.y = 0.95;
    foliage.castShadow = true;
    group.add(foliage);
    return group;
  }

  _buildRock() {
    // Icosaedro sin suavizar: la típica "roca low-poly" de un solo mesh.
    const geo = new THREE.IcosahedronGeometry(0.4, 0);
    const mat = new THREE.MeshStandardMaterial({ color: 0x8f8d86, flatShading: true });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = 0.25;
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    mesh.castShadow = true;
    return mesh;
  }

  // -----------------------------------------------------------------------
  // Torres / enemigos / proyectiles: geometría dinámica, se sincroniza
  // contra los arrays de Game en cada frame (crear lo nuevo, actualizar lo
  // existente, remover y liberar lo que ya no está).
  // -----------------------------------------------------------------------
  _createTowerMesh(tower) {
    const def = tower.def;
    const group = new THREE.Group();

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.4, 1.2),
      new THREE.MeshStandardMaterial({ color: new THREE.Color(def.color) })
    );
    body.position.y = 0.7;
    body.castShadow = true;
    group.add(body);

    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(1.0, 0.9, 4),
      new THREE.MeshStandardMaterial({ color: new THREE.Color(def.accentColor) })
    );
    roof.position.y = 1.4 + 0.45;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    group.add(roof);

    const rangeRing = new THREE.Mesh(
      new THREE.RingGeometry(0.01, 0.02, 48),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18, side: THREE.DoubleSide })
    );
    rangeRing.rotation.x = -Math.PI / 2;
    rangeRing.position.y = 0.03;
    rangeRing.visible = false;
    group.add(rangeRing);

    const s = this._worldToScene(tower.x, tower.y);
    group.position.set(s.x, 0, s.z);
    this.scene.add(group);

    return { group, body, roof, rangeRing, lastRange: null };
  }

  _updateTowerMesh(tower, entry, game) {
    // El nivel de la torre se ve: crece un poco con cada mejora, en vez de
    // depender de "pips" 2D dibujados aparte.
    const scale = 1 + tower.levelIndex * 0.18;
    entry.body.scale.set(1, scale, 1);
    entry.body.position.y = 0.7 * scale;
    entry.roof.position.y = 1.4 * scale + 0.45;

    const showRange = tower === game.selectedTower;
    entry.rangeRing.visible = showRange;
    if (showRange && entry.lastRange !== tower.range) {
      entry.lastRange = tower.range;
      const r = tower.range / this.unit;
      entry.rangeRing.geometry.dispose();
      entry.rangeRing.geometry = new THREE.RingGeometry(Math.max(0.01, r - 0.04), r, 48);
    }
  }

  _createEnemyMesh(enemy) {
    const def = enemy.def;
    const baseColor = new THREE.Color(def.bodyColor);
    const mat = new THREE.MeshStandardMaterial({ color: baseColor.clone() });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(def.radius / this.unit, 12, 10), mat);
    mesh.castShadow = true;
    this.scene.add(mesh);

    if (def.isBoss) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(def.radius / this.unit + 0.15, 0.05, 8, 24),
        new THREE.MeshBasicMaterial({ color: 0xe0b23a })
      );
      ring.rotation.x = Math.PI / 2;
      mesh.add(ring);
    }

    return { mesh, mat, baseColor };
  }

  _updateEnemyMesh(enemy, entry) {
    const s = this._worldToScene(enemy.x, enemy.y);
    entry.mesh.position.set(s.x, enemy.radius / this.unit, s.z);
    if (enemy.slowTimer > 0) entry.mat.color.set(0x7fb8ff);
    else entry.mat.color.copy(entry.baseColor);
  }

  _createProjectileMesh(proj) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 6, 6),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(proj.color) })
    );
    this.scene.add(mesh);
    return { mesh };
  }

  _updateProjectileMesh(proj, entry) {
    const s = this._worldToScene(proj.x, proj.y);
    entry.mesh.position.set(s.x, 0.9, s.z);
  }

  _syncGroup(items, store, createFn, updateFn) {
    const seen = new Set();
    for (const item of items) {
      seen.add(item);
      let entry = store.get(item);
      if (!entry) {
        entry = createFn(item);
        store.set(item, entry);
      }
      updateFn(item, entry);
    }
    for (const [item, entry] of store) {
      if (!seen.has(item)) {
        this._disposeEntry(entry);
        store.delete(item);
      }
    }
  }

  _disposeEntry(entry) {
    const obj = entry.group || entry.mesh;
    this.scene.remove(obj);
    obj.traverse((o) => {
      o.geometry?.dispose();
      o.material?.dispose();
    });
  }

  _disposeTracked(store) {
    for (const [, entry] of store) this._disposeEntry(entry);
    store.clear();
  }

  // -----------------------------------------------------------------------
  // Sincronización por frame + render
  // -----------------------------------------------------------------------
  sync(game) {
    this._syncGroup(game.towers, this.towerMeshes, (t) => this._createTowerMesh(t), (t, e) => this._updateTowerMesh(t, e, game));
    this._syncGroup(game.enemies, this.enemyMeshes, (e) => this._createEnemyMesh(e), (e, entry) => this._updateEnemyMesh(e, entry));
    this._syncGroup(
      game.projectiles,
      this.projectileMeshes,
      (p) => this._createProjectileMesh(p),
      (p, entry) => this._updateProjectileMesh(p, entry)
    );

    for (const [key, mesh] of this.spotMeshes) {
      mesh.visible = !game.spotTowers.has(key);
    }

    // Overlay 2D: barras de vida y efectos (partículas/texto/rayos), todo
    // proyectado desde su posición real en la escena 3D.
    const ctx = this.overlayCtx;
    ctx.clearRect(0, 0, this._cssW, this._cssH);

    for (const enemy of game.enemies) {
      const h = (enemy.radius / this.unit) * 2 + 0.35;
      enemy.drawHealthBar(ctx, (x, y) => this.projectToScreen(x, y, h));
    }

    for (const effect of game.effects) {
      const rise = effect instanceof FloatingText ? (effect.maxLife - effect.life) * 1.2 : 0;
      effect.draw(ctx, (x, y) => this.projectToScreen(x, y, 0.6 + rise));
    }

    if (game.castleFlashTimer > 0) {
      ctx.fillStyle = `rgba(163,40,60,${(game.castleFlashTimer / GAME_CONFIG.castleFlashDuration) * 0.35})`;
      ctx.fillRect(0, 0, this._cssW, this._cssH);
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
