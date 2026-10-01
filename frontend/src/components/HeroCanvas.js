'use client';
import { useEffect, useRef } from 'react';

export default function HeroCanvas() {
  const ref = useRef(null);
  const failRef = useRef(false);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      let THREE;
      try {
        THREE = await import('three');
      } catch (e) {
        failRef.current = true;
        return;
      }
      if (disposed) return;

      const canvas = ref.current;
      if (!canvas) return;

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
      camera.position.set(0, 0, 11);

      const group = new THREE.Group();
      scene.add(group);

      // ---- nodes: one protocol hub + patient satellites + criterion nodes
      const N_PATIENTS = 7;
      const N_CRITERIA = 26;
      const nodeGeo = new THREE.SphereGeometry(0.09, 12, 12);
      const hubGeo = new THREE.SphereGeometry(0.2, 20, 20);

      const nodes = [];

      const hubMat = new THREE.MeshBasicMaterial({ color: 0xc0192b });
      const hub = new THREE.Mesh(hubGeo, hubMat);
      group.add(hub);
      nodes.push({ mesh: hub, base: 1, kind: 'hub' });

      const criterionMat = new THREE.MeshBasicMaterial({ color: 0xd8ccc8, transparent: true, opacity: 0.85 });
      const patientMat = new THREE.MeshBasicMaterial({ color: 0xc0192b, transparent: true, opacity: 0.55 });

      for (let i = 0; i < N_PATIENTS; i++) {
        const m = new THREE.Mesh(nodeGeo, patientMat);
        const a = (i / N_PATIENTS) * Math.PI * 2;
        const r = 3.05 + (i % 2) * 0.28;
        m.userData = { radius: r, angle: a, speed: 0.055 + (i % 3) * 0.014, tilt: (i % 5) * 0.22 };
        group.add(m);
        nodes.push({ mesh: m, base: 0.6, kind: 'patient', idx: i });
      }

      for (let i = 0; i < N_CRITERIA; i++) {
        const m = new THREE.Mesh(nodeGeo, criterionMat);
        const a = (i / N_CRITERIA) * Math.PI * 2 * 3;
        const r = 1.5 + ((i * 7) % 11) * 0.28;
        m.userData = { radius: r, angle: a, speed: -0.08 - ((i * 3) % 5) * 0.02, tilt: ((i * 5) % 7) * 0.3 };
        group.add(m);
        nodes.push({ mesh: m, base: 0.3, kind: 'criterion', idx: i });
      }

      // ---- edges
      const edgeMat = new THREE.LineBasicMaterial({ color: 0xc0192b, transparent: true, opacity: 0.16 });
      const edgeMatFaint = new THREE.LineBasicMaterial({ color: 0xb9aca7, transparent: true, opacity: 0.12 });

      const edges = [];
      for (let i = 0; i < N_PATIENTS; i++) {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
        const line = new THREE.Line(g, edgeMat);
        group.add(line);
        edges.push({ line, target: nodes[1 + i] });
      }
      for (let i = 0; i < N_CRITERIA; i++) {
        if (i % 3 !== 0) continue;
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
        const line = new THREE.Line(g, edgeMatFaint);
        group.add(line);
        edges.push({ line, target: nodes[1 + N_PATIENTS + i] });
      }

      // ---- travelling signal packets (the "matching" pulse)
      const PACKETS = 18;
      const packetGeo = new THREE.SphereGeometry(0.045, 8, 8);
      const packetMat = new THREE.MeshBasicMaterial({ color: 0xc0192b, transparent: true, opacity: 0.9 });
      const packets = [];
      for (let i = 0; i < PACKETS; i++) {
        const m = new THREE.Mesh(packetGeo, packetMat);
        m.userData = {
          t: Math.random(),
          speed: 0.16 + Math.random() * 0.2,
          targetIdx: 1 + (i % N_PATIENTS),
          offset: (Math.random() - 0.5) * 0.5
        };
        group.add(m);
        packets.push(m);
      }

      // ---- resize
      const resize = () => {
        const parent = canvas.parentElement;
        if (!parent) return;
        const w = parent.clientWidth;
        const h = parent.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      resize();
      const ro = new ResizeObserver(resize);
      if (canvas.parentElement) ro.observe(canvas.parentElement);

      // ---- pointer parallax
      const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
      const onMove = (e) => {
        const r = canvas.getBoundingClientRect();
        pointer.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        pointer.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      };
      window.addEventListener('pointermove', onMove, { passive: true });

      const clock = new THREE.Clock();
      let raf = 0;

      const render = () => {
        const t = clock.getElapsedTime();
        const dt = Math.min(clock.getDelta(), 0.05);

        pointer.x += (pointer.tx - pointer.x) * 0.045;
        pointer.y += (pointer.ty - pointer.y) * 0.045;

        group.rotation.y = t * 0.045 + pointer.x * 0.16;
        group.rotation.x = pointer.y * 0.1 + Math.sin(t * 0.14) * 0.045;

        // node placement
        for (const n of nodes) {
          const u = n.mesh.userData;
          if (!u || u.radius === undefined) {
            const s = 1 + Math.sin(t * 1.9) * 0.11;
            n.mesh.scale.setScalar(s);
            continue;
          }
          u.angle += u.speed * dt;
          const x = Math.cos(u.angle) * u.radius;
          const z = Math.sin(u.angle) * u.radius;
          const y = Math.sin(u.angle * 2 + u.tilt) * (u.radius * 0.32);
          n.mesh.position.set(x, y, z);
          const pulse = 1 + Math.sin(t * 1.5 + u.angle * 2) * 0.16;
          n.mesh.scale.setScalar(n.base * pulse);
          n.mesh.material.opacity = n.kind === 'patient' ? 0.4 + Math.sin(t * 1.3 + u.angle) * 0.16 : n.mesh.material.opacity;
        }

        // edges follow nodes
        for (const e of edges) {
          const pos = e.line.geometry.attributes.position;
          pos.setXYZ(0, 0, 0, 0);
          const p = e.target.mesh.position;
          pos.setXYZ(1, p.x, p.y, p.z);
          pos.needsUpdate = true;
          e.line.rotation.y = 0;
          e.line.rotation.x = 0;
        }
        // lines are children of group so they share rotation; re-parent offset:
        for (const e of edges) {
          e.line.geometry.attributes.position.array[0] = 0;
          e.line.geometry.attributes.position.array[1] = 0;
          e.line.geometry.attributes.position.array[2] = 0;
        }

        // packets travel hub -> patient
        for (const p of packets) {
          p.userData.t += p.userData.speed * dt;
          if (p.userData.t > 1) {
            p.userData.t = 0;
            p.userData.targetIdx = 1 + (p.userData.targetIdx % N_PATIENTS);
          }
          const target = nodes[p.userData.targetIdx].mesh.position;
          const k = p.userData.t;
          const ease = k * k * (3 - 2 * k);
          p.position.set(
            target.x * ease + p.userData.offset * 0.35 * Math.sin(k * Math.PI),
            target.y * ease + Math.sin(k * Math.PI) * 0.55,
            target.z * ease
          );
          p.scale.setScalar(0.7 + Math.sin(k * Math.PI) * 0.9);
        }

        renderer.render(scene, camera);
        raf = requestAnimationFrame(render);
      };
      render();

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        window.removeEventListener('pointermove', onMove);
        nodeGeo.dispose();
        hubGeo.dispose();
        packetGeo.dispose();
        hubMat.dispose();
        criterionMat.dispose();
        patientMat.dispose();
        packetMat.dispose();
        edgeMat.dispose();
        edgeMatFaint.dispose();
        edges.forEach((e) => e.line.geometry.dispose());
        renderer.dispose();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} aria-hidden="true">
      <canvas ref={ref} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
}