/* =========================================================================
   KINGDOM DEFENDERS — ENTIDADES
   Clases de juego: Enemy, Tower, Projectile.
   No conocen el DOM ni el HUD: solo estado + update(dt) + draw(ctx).
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

  draw(ctx) {
    const d = this.def;

    // sombra
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + this.radius * 0.7, this.radius * 0.9, this.radius * 0.35, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fill();

    // cuerpo
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = d.bodyColor;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = d.darkColor;
    ctx.stroke();

    // tinte azulado si está ralentizado
    if (this.slowTimer > 0) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(120,180,255,0.35)";
      ctx.fill();
    }

    // ojos (le da vida sin necesitar sprites)
    ctx.fillStyle = "#fff2c2";
    ctx.beginPath();
    ctx.arc(this.x - this.radius * 0.35, this.y - this.radius * 0.15, this.radius * 0.18, 0, Math.PI * 2);
    ctx.arc(this.x + this.radius * 0.35, this.y - this.radius * 0.15, this.radius * 0.18, 0, Math.PI * 2);
    ctx.fill();

    // barra de vida
    const barW = this.radius * 2.2;
    const barH = 4;
    const barX = this.x - barW / 2;
    const barY = this.y - this.radius - 10;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(barX, barY, barW, barH);
    const hpRatio = Math.max(0, this.hp / this.maxHp);
    ctx.fillStyle = hpRatio > 0.5 ? "#6fbf4f" : hpRatio > 0.25 ? "#e0b23a" : "#c0432f";
    ctx.fillRect(barX, barY, barW * hpRatio, barH);
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
    const opts = options || {};
    this.slowFactor = opts.slowFactor || null;
    this.slowDuration = opts.slowDuration || 0;
    this.splashRadius = opts.splashRadius || 0;
    this.maxTargets = opts.maxTargets || 1;
  }

  _onImpact(enemies) {
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

  draw(ctx) {
    if (!this.alive) return;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.4)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
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

  draw(ctx, showRange) {
    if (showRange) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // base
    ctx.beginPath();
    ctx.arc(this.x, this.y + 4, 20, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fill();

    ctx.fillStyle = this.def.color;
    ctx.fillRect(this.x - 16, this.y - 22, 32, 34);
    ctx.strokeStyle = "#2c1c10";
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x - 16, this.y - 22, 32, 34);

    // techo/torreta
    ctx.beginPath();
    ctx.moveTo(this.x - 20, this.y - 22);
    ctx.lineTo(this.x, this.y - 40);
    ctx.lineTo(this.x + 20, this.y - 22);
    ctx.closePath();
    ctx.fillStyle = this.def.accentColor;
    ctx.fill();
    ctx.stroke();

    // dirección hacia el objetivo (arma apuntando)
    if (this.target && this.target.alive) {
      const angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
      ctx.strokeStyle = this.def.projectileColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - 6);
      ctx.lineTo(this.x + Math.cos(angle) * 22, this.y - 6 + Math.sin(angle) * 22);
      ctx.stroke();
    }

    // pips de nivel
    const pipsY = this.y - 46;
    const pipsStartX = this.x - ((this.maxLevel - 1) * 7) / 2;
    for (let i = 0; i < this.maxLevel; i++) {
      ctx.beginPath();
      ctx.arc(pipsStartX + i * 7, pipsY, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = i <= this.levelIndex ? "#e0b23a" : "rgba(255,255,255,0.25)";
      ctx.fill();
    }
  }
}
