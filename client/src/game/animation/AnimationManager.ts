import {
  Animation,
  AnimationType,
  AnimationState,
  AnimationCallback,
  UnitMoveAnimation,
  UnitAttackAnimation,
  DamageNumberAnimation,
} from 'shared';
import { hexToPixel, HexRenderConfig } from '../map/HexRenderer';

// 生成唯一ID
function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export class AnimationManager {
  private animations: Map<string, Animation> = new Map();
  private callbacks: Map<string, AnimationCallback[]> = new Map();

  // 添加动画
  addAnimation(animation: Animation, callback?: AnimationCallback): void {
    animation.state = AnimationState.RUNNING;
    this.animations.set(animation.id, animation);
    if (callback) {
      this.callbacks.set(animation.id, [callback]);
    }
  }

  // 创建单位移动动画
  createMoveAnimation(
    unitId: string,
    from: { q: number; r: number },
    to: { q: number; r: number },
    duration: number = 300
  ): UnitMoveAnimation {
    return {
      id: generateId(),
      type: AnimationType.UNIT_MOVE,
      state: AnimationState.PENDING,
      startTime: 0,
      duration,
      unitId,
      from,
      to,
      path: [from, to],
    };
  }

  // 创建攻击动画
  createAttackAnimation(
    attackerId: string,
    attackerCoord: { q: number; r: number },
    targetCoord: { q: number; r: number },
    damage: number,
    duration: number = 400
  ): UnitAttackAnimation {
    return {
      id: generateId(),
      type: AnimationType.UNIT_ATTACK,
      state: AnimationState.PENDING,
      startTime: 0,
      duration,
      attackerId,
      attackerCoord,
      targetCoord,
      damage,
    };
  }

  // 创建伤害数字动画
  createDamageNumberAnimation(
    x: number,
    y: number,
    damage: number,
    isHeal: boolean = false,
    duration: number = 1000
  ): DamageNumberAnimation {
    return {
      id: generateId(),
      type: AnimationType.DAMAGE_NUMBER,
      state: AnimationState.PENDING,
      startTime: 0,
      duration,
      x,
      y,
      damage,
      isHeal,
    };
  }

  // 更新所有动画
  update(deltaTime: number): void {
    this.animations.forEach((animation, id) => {
      if (animation.state === AnimationState.RUNNING) {
        animation.startTime += deltaTime;

        if (animation.startTime >= animation.duration) {
          animation.state = AnimationState.COMPLETED;
          this.triggerCallbacks(animation);
          this.animations.delete(id);
          this.callbacks.delete(id);
        }
      }
    });
  }

  // 渲染所有动画
  render(ctx: CanvasRenderingContext2D, config: HexRenderConfig): void {
    this.animations.forEach(animation => {
      const progress = animation.startTime / animation.duration;

      switch (animation.type) {
        case AnimationType.UNIT_MOVE:
          this.renderMoveAnimation(ctx, animation as UnitMoveAnimation, config, progress);
          break;
        case AnimationType.UNIT_ATTACK:
          this.renderAttackAnimation(ctx, animation as UnitAttackAnimation, config, progress);
          break;
        case AnimationType.DAMAGE_NUMBER:
          this.renderDamageNumber(ctx, animation as DamageNumberAnimation, progress);
          break;
      }
    });
  }

  // 渲染移动动画
  private renderMoveAnimation(
    ctx: CanvasRenderingContext2D,
    animation: UnitMoveAnimation,
    config: HexRenderConfig,
    progress: number
  ): void {
    const fromPixel = hexToPixel(animation.from, config);
    const toPixel = hexToPixel(animation.to, config);

    // 平滑插值
    const eased = this.easeInOutQuad(progress);
    const x = fromPixel.x + (toPixel.x - fromPixel.x) * eased;
    const y = fromPixel.y + (toPixel.y - fromPixel.y) * eased;

    // 绘制移动轨迹
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(fromPixel.x, fromPixel.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.restore();

    // 绘制移动指示器
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(x, y, config.hexSize * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
  }

  // 渲染攻击动画
  private renderAttackAnimation(
    ctx: CanvasRenderingContext2D,
    animation: UnitAttackAnimation,
    config: HexRenderConfig,
    progress: number
  ): void {
    const fromPixel = hexToPixel(animation.attackerCoord, config);
    const toPixel = hexToPixel(animation.targetCoord, config);

    // 攻击波效果
    if (progress < 0.5) {
      const attackProgress = progress * 2;
      const x = fromPixel.x + (toPixel.x - fromPixel.x) * attackProgress;
      const y = fromPixel.y + (toPixel.y - fromPixel.y) * attackProgress;

      ctx.save();
      ctx.globalAlpha = 1 - attackProgress;
      ctx.beginPath();
      ctx.arc(x, y, 10 + attackProgress * 20, 0, Math.PI * 2);
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    } else {
      // 命中效果
      const hitProgress = (progress - 0.5) * 2;
      const radius = 20 + hitProgress * 30;

      ctx.save();
      ctx.globalAlpha = 1 - hitProgress;
      ctx.beginPath();
      ctx.arc(toPixel.x, toPixel.y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = '#ff6600';
      ctx.lineWidth = 4;
      ctx.stroke();

      // 内圈
      ctx.beginPath();
      ctx.arc(toPixel.x, toPixel.y, radius * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 100, 0, 0.3)';
      ctx.fill();
      ctx.restore();
    }
  }

  // 渲染伤害数字
  private renderDamageNumber(
    ctx: CanvasRenderingContext2D,
    animation: DamageNumberAnimation,
    progress: number
  ): void {
    const offsetY = -30 - progress * 50;
    const alpha = 1 - progress;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const text = animation.isHeal ? `+${animation.damage}` : `-${animation.damage}`;
    ctx.fillStyle = animation.isHeal ? '#22c55e' : '#ef4444';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;

    // 描边
    ctx.strokeText(text, animation.x, animation.y + offsetY);
    // 填充
    ctx.fillText(text, animation.x, animation.y + offsetY);

    ctx.restore();
  }

  // 缓动函数
  private easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  // 触发回调
  private triggerCallbacks(animation: Animation): void {
    const callbacks = this.callbacks.get(animation.id) || [];
    callbacks.forEach(cb => cb(animation));
  }

  // 清除所有动画
  clear(): void {
    this.animations.clear();
    this.callbacks.clear();
  }

  // 检查是否有正在运行的动画
  hasRunningAnimations(): boolean {
    return this.animations.size > 0;
  }
}

// 全局动画管理器实例
export const animationManager = new AnimationManager();
