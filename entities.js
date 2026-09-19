/* =========================================================================
   KINGDOM DEFENDERS — ENTIDADES
   Clases de juego: Enemy, Tower, Projectile. No conocen el DOM ni el HUD,
   ni cómo se dibujan en 3D (eso vive en render3d.js, que lee su estado
   x/y/hp/def directamente). Solo estado + update(dt).
   Los efectos visuales (Particle/FloatingText/LightningEffect) son la
   excepción: siguen dibujándose en un canvas 2D superpuesto (overlay),
   por eso conservan su propio draw(ctx, project).
   ========================================================================= */

// ---------------------------------------------------------------------------
// Enemy
// ---------------------------------------------------------------------------
class Enemy {
  constructor(typeId, path) {
    const def = ENEMY_TYPES[typeId];
    this.typeId = typeId;
    this.def = def;
    this.path = path;
    this.waypointIndex = 1; // ya arranca en path[0]
    this.x = path[0].x;
    this.y = path[0].y;
    this.hp = def.hp;
    this.maxHp = def.hp;
    this.speed = def.speed;
    this.radius = def.radius;
    this.alive = true;
    this.reachedCastle = false;
    this.speedMultiplier = 1; // 1 = velocidad normal, <1 = ralentizado
    this.slowTimer = 0; // segundos restantes de ralentización
  }

  applySlow(factor, duration) {
    // Un golpe de ralentización nuevo siempre refresca la duración (no se acumulan).
    this.speedMultiplier = factor;
    this.slowTimer = duration;
  }

  update(dt) {
    if (!this.alive) return;

    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      if (this.slowTimer <= 0) this.speedMultiplier = 1;
    }

    const target = this.path[this.waypointIndex];
    if (!target) {
      this.reachedCastle = true;
      this.alive = false;
      return;
    }

    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.hypot(dx, dy);
    const step = this.speed * this.speedMultiplier * dt;

    if (dist <= step) {
      this.x = target.x;
      this.y = target.y;
      this.waypointIndex++;
    } else {
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
    }
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0 && this.alive) {
      this.hp = 0;
      this.alive = false;
    }
  }

  // El cuerpo ahora es una malla 3D real (Renderer3D la crea/actualiza leyendo
  // x/y/hp/def directamente). Acá solo queda la barra de vida, dibujada como
  // overlay 2D sobre la posición proyectada del enemigo en pantalla.
  drawHealthBar(ctx, project) {
    const p = project(this.x, this.y);
    if (!p || p.visible === false) return;

    const barW = 34;
    const barH = 4;
    const barX = p.sx - barW / 2;
    const barY = p.sy - 8;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(barX, barY, barW, barH);
    const hpRatio = Math.max(0, this.hp / this.maxHp);
    ctx.fillStyle = hpRatio > 0.5 ? "#6fbf4f" : hpRatio > 0.25 ? "#e0b23a" : "#c0432f";
    ctx.fillRect(barX, barY, barW * hpRatio, barH);
  }
}

