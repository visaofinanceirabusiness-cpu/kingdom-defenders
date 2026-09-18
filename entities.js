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

  draw(ctx, isoProject) {
    const d = this.def;
    const p = isoProject(this.x, this.y);
    const x = p.sx;
    const y = p.sy;
    const r = this.radius;

    // sombra en el suelo (achatada, como corresponde a una vista isométrica)
    ctx.beginPath();
    ctx.ellipse(x, y + r * 0.4, r * 0.95, r * 0.4, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fill();

    // cuerpo con degradé radial (bisel esférico, en vez de color plano)
    const bodyGrad = ctx.createRadialGradient(x - r * 0.35, y - r * 0.9, r * 0.2, x, y - r * 0.5, r * 1.3);
    bodyGrad.addColorStop(0, this._lighten(d.bodyColor, 0.35));
    bodyGrad.addColorStop(0.6, d.bodyColor);
    bodyGrad.addColorStop(1, d.darkColor);
    ctx.beginPath();
    ctx.arc(x, y - r * 0.5, r, 0, Math.PI * 2);
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = d.darkColor;
    ctx.stroke();

    // anillo dorado distintivo para jefes
    if (d.isBoss) {
      ctx.beginPath();
      ctx.arc(x, y - r * 0.5, r + 5, 0, Math.PI * 2);
      ctx.strokeStyle = "#e0b23a";
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // tinte azulado si está ralentizado
    if (this.slowTimer > 0) {
      ctx.beginPath();
      ctx.arc(x, y - r * 0.5, r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(120,180,255,0.35)";
      ctx.fill();
    }

    // ojos (le da vida sin necesitar sprites)
    ctx.fillStyle = "#fff2c2";
    ctx.beginPath();
    ctx.arc(x - r * 0.35, y - r * 0.65, r * 0.18, 0, Math.PI * 2);
    ctx.arc(x + r * 0.35, y - r * 0.65, r * 0.18, 0, Math.PI * 2);
    ctx.fill();

    // barra de vida
    const barW = r * 2.2;
    const barH = 4;
    const barX = x - barW / 2;
    const barY = y - r * 1.5 - 10;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(barX, barY, barW, barH);
    const hpRatio = Math.max(0, this.hp / this.maxHp);
    ctx.fillStyle = hpRatio > 0.5 ? "#6fbf4f" : hpRatio > 0.25 ? "#e0b23a" : "#c0432f";
    ctx.fillRect(barX, barY, barW * hpRatio, barH);
  }

  // Aclara un color hex "#rrggbb" hacia blanco en la proporción dada (0-1),
  // para armar degradés de bisel sin necesitar una paleta de colores extra.
  _lighten(hex, amount) {
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    const mix = (c) => Math.round(c + (255 - c) * amount);
    return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
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

  draw(ctx, isoProject) {
    const p = isoProject(this.x, this.y);
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
    if (this.life <= 0) {
      this.alive = false;
      return;
    }
    this.y -= 26 * dt;
  }

  draw(ctx, isoProject) {
    const p = isoProject(this.x, this.y);
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

  draw(ctx, isoProject) {
    if (this.points.length < 2) return;
    const pts = this.points.map((pt) => isoProject(pt.x, pt.y));
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

  draw(ctx, isoProject) {
    if (!this.alive) return;
    const p = isoProject(this.x, this.y);
    ctx.beginPath();
    ctx.arc(p.sx, p.sy, 4, 0, Math.PI * 2);
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

  draw(ctx, isoProject, showRange) {
    const p = isoProject(this.x, this.y);
    const x = p.sx;
    const y = p.sy;

    if (showRange) {
      ctx.beginPath();
      // La proyección isométrica de un círculo de radio "range" es una elipse
      // con semiejes range*scale*√2 (se puede derivar de sx=(x-y)*A, sy=(x+y)*B).
      ctx.ellipse(
        x,
        y,
        this.range * ISO_CONFIG.scaleX * Math.SQRT2,
        this.range * ISO_CONFIG.scaleY * Math.SQRT2,
        0,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // sombra en el suelo
    ctx.beginPath();
    ctx.ellipse(x, y + 4, 20, 9, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fill();

    // cuerpo con degradé horizontal (cara iluminada / cara en sombra)
    const bodyGrad = ctx.createLinearGradient(x - 16, 0, x + 16, 0);
    bodyGrad.addColorStop(0, "#1c130a");
    bodyGrad.addColorStop(0.35, this.def.color);
    bodyGrad.addColorStop(1, "#000000aa");
    ctx.fillStyle = bodyGrad;
    ctx.fillRect(x - 16, y - 22, 32, 34);
    ctx.strokeStyle = "#2c1c10";
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 16, y - 22, 32, 34);

    // techo/torreta con degradé
    const roofGrad = ctx.createLinearGradient(x - 20, y - 40, x + 20, y - 22);
    roofGrad.addColorStop(0, this.def.accentColor);
    roofGrad.addColorStop(1, "#00000066");
    ctx.beginPath();
    ctx.moveTo(x - 20, y - 22);
    ctx.lineTo(x, y - 40);
    ctx.lineTo(x + 20, y - 22);
    ctx.closePath();
    ctx.fillStyle = roofGrad;
    ctx.fill();
    ctx.stroke();

    // dirección hacia el objetivo (arma apuntando)
    if (this.target && this.target.alive) {
      const t = isoProject(this.target.x, this.target.y);
      const angle = Math.atan2(t.sy - y, t.sx - x);
      ctx.strokeStyle = this.def.projectileColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y - 6);
      ctx.lineTo(x + Math.cos(angle) * 22, y - 6 + Math.sin(angle) * 22);
      ctx.stroke();
    }

    // pips de nivel
    const pipsY = y - 46;
    const pipsStartX = x - ((this.maxLevel - 1) * 7) / 2;
    for (let i = 0; i < this.maxLevel; i++) {
      ctx.beginPath();
      ctx.arc(pipsStartX + i * 7, pipsY, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = i <= this.levelIndex ? "#e0b23a" : "rgba(255,255,255,0.25)";
      ctx.fill();
    }
  }
}
