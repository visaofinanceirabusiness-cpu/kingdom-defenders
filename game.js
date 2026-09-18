/* =========================================================================
   KINGDOM DEFENDERS — GAME
   Motor principal: estado del juego, loop, oleadas, castillo, economía,
   selección/mejora/venta de torres, input, render.
   Lee toda su data de config.js. No hardcodea números de balance.
   ========================================================================= */

class Game {
  constructor(canvas, hud) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.hud = hud; // referencias a elementos del HUD (ver index.html)

    this.map = MAP_CONFIG;
    this.castleHp = CASTLE_CONFIG.maxHp;
    this.castleMaxHp = CASTLE_CONFIG.maxHp;
    this.gold = ECONOMY_CONFIG.startingGold;

    this.towers = [];
    this.enemies = [];
    this.projectiles = [];

    this.selectedTowerType = Object.keys(TOWER_TYPES)[0]; // torre elegida en el picker para construir
    this.spotTowers = new Map(); // "x,y" -> Tower construida en ese punto
    this.selectedTower = null; // torre construida seleccionada (panel mejorar/vender)

    this.state = "waiting"; // waiting | countdown | wave | victory | defeat
    this.currentWaveIndex = 0;
    this.countdown = 0;
    this.spawnQueue = [];
    this.enemiesToSpawn = 0;
    this.enemiesSpawned = 0;
    this.enemiesDefeated = 0;
    this.goldEarned = 0;
    this.xpEarned = 0;

    this.lastTime = 0;
    this.running = false;

