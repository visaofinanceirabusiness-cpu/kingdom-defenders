/* =========================================================================
   KINGDOM DEFENDERS — GAME
   Motor principal: estado del juego, loop, oleadas, castillo, economía,
   selección/mejora/venta de torres, input, render.
   Lee toda su data de config.js. No hardcodea números de balance.
   ========================================================================= */

// ---------------------------------------------------------------------------
// SoundManager — sonido sintetizado con Web Audio (sin archivos externos).
// Lee sus presets de SOUND_TYPES (config.js). Silenciable, y el mute
// persiste en localStorage.
// ---------------------------------------------------------------------------
class SoundManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    try {
      this.muted = localStorage.getItem(SAVE_CONFIG.soundMutedKey) === "1";
    } catch (e) {
      // sin localStorage: arranca con sonido activado.
    }
  }

  _ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    return this.ctx;
  }

  play(type) {
    if (this.muted) return;
    const preset = SOUND_TYPES[type];
    const ctx = this._ensureContext();
    if (!preset || !ctx) return;
    if (ctx.state === "suspended") ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = preset.wave;
    osc.frequency.setValueAtTime(preset.freq, ctx.currentTime);
    if (preset.freqEnd) {
      osc.frequency.exponentialRampToValueAtTime(preset.freqEnd, ctx.currentTime + preset.duration);
    }
    gain.gain.setValueAtTime(preset.volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + preset.duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + preset.duration);
  }

  toggleMute() {
    this.muted = !this.muted;
    try {
      localStorage.setItem(SAVE_CONFIG.soundMutedKey, this.muted ? "1" : "0");
    } catch (e) {
      // sin localStorage: el mute solo dura esta sesión.
    }
    return this.muted;
  }
}

class Game {
  constructor(canvas, hud, mapId, sound) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.hud = hud; // referencias a elementos del HUD (ver index.html)
    this.sound = sound || new SoundManager();

    this.mapId = mapId && MAPS[mapId] ? mapId : DEFAULT_MAP_ID;
    this.map = MAPS[this.mapId];
    this.castleHp = CASTLE_CONFIG.maxHp;
    this.castleMaxHp = CASTLE_CONFIG.maxHp;
    this.gold = ECONOMY_CONFIG.startingGold;

    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.effects = []; // partículas, texto flotante, rayos: solo presentación
    this.castleFlashTimer = 0;

    this.selectedTowerType = Object.keys(TOWER_TYPES)[0]; // torre elegida en el picker para construir
    this.spotTowers = new Map(); // "x,y" -> Tower construida en ese punto
    this.selectedTower = null; // torre construida seleccionada (panel mejorar/vender)

