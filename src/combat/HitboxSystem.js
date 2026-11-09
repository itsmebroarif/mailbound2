// Pure geometry queries used by combat. Targets are objects with a `pos`
// Vector3-like and an optional `radius`.

export function sectorHits(origin, facing, radius, halfAngle, targets) {
  const out = [];
  const fx = Math.sin(facing);
  const fz = Math.cos(facing);
  for (const target of targets) {
    const dx = target.pos.x - origin.x;
    const dz = target.pos.z - origin.z;
    const distSq = dx * dx + dz * dz;
    const targetR = target.radius ?? 0.5;
    if (distSq > (radius + targetR) * (radius + targetR)) continue;
    if (distSq < 1e-6) { out.push(target); continue; }
    const len = Math.sqrt(distSq);
    const nx = dx / len;
    const nz = dz / len;
    const dot = nx * fx + nz * fz;
    const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
    if (angle <= halfAngle) out.push(target);
  }
  return out;
}

export function sphereHits(origin, radius, targets) {
  const out = [];
  const r2 = radius * radius;
  for (const t of targets) {
    const dx = t.pos.x - origin.x;
    const dz = t.pos.z - origin.z;
    const dy = t.pos.y - origin.y;
    if (dx * dx + dz * dz * 0.75 + dy * dy < (radius + (t.radius ?? 0.5)) * (radius + (t.radius ?? 0.5))) {
      out.push(t);
    }
  }
  return out;
}

export function segmentHits(p0, p1, radius, targets) {
  const out = [];
  const sx = p1.x - p0.x;
  const sz = p1.z - p0.z;
  const segLenSq = sx * sx + sz * sz || 1e-6;
  for (const t of targets) {
    const px = t.pos.x - p0.x;
    const pz = t.pos.z - p0.z;
    let k = (px * sx + pz * sz) / segLenSq;
    k = Math.max(0, Math.min(1, k));
    const cx = p0.x + sx * k;
    const cz = p0.z + sz * k;
    const dx = t.pos.x - cx;
    const dz = t.pos.z - cz;
    const distSq = dx * dx + dz * dz;
    if (distSq <= (radius + (t.radius ?? 0.5)) * (radius + (t.radius ?? 0.5))) out.push(t);
  }
  return out;
}