    this._bindInput();
    this._updateHUD();
    this._setMessage('Presioná "Iniciar oleada" cuando estés listo.');
  }

  // -----------------------------------------------------------------------
  // Input
  // -----------------------------------------------------------------------
  _bindInput() {
    this.canvas.addEventListener("click", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      this._handleClick(x, y);
    });
  }

  _handleClick(x, y) {
    const existingTower = this._towerAt(x, y);
    if (existingTower) {
      this._selectTower(existingTower);
      return;
    }

    const spot = this._spotAt(x, y);
    if (!spot) {
      this._deselectTower();
      return;
    }

    const key = `${spot.x},${spot.y}`;
    if (this.spotTowers.has(key)) return; // ya construida (se selecciona por _towerAt)

    const def = TOWER_TYPES[this.selectedTowerType];
    const cost = def.levels[0].cost;
    if (this.gold < cost) {
      this._setMessage(`Oro insuficiente para ${def.name} (cuesta ${cost}).`);
      return;
    }

    this.gold -= cost;
    const tower = new Tower(this.selectedTowerType, spot.x, spot.y);
    this.towers.push(tower);
    this.spotTowers.set(key, tower);
    this._updateHUD();
  }

  _spotAt(x, y) {
    const radius = 26;
    return this.map.buildSpots.find((s) => Math.hypot(s.x - x, s.y - y) <= radius) || null;
  }

  _towerAt(x, y) {
    const radius = 24;
    return this.towers.find((t) => Math.hypot(t.x - x, t.y - y) <= radius) || null;
  }

  // -----------------------------------------------------------------------
  // Selección de torre / panel de mejora
  // -----------------------------------------------------------------------
  _selectTower(tower) {
    this.selectedTower = tower;
    this._updateTowerPanel();
  }

  _deselectTower() {
    this.selectedTower = null;
    this._updateTowerPanel();
  }

  upgradeSelectedTower() {
    const tower = this.selectedTower;
    if (!tower || !tower.canUpgrade()) return;
    const cost = tower.nextUpgradeCost();
    if (this.gold < cost) {
      this._setMessage(`Oro insuficiente para mejorar (cuesta ${cost}).`);
      return;
    }
    this.gold -= cost;
    tower.upgrade();
    this._updateHUD();
    this._updateTowerPanel();
  }

  sellSelectedTower() {
    const tower = this.selectedTower;
    if (!tower) return;
    this.gold += tower.sellValue();
    this.towers = this.towers.filter((t) => t !== tower);
    for (const [key, t] of this.spotTowers) {
      if (t === tower) this.spotTowers.delete(key);
    }
    this._deselectTower();
    this._updateHUD();
  }

  // -----------------------------------------------------------------------
  // Ciclo de oleadas
  // -----------------------------------------------------------------------
  startWave() {
    if (this.state === "wave" || this.state === "countdown") return;
    if (this.currentWaveIndex >= WAVE_CONFIG.length) return;

    this.state = "countdown";
    this.countdown = GAME_CONFIG.countdownBeforeWave;
    this._setMessage(`Preparate: ${WAVE_CONFIG[this.currentWaveIndex].label} comienza pronto...`);
  }

  _beginSpawning() {
    const wave = WAVE_CONFIG[this.currentWaveIndex];
    this.spawnQueue = [];
    this.enemiesSpawned = 0;

    let total = 0;
    for (const group of wave.groups) {
      total += group.count;
      for (let i = 0; i < group.count; i++) {
        this.spawnQueue.push({
          type: group.type,
          time: group.delay + i * group.interval
        });
      }
    }
    this.spawnQueue.sort((a, b) => a.time - b.time);
    this.enemiesToSpawn = total;
    this.waveTimer = 0;
    this.state = "wave";
    this._setMessage(`${wave.label} en curso — ${total} enemigos`);
  }

  _updateSpawning(dt) {
    this.waveTimer += dt;
    while (this.spawnQueue.length && this.spawnQueue[0].time <= this.waveTimer) {
      const spawn = this.spawnQueue.shift();
      this.enemies.push(new Enemy(spawn.type, this.map.path));
      this.enemiesSpawned++;
    }
  }

  _checkWaveComplete() {
    if (this.spawnQueue.length > 0) return false;
    if (this.enemies.some((e) => e.alive)) return false;
    return true;
  }

  // -----------------------------------------------------------------------
  // Loop principal
  // -----------------------------------------------------------------------
  start() {
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this._loop.bind(this));
  }

  _loop(now) {
    if (!this.running) return;
    const dt = Math.min((now - this.lastTime) / 1000, 0.05); // clamp para evitar saltos
    this.lastTime = now;

    this._update(dt);
    this._render();

    requestAnimationFrame(this._loop.bind(this));
  }

  _update(dt) {
    if (this.state === "countdown") {
      this.countdown -= dt;
      this._updateHUD();
      if (this.countdown <= 0) this._beginSpawning();
      return;
    }

    if (this.state !== "wave") return;

    this._updateSpawning(dt);

    for (const enemy of this.enemies) {
      enemy.update(dt);
      if (enemy.reachedCastle) {
        this._damageCastle(enemy.def.damageToCastle);
      }
    }

    for (const tower of this.towers) {
      tower.update(dt, this.enemies, this.projectiles);
    }

    for (const proj of this.projectiles) proj.update(dt, this.enemies);

    // Recompensas por enemigos muertos por daño (no los que llegaron al castillo)
    for (const enemy of this.enemies) {
      if (!enemy.alive && !enemy.reachedCastle && !enemy._rewarded) {
        enemy._rewarded = true;
        this.gold += enemy.def.reward;
        this.goldEarned += enemy.def.reward;
        this.xpEarned += enemy.def.xp;
        this.enemiesDefeated++;
      }
    }

    this.enemies = this.enemies.filter((e) => e.alive);
    this.projectiles = this.projectiles.filter((p) => p.alive);

    this._updateHUD();

    if (this.castleHp <= 0) {
      this._onDefeat();
      return;
    }

    if (this._checkWaveComplete()) {
      this._onWaveCleared();
    }
  }

  _damageCastle(amount) {
    this.castleHp = Math.max(0, this.castleHp - amount);
  }

  _onWaveCleared() {
    this.currentWaveIndex++;
    if (this.currentWaveIndex >= WAVE_CONFIG.length) {
      this._onVictory();
    } else {
      this.state = "waiting";
      this._setMessage('Oleada superada. Presioná "Iniciar oleada" para continuar.');
      this._updateHUD();
    }
  }

  _onVictory() {
    this.state = "victory";
    this._showEndScreen(true);
  }

  _onDefeat() {
    this.state = "defeat";
    this._showEndScreen(false);
  }

  // -----------------------------------------------------------------------
  // HUD / mensajes
  // -----------------------------------------------------------------------
  _setMessage(text) {
    if (this.hud.message) this.hud.message.textContent = text;
  }

  _updateHUD() {
    const h = this.hud;
    if (h.castleHp) h.castleHp.textContent = `${this.castleHp} / ${this.castleMaxHp}`;
    if (h.castleBar) h.castleBar.style.width = `${(this.castleHp / this.castleMaxHp) * 100}%`;
    if (h.gold) h.gold.textContent = this.gold;
    if (h.wave) {
      const shown = Math.min(this.currentWaveIndex + 1, WAVE_CONFIG.length);
      h.wave.textContent = `${shown} / ${WAVE_CONFIG.length}`;
    }
    if (h.startWaveBtn) {
      h.startWaveBtn.disabled = this.state === "wave" || this.state === "countdown" || this.state === "victory" || this.state === "defeat";
    }
    if (h.countdown) {
      h.countdown.textContent = this.state === "countdown" ? Math.ceil(this.countdown) : "";
    }
    if (this.selectedTower) this._updateTowerPanel();
  }

  _updateTowerPanel() {
    const h = this.hud;
    if (!h.towerPanel) return;
    const tower = this.selectedTower;

    if (!tower) {
      h.towerPanel.classList.add("hidden");
      return;
    }

    h.towerPanel.classList.remove("hidden");
    h.towerPanelName.textContent = `${tower.def.icon} ${tower.def.name}`;
    h.towerPanelLevel.textContent = `Nivel ${tower.level} / ${tower.maxLevel}`;
    h.towerPanelStats.innerHTML = `
      <p>Daño: ${tower.damage}</p>
      <p>Alcance: ${Math.round(tower.range)}</p>
      <p>Velocidad: ${tower.fireRate.toFixed(2)}/s</p>
    `;

    if (tower.canUpgrade()) {
      const cost = tower.nextUpgradeCost();
      h.towerPanelUpgradeBtn.disabled = this.gold < cost;
      h.towerPanelUpgradeBtn.textContent = `Mejorar (${cost} 💰)`;
      h.towerPanelUpgradeBtn.classList.remove("hidden");
    } else {
      h.towerPanelUpgradeBtn.classList.add("hidden");
    }

    h.towerPanelSellBtn.textContent = `Vender (+${tower.sellValue()} 💰)`;
  }

  _showEndScreen(victory) {
    const h = this.hud;
    if (!h.endScreen) return;
    h.endScreen.classList.remove("hidden");
    h.endTitle.textContent = victory ? "¡VICTORIA!" : "DERROTA";
    h.endTitle.className = victory ? "end-title victory" : "end-title defeat";
    h.endStats.innerHTML = `
      <p>Oleada alcanzada: ${Math.min(this.currentWaveIndex + 1, WAVE_CONFIG.length)} / ${WAVE_CONFIG.length}</p>
      <p>Enemigos derrotados: ${this.enemiesDefeated}</p>
      <p>Oro conseguido: ${this.goldEarned}</p>
      <p>XP conseguida: ${this.xpEarned}</p>
    `;
  }

  restart() {
    this.castleHp = this.castleMaxHp;
    this.gold = ECONOMY_CONFIG.startingGold;
    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.spotTowers.clear();
    this._deselectTower();
    this.state = "waiting";
    this.currentWaveIndex = 0;
    this.enemiesDefeated = 0;
    this.goldEarned = 0;
    this.xpEarned = 0;
    this.hud.endScreen.classList.add("hidden");
    this._setMessage('Presioná "Iniciar oleada" cuando estés listo.');
    this._updateHUD();
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  _render() {
    const ctx = this.ctx;
    const { width, height } = this.map;
    ctx.clearRect(0, 0, width, height);

    this._drawTerrain(ctx);
    this._drawPath(ctx);
    this._drawBuildSpots(ctx);
    this._drawCastle(ctx);

    for (const tower of this.towers) tower.draw(ctx, tower === this.selectedTower);
    for (const enemy of this.enemies) enemy.draw(ctx);
    for (const proj of this.projectiles) proj.draw(ctx);
  }

  _drawTerrain(ctx) {
    const { width, height } = this.map;
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, "#3f5c34");
    grad.addColorStop(1, "#2f4527");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // "textura" de bosque: manchas verdes suaves distribuidas de forma determinística
    ctx.fillStyle = "rgba(0,0,0,0.08)";
    for (let i = 0; i < 40; i++) {
      const x = (i * 137) % width;
      const y = (i * 79) % height;
      ctx.beginPath();
      ctx.arc(x, y, 18, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _drawPath(ctx) {
    const { path, pathWidth } = this.map;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    ctx.strokeStyle = "#8a6a42";
    ctx.lineWidth = pathWidth;
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
    ctx.stroke();

    ctx.strokeStyle = "#a9835a";
    ctx.lineWidth = pathWidth - 10;
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
    ctx.stroke();
  }

  _drawBuildSpots(ctx) {
    for (const spot of this.map.buildSpots) {
      const key = `${spot.x},${spot.y}`;
      if (this.spotTowers.has(key)) continue;
      ctx.beginPath();
      ctx.arc(spot.x, spot.y, 22, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 230, 150, 0.18)";
      ctx.fill();
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = "rgba(255, 230, 150, 0.7)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  _drawCastle(ctx) {
    const { x, y } = this.map.castle;
    ctx.fillStyle = "#6b6963";
    ctx.fillRect(x - 34, y - 50, 68, 100);
    ctx.strokeStyle = "#2b2a27";
    ctx.lineWidth = 3;
    ctx.strokeRect(x - 34, y - 50, 68, 100);

    // almenas
    ctx.fillStyle = "#6b6963";
    for (let i = -1; i <= 1; i++) {
      ctx.fillRect(x - 34 + (i + 1) * 22 - 8, y - 62, 16, 14);
    }

    // bandera
    ctx.strokeStyle = "#3a3833";
    ctx.beginPath();
    ctx.moveTo(x, y - 62);
    ctx.lineTo(x, y - 90);
    ctx.stroke();
    ctx.fillStyle = "#a3283c";
    ctx.beginPath();
    ctx.moveTo(x, y - 90);
    ctx.lineTo(x + 24, y - 82);
    ctx.lineTo(x, y - 74);
    ctx.closePath();
    ctx.fill();
  }
}