    this._loadPlayerProgress(); // nivel/XP del jugador (persiste entre partidas)
    this.abilityCooldowns = {}; // id de habilidad -> segundos restantes
    Object.keys(ABILITY_TYPES).forEach((id) => (this.abilityCooldowns[id] = 0));
    this.armedAbility = null; // id de habilidad "targeted" esperando un clic en el mapa

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
    this._saveRunState();
  }

  // -----------------------------------------------------------------------
  // Guardado de partida (checkpoint entre oleadas, persiste en localStorage)
  // -----------------------------------------------------------------------
  static loadRunState() {
    try {
      const raw = localStorage.getItem(SAVE_CONFIG.runStateKey);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  _saveRunState() {
    if (this.state !== "waiting") return; // solo se guarda en checkpoints simples de serializar
    try {
      const data = {
        mapId: this.mapId,
        gold: this.gold,
        castleHp: this.castleHp,
        currentWaveIndex: this.currentWaveIndex,
        towers: this.towers.map((t) => ({ typeId: t.typeId, x: t.x, y: t.y, levelIndex: t.levelIndex }))
      };
      localStorage.setItem(SAVE_CONFIG.runStateKey, JSON.stringify(data));
    } catch (e) {
      // sin persistencia disponible: la partida sigue igual, solo no se guarda.
    }
  }

  _clearRunState() {
    try {
      localStorage.removeItem(SAVE_CONFIG.runStateKey);
    } catch (e) {
      // nada que limpiar si no hay persistencia disponible.
    }
  }

  restoreRunState(saved) {
    this.gold = saved.gold;
    this.castleHp = Math.min(saved.castleHp, this.castleMaxHp);
    this.currentWaveIndex = saved.currentWaveIndex;
    for (const t of saved.towers || []) {
      if (!TOWER_TYPES[t.typeId]) continue;
      const tower = new Tower(t.typeId, t.x, t.y);
      tower.restoreLevel(t.levelIndex);
      this.towers.push(tower);
      this.spotTowers.set(`${t.x},${t.y}`, tower);
    }
    this._updateHUD();
    this._setMessage('Partida restaurada. Presioná "Iniciar oleada" cuando estés listo.');
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
    if (this.armedAbility) {
      this._activateAbility(this.armedAbility, { x, y });
      return;
    }

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
    const requiredLevel = def.unlockLevel || 1;
    if (this.playerLevel < requiredLevel) {
      this._setMessage(`${def.name} se desbloquea en el nivel ${requiredLevel}.`);
      return;
    }

    const cost = def.levels[0].cost;
    if (this.gold < cost) {
      this._setMessage(`Oro insuficiente para ${def.name} (cuesta ${cost}).`);
      return;
    }

    this.gold -= cost;
    const tower = new Tower(this.selectedTowerType, spot.x, spot.y);
    this.towers.push(tower);
    this.spotTowers.set(key, tower);
    this.sound.play("build");
    this._updateHUD();
    this._saveRunState();
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
    this.sound.play("upgrade");
    this._updateHUD();
    this._updateTowerPanel();
    this._saveRunState();
  }

  sellSelectedTower() {
    const tower = this.selectedTower;
    if (!tower) return;
    this.gold += tower.sellValue();
    this.towers = this.towers.filter((t) => t !== tower);
    for (const [key, t] of this.spotTowers) {
      if (t === tower) this.spotTowers.delete(key);
    }
    this.sound.play("sell");
    this._deselectTower();
    this._updateHUD();
    this._saveRunState();
  }

  // -----------------------------------------------------------------------
  // Progresión del jugador (nivel/XP, persiste en localStorage)
  // -----------------------------------------------------------------------
  _loadPlayerProgress() {
    try {
      const raw = localStorage.getItem(SAVE_CONFIG.playerProgressKey);
      if (raw) {
        const data = JSON.parse(raw);
        this.playerLevel = data.level || 1;
        this.playerXp = data.xp || 0;
        return;
      }
    } catch (e) {
      // localStorage no disponible o dato corrupto: arrancar de cero.
    }
    this.playerLevel = 1;
    this.playerXp = 0;
  }

  _savePlayerProgress() {
    try {
      localStorage.setItem(
        SAVE_CONFIG.playerProgressKey,
        JSON.stringify({ level: this.playerLevel, xp: this.playerXp })
      );
    } catch (e) {
      // Sin persistencia disponible: la partida sigue igual, solo no se guarda.
    }
  }

  _xpToNextLevel() {
    if (this.playerLevel >= PLAYER_CONFIG.maxLevel) return Infinity;
    return Math.round(PLAYER_CONFIG.baseXp * Math.pow(PLAYER_CONFIG.xpGrowth, this.playerLevel - 1));
  }

  _addPlayerXp(amount) {
    if (this.playerLevel >= PLAYER_CONFIG.maxLevel) return;
    this.playerXp += amount;
    let leveledUp = false;
    while (this.playerLevel < PLAYER_CONFIG.maxLevel && this.playerXp >= this._xpToNextLevel()) {
      this.playerXp -= this._xpToNextLevel();
      this.playerLevel++;
      leveledUp = true;
    }
    this._savePlayerProgress();
    if (leveledUp) {
      this._setMessage(`¡Subiste a nivel ${this.playerLevel}!`);
      this.sound.play("levelUp");
      this._spawnFloatingText(this.map.castle.x, this.map.castle.y - 70, `¡Nivel ${this.playerLevel}!`, "#4f9bd6");
    }
  }

  // -----------------------------------------------------------------------
  // Efectos visuales (partículas / texto flotante / rayos)
  // -----------------------------------------------------------------------
  _spawnBurst(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 90;
      this.effects.push(
        new Particle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, color, 0.35 + Math.random() * 0.25, 2 + Math.random() * 2)
      );
    }
  }

  _spawnFloatingText(x, y, text, color) {
    this.effects.push(new FloatingText(x, y, text, color));
  }

  // -----------------------------------------------------------------------
  // Habilidades especiales
  // -----------------------------------------------------------------------
  useAbility(id) {
    const def = ABILITY_TYPES[id];
    if (!def) return;

    if (this.playerLevel < def.unlockLevel) {
      this._setMessage(`${def.name} se desbloquea en el nivel ${def.unlockLevel}.`);
      return;
    }
    if (this.abilityCooldowns[id] > 0) return;
    if (this.state !== "wave") {
      this._setMessage("Las habilidades solo se pueden usar durante una oleada.");
      return;
    }

    if (def.targeted) {
      if (this.armedAbility === id) {
        this.armedAbility = null;
        this._setMessage("Habilidad cancelada.");
      } else {
        this.armedAbility = id;
        this._setMessage(`Hacé clic en el mapa para usar ${def.name}.`);
      }
      this._updateHUD();
      return;
    }

    this._activateAbility(id, null);
  }

  _activateAbility(id, point) {
    const def = ABILITY_TYPES[id];
    if (!def || this.playerLevel < def.unlockLevel || this.abilityCooldowns[id] > 0) {
      this.armedAbility = null;
      return;
    }

    if (id === "freeze") {
      for (const e of this.enemies) {
        if (!e.alive) continue;
        e.applySlow(0, def.duration);
        this._spawnBurst(e.x, e.y, "#a8d8ff", 5);
      }
    } else if (id === "fireRain" && point) {
      this._spawnBurst(point.x, point.y, "#ff8a3d", 16);
      for (const e of this.enemies) {
        if (e.alive && Math.hypot(e.x - point.x, e.y - point.y) <= def.radius) {
          e.takeDamage(def.damage);
        }
      }
    } else if (id === "lightning" && point) {
      let target = null;
      let bestDist = Infinity;
      for (const e of this.enemies) {
        if (!e.alive) continue;
        const dist = Math.hypot(e.x - point.x, e.y - point.y);
        if (dist < bestDist) {
          bestDist = dist;
          target = e;
        }
      }
      if (!target) {
        this._setMessage("No hay enemigos cerca de ese punto.");
        this.armedAbility = null;
        this._updateHUD();
        return;
      }
      const hit = new Set([target]);
      const chainPoints = [{ x: point.x, y: point.y }, { x: target.x, y: target.y }];
      target.takeDamage(def.damage);
      let hits = 1;
      for (const e of this.enemies) {
        if (hits >= def.maxTargets) break;
        if (hit.has(e) || !e.alive) continue;
        if (Math.hypot(e.x - target.x, e.y - target.y) <= def.chainRadius) {
          e.takeDamage(def.damage);
          hit.add(e);
          chainPoints.push({ x: e.x, y: e.y });
          hits++;
        }
      }
      this.effects.push(new LightningEffect(chainPoints, "#fff2c2"));
    }

    this.abilityCooldowns[id] = def.cooldown;
    this.armedAbility = null;
    this.sound.play("ability");
    this._setMessage(`${def.name} usada.`);
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
    this.sound.play("waveStart");
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
    for (const id in this.abilityCooldowns) {
      if (this.abilityCooldowns[id] > 0) this.abilityCooldowns[id] = Math.max(0, this.abilityCooldowns[id] - dt);
    }
    if (this.castleFlashTimer > 0) this.castleFlashTimer = Math.max(0, this.castleFlashTimer - dt);

    this.effects = this.effects.filter((e) => e.alive);
    for (const e of this.effects) e.update(dt);

    if (this.state === "countdown") {
      this.countdown -= dt;
      this._updateHUD();
      if (this.countdown <= 0) this._beginSpawning();
      return;
    }

    if (this.state !== "wave") {
      this._updateHUD();
      return;
    }

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

    for (const proj of this.projectiles) {
      proj.update(dt, this.enemies);
      if (proj.justImpacted) {
        this._spawnBurst(proj.x, proj.y, proj.color, 4);
        proj.justImpacted = false;
      }
    }

    // Recompensas por enemigos muertos por daño (no los que llegaron al castillo)
    for (const enemy of this.enemies) {
      if (!enemy.alive && !enemy.reachedCastle && !enemy._rewarded) {
        enemy._rewarded = true;
        this.gold += enemy.def.reward;
        this.goldEarned += enemy.def.reward;
        this.xpEarned += enemy.def.xp;
        this.enemiesDefeated++;
        this._addPlayerXp(enemy.def.xp);
        this.sound.play("death");
        this._spawnBurst(enemy.x, enemy.y, enemy.def.bodyColor, enemy.def.isBoss ? 22 : 9);
        this._spawnFloatingText(enemy.x, enemy.y - enemy.radius - 4, `+${enemy.def.reward}`, "#ffd76b");
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
    this.castleFlashTimer = 0.25;
    this.sound.play("castleHit");
  }

  _onWaveCleared() {
    this.currentWaveIndex++;
    if (this.currentWaveIndex >= WAVE_CONFIG.length) {
      this._onVictory();
    } else {
      this.state = "waiting";
      this._setMessage('Oleada superada. Presioná "Iniciar oleada" para continuar.');
      this._updateHUD();
      this._saveRunState();
    }
  }

  _onVictory() {
    this.state = "victory";
    this.sound.play("victory");
    this._clearRunState();
    this._showEndScreen(true);
  }

  _onDefeat() {
    this.state = "defeat";
    this.sound.play("defeat");
    this._clearRunState();
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
    if (h.playerLevel) h.playerLevel.textContent = `Nivel ${this.playerLevel}`;
    if (h.xpBar) {
      const pct =
        this.playerLevel >= PLAYER_CONFIG.maxLevel ? 100 : Math.min(100, (this.playerXp / this._xpToNextLevel()) * 100);
      h.xpBar.style.width = `${pct}%`;
    }
    if (h.towerButtons) {
      h.towerButtons.forEach((btn, i) => {
        const def = Object.values(TOWER_TYPES)[i];
        const locked = this.playerLevel < (def.unlockLevel || 1);
        btn.classList.toggle("is-locked", locked);
      });
    }
    if (h.abilityButtons) {
      Object.entries(h.abilityButtons).forEach(([id, refs]) => {
        const def = ABILITY_TYPES[id];
        const locked = this.playerLevel < def.unlockLevel;
        const cd = this.abilityCooldowns[id] || 0;
        refs.button.classList.toggle("is-locked", locked);
        refs.button.classList.toggle("is-active", this.armedAbility === id);
        refs.button.disabled = locked || cd > 0 || this.state !== "wave";
        refs.cooldownEl.textContent = locked ? `Nv.${def.unlockLevel}` : cd > 0 ? Math.ceil(cd) : "";
        refs.cooldownEl.classList.toggle("hidden", !(locked || cd > 0));
      });
    }
    if (this.canvas) this.canvas.classList.toggle("is-targeting", !!this.armedAbility);
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
      <p>Nivel de jugador: ${this.playerLevel}</p>
    `;
  }

  restart() {
    this.castleHp = this.castleMaxHp;
    this.gold = ECONOMY_CONFIG.startingGold;
    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.effects = [];
    this.castleFlashTimer = 0;
    this.spotTowers.clear();
    this._deselectTower();
    Object.keys(this.abilityCooldowns).forEach((id) => (this.abilityCooldowns[id] = 0));
    this.armedAbility = null;
    this.state = "waiting";
    this.currentWaveIndex = 0;
    this.enemiesDefeated = 0;
    this.goldEarned = 0;
    this.xpEarned = 0;
    this.hud.endScreen.classList.add("hidden");
    this._setMessage('Presioná "Iniciar oleada" cuando estés listo.');
    this._updateHUD();
    this._saveRunState();
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
    for (const e of this.effects) e.draw(ctx);

    if (this.castleFlashTimer > 0) {
      ctx.fillStyle = `rgba(163,40,60,${(this.castleFlashTimer / 0.25) * 0.35})`;
      ctx.fillRect(0, 0, width, height);
    }
  }

  _drawTerrain(ctx) {
    const { width, height, terrainColors } = this.map;
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, terrainColors.top);
    grad.addColorStop(1, terrainColors.bottom);
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