// ---------------------------------------------------------------------------
// Efectos visuales (partículas, texto flotante, rayos): solo presentación,
// no afectan el balance del juego. update(dt) + draw(ctx) + alive, como
// cualquier otra entidad, para poder vivir en el mismo array genérico.
// ---------------------------------------------------------------------------
class Particle {
  constructor(x, y, vx, vy, color, life, radius) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.radius = radius;
    this.alive = true;
  }

  update(dt) {
    this.life -= dt;
    if (this.life <= 0) {
      this.alive = false;
      return;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= 0.93;
    this.vy *= 0.93;
  }

  draw(ctx, project) {
    const p = project(this.x, this.y);
    const t = Math.max(0, this.life / this.maxLife);
    ctx.globalAlpha = t;
    ctx.beginPath();
    ctx.arc(p.sx, p.sy, this.radius * t, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

class FloatingText {
  constructor(x, y, text, color) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.life = 0.8;
    this.maxLife = 0.8;
    this.alive = true;
  }

  update(dt) {
    this.life -= dt;
    if (this.life <= 0) this.alive = false;
    // La posición en el mapa (x,y) no cambia: la animación de "subir" ahora
    // la aplica el renderer (una altura 3D creciente), no un desplazamiento
    // de coordenadas de mundo.
  }

  draw(ctx, project) {
    const p = project(this.x, this.y);
    const t = Math.max(0, this.life / this.maxLife);
    ctx.globalAlpha = t;
    ctx.fillStyle = this.color;
    ctx.font = "bold 13px 'Cinzel', Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText(this.text, p.sx, p.sy);
    ctx.globalAlpha = 1;
    ctx.textAlign = "start";
  }
}

class LightningEffect {
  constructor(points, color) {
    this.points = points;
    this.color = color;
    this.life = 0.25;
    this.maxLife = 0.25;
    this.alive = true;
  }

  update(dt) {
    this.life -= dt;
    if (this.life <= 0) this.alive = false;
  }

  draw(ctx, project) {
    if (this.points.length < 2) return;
    const pts = this.points.map((pt) => project(pt.x, pt.y));
    const t = Math.max(0, this.life / this.maxLife);
    ctx.globalAlpha = t;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(pts[0].sx, pts[0].sy);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].sx, pts[i].sy);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

// ---------------------------------------------------------------------------
// Projectile
// ---------------------------------------------------------------------------
class Projectile {
  // options (todas opcionales, data-driven desde TOWER_TYPES):
  //   slowFactor/slowDuration -> ralentiza al objetivo impactado.
  //   splashRadius/maxTargets -> también daña otros enemigos cercanos al impacto.
  constructor(x, y, target, damage, speed, color, options) {
    this.x = x;
    this.y = y;
    this.target = target;
    this.damage = damage;
    this.speed = speed;
    this.color = color;
    this.alive = true;
    this.justImpacted = false; // flag de un frame, para disparar efectos de impacto
    const opts = options || {};
    this.slowFactor = opts.slowFactor || null;
    this.slowDuration = opts.slowDuration || 0;
    this.splashRadius = opts.splashRadius || 0;
    this.maxTargets = opts.maxTargets || 1;
  }

  _onImpact(enemies) {
    this.justImpacted = true;
    this.target.takeDamage(this.damage);
    if (this.slowFactor) this.target.applySlow(this.slowFactor, this.slowDuration);

    if (this.splashRadius > 0 && this.maxTargets > 1 && enemies) {
      let hits = 1;
      for (const e of enemies) {
        if (hits >= this.maxTargets) break;
        if (e === this.target || !e.alive) continue;
        if (Math.hypot(e.x - this.x, e.y - this.y) <= this.splashRadius) {
          e.takeDamage(this.damage);
          hits++;
        }
      }
    }
  }

  update(dt, enemies) {
    if (!this.alive) return;
    if (!this.target || !this.target.alive) {
      this.alive = false;
      return;
    }

    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.hypot(dx, dy);
    const step = this.speed * dt;

    if (dist <= step) {
      this.x = this.target.x;
      this.y = this.target.y;
      this._onImpact(enemies);
      this.alive = false;
    } else {
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
    }
  }

  // Sin draw(): el proyectil ahora es una esfera 3D real que Renderer3D crea
  // y mueve leyendo x/y/color directamente.
}

// ---------------------------------------------------------------------------
// Tower
// ---------------------------------------------------------------------------
class Tower {
  constructor(typeId, x, y) {
    const def = TOWER_TYPES[typeId];
    this.typeId = typeId;
    this.def = def;
    this.x = x;
    this.y = y;
    this.levelIndex = 0;
    this.cooldown = 0;
    this.target = null;

    const level0 = def.levels[0];
    this.totalInvested = level0.cost;
    this._applyLevelStats(level0);
  }

  _applyLevelStats(levelDef) {
    this.damage = levelDef.damage;
    this.range = levelDef.range;
    this.fireRate = levelDef.fireRate; // disparos/seg
  }

  get level() {
    return this.levelIndex + 1;
  }

  get maxLevel() {
    return this.def.levels.length;
  }

  canUpgrade() {
    return this.levelIndex < this.maxLevel - 1;
  }

  nextUpgradeCost() {
    return this.canUpgrade() ? this.def.levels[this.levelIndex + 1].cost : null;
  }

  upgrade() {
    if (!this.canUpgrade()) return false;
    this.levelIndex++;
    const levelDef = this.def.levels[this.levelIndex];
    this.totalInvested += levelDef.cost;
    this._applyLevelStats(levelDef);
    return true;
  }

  sellValue() {
    const ratio = this.def.sellRefund != null ? this.def.sellRefund : 0.6;
    return Math.round(this.totalInvested * ratio);
  }

  // Reconstruye una torre guardada (sistema de guardado) al nivel indicado,
  // recalculando el oro invertido a partir de los costos de cada nivel.
  restoreLevel(levelIndex) {
    this.levelIndex = Math.min(Math.max(levelIndex || 0, 0), this.maxLevel - 1);
    let invested = 0;
    for (let i = 0; i <= this.levelIndex; i++) invested += this.def.levels[i].cost;
    this.totalInvested = invested;
    this._applyLevelStats(this.def.levels[this.levelIndex]);
  }

  findTarget(enemies) {
    // Prioridad simple (fase 1): el enemigo más avanzado en rango.
    let best = null;
    let bestProgress = -Infinity;
    for (const e of enemies) {
      if (!e.alive) continue;
      const dist = Math.hypot(e.x - this.x, e.y - this.y);
      if (dist <= this.range) {
        const progress = e.waypointIndex * 10000 - dist; // más cerca de la meta = mayor prioridad
        if (progress > bestProgress) {
          bestProgress = progress;
          best = e;
        }
      }
    }
    return best;
  }

  update(dt, enemies, projectiles) {
    this.cooldown -= dt;

    if (!this.target || !this.target.alive) {
      this.target = this.findTarget(enemies);
    } else {
      const dist = Math.hypot(this.target.x - this.x, this.target.y - this.y);
      if (dist > this.range) this.target = this.findTarget(enemies);
    }

    if (this.target && this.cooldown <= 0) {
      projectiles.push(
        new Projectile(this.x, this.y, this.target, this.damage, this.def.projectileSpeed, this.def.projectileColor, {
          slowFactor: this.def.slowFactor,
          slowDuration: this.def.slowDuration,
          splashRadius: this.def.splashRadius,
          maxTargets: this.def.maxTargets
        })
      );
      this.cooldown = 1 / this.fireRate;
    }
  }

  // Sin draw(): el cuerpo/techo ahora es una malla 3D real (Renderer3D la
  // crea/escala con el nivel). El indicador de rango es un anillo 3D plano
  // sobre el suelo (exacto: ya no hace falta aproximar una elipse).
}
