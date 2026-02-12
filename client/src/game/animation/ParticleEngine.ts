import { ParticleConfig } from 'shared';

export class ParticleEngine {
  private particles: ParticleConfig[] = [];
  private maxParticles: number = 200;

  // 发射粒子
  emit(config: {
    x: number;
    y: number;
    vx?: number;
    vy?: number;
    count?: number;
    spread?: number;
    size?: number;
    color: string;
    life?: number;
    gravity?: number;
  }): void {
    const count = config.count || 1;
    const spread = config.spread || 0;
    const size = config.size || 3;
    const life = config.life || 500;
    const gravity = config.gravity || 0;

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;

      this.particles.push({
        x: config.x + (Math.random() - 0.5) * spread,
        y: config.y + (Math.random() - 0.5) * spread,
        vx: (config.vx || 0) + (Math.random() - 0.5) * 2,
        vy: (config.vy || 0) + (Math.random() - 0.5) * 2,
        life: 0,
        maxLife: life * (0.8 + Math.random() * 0.4),
        size: size * (0.8 + Math.random() * 0.4),
        color: config.color,
        alpha: 1,
        gravity,
      });
    }
  }

  // 创建攻击特效
  createAttackEffect(x: number, y: number, color: string = '#ff4444'): void {
    this.emit({
      x,
      y,
      vx: 0,
      vy: -2,
      count: 15,
      spread: 10,
      size: 4,
      color,
      life: 400,
      gravity: 0.1,
    });
  }

  // 创建城市建造特效
  createBuildEffect(x: number, y: number): void {
    this.emit({
      x,
      y,
      vx: 0,
      vy: -3,
      count: 25,
      spread: 20,
      size: 3,
      color: '#FFD700',
      life: 800,
      gravity: 0.05,
    });
  }

  // 创建单位死亡特效
  createDeathEffect(x: number, y: number): void {
    this.emit({
      x,
      y,
      vx: 0,
      vy: 0,
      count: 30,
      spread: 5,
      size: 5,
      color: '#888888',
      life: 600,
      gravity: 0.15,
    });
  }

  // 创建选中特效
  createSelectEffect(x: number, y: number): void {
    this.emit({
      x,
      y,
      vx: 0,
      vy: -1,
      count: 8,
      spread: 15,
      size: 2,
      color: '#ffffff',
      life: 300,
      gravity: 0,
    });
  }

  // 更新粒子
  update(deltaTime: number): void {
    this.particles = this.particles.filter(p => {
      p.life += deltaTime;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity || 0;
      p.alpha = 1 - (p.life / p.maxLife);

      // 粒子逐渐变小
      const lifeRatio = p.life / p.maxLife;
      if (lifeRatio > 0.5) {
        p.size *= 0.98;
      }

      return p.life < p.maxLife && p.size > 0.5;
    });
  }

  // 渲染粒子
  render(ctx: CanvasRenderingContext2D): void {
    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.restore();
    });
  }

  // 清除所有粒子
  clear(): void {
    this.particles = [];
  }

  // 获取粒子数量
  getParticleCount(): number {
    return this.particles.length;
  }
}

// 全局粒子引擎实例
export const particleEngine = new ParticleEngine();
