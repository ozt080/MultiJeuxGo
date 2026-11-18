const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const domArea = document.getElementById('domGameArea');
const hint = document.getElementById('controlsHint');
const victoryBox = document.getElementById('victoryBox');
let finished = false;

function useDomMode(text) {
    canvas.style.display = 'none';
    domArea.style.display = 'flex';
    hint.textContent = text;
}

async function finishGame(points, message) {
    if (finished) return;
    finished = true;
    try {
        const res = await fetch('api/score.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug: window.GAME_CONFIG.slug, points })
        });
        const data = await res.json();
        victoryBox.style.display = 'block';
        victoryBox.innerHTML = `
            <h2 style="margin-bottom:6px;">🎉 ${message}</h2>
            <p>Points gagnés : <strong>+${points} pts</strong> · Nouveau score total : <strong>${data.nouveau_total} pts</strong></p>
            <div style="margin-top:12px;display:flex;gap:10px;justify-content:center;">
                <button onclick="location.reload()" class="btn btn-primary">Rejouer</button>
                <a href="index.php" class="btn btn-ghost">Retour au lobby</a>
            </div>
        `;
    } catch (e) {
        victoryBox.style.display = 'block';
        victoryBox.textContent = message + ' (+' + points + ' pts)';
    }
}

function getMousePos(e) {
    const r = canvas.getBoundingClientRect();
    return {
        x: (e.clientX - r.left) * (canvas.width / r.width),
        y: (e.clientY - r.top) * (canvas.height / r.height)
    };
}

const games = {
    'mini-golf'() {
        hint.textContent = 'Clique sur la balle et tire en arrière pour viser le trou !';
        let ball = { x: 110, y: 220, vx: 0, vy: 0, r: 10 }, hole = { x: 650, y: 220, r: 16 };
        let wall = { x: 360, y: 110, w: 24, h: 220 }, shots = 0, drag = null;
        canvas.onmousedown = e => { const m = getMousePos(e); if (Math.hypot(m.x - ball.x, m.y - ball.y) < 35 && Math.hypot(ball.vx, ball.vy) < 0.2) drag = m; };
        canvas.onmousemove = e => { if (drag) drag = getMousePos(e); };
        canvas.onmouseup = () => {
            if (!drag) return;
            ball.vx = Math.max(-16, Math.min(16, (ball.x - drag.x) * 0.12));
            ball.vy = Math.max(-16, Math.min(16, (ball.y - drag.y) * 0.12));
            shots++; drag = null;
        };
        (function loop() {
            ctx.fillStyle = '#065f46'; ctx.fillRect(0, 0, 760, 440);
            ctx.fillStyle = '#064e3b'; ctx.fillRect(20, 20, 720, 400);
            ctx.fillStyle = '#d97706'; ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
            ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(hole.x, hole.y, hole.r, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#ef4444'; ctx.fillRect(hole.x, hole.y - 45, 3, 45); ctx.fillRect(hole.x + 3, hole.y - 45, 22, 14);
            ball.x += ball.vx; ball.y += ball.vy; ball.vx *= 0.985; ball.vy *= 0.985;
            if (ball.x < 30 || ball.x > 730) ball.vx *= -0.9;
            if (ball.y < 30 || ball.y > 410) ball.vy *= -0.9;
            if (ball.x + ball.r > wall.x && ball.x - ball.r < wall.x + wall.w && ball.y > wall.y && ball.y < wall.y + wall.h) ball.vx *= -0.9;
            if (drag) { ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ball.x, ball.y); ctx.lineTo(ball.x + (ball.x - drag.x), ball.y + (ball.y - drag.y)); ctx.stroke(); }
            ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2); ctx.fill();
            ctx.fillText('Coups : ' + shots, 35, 45);
            if (Math.hypot(ball.x - hole.x, ball.y - hole.y) < hole.r && Math.hypot(ball.vx, ball.vy) < 6) {
                finishGame(Math.max(30, 180 - shots * 25), `Trou en ${shots} coup(s) !`);
            }
            if (!finished) requestAnimationFrame(loop);
        })();
    },

    'foot-soccer'() {
        hint.textContent = 'Clique dans le but pour tirer ton penalty (5 tirs) !';
        let shots = 0, goals = 0, keeperX = 380, ball = { x: 380, y: 380, tx: 380, ty: 380, moving: false };
        canvas.onclick = e => {
            if (ball.moving || finished) return;
            const m = getMousePos(e);
            if (m.y < 210 && m.x > 160 && m.x < 600) {
                ball.tx = m.x; ball.ty = m.y; ball.moving = true;
                keeperX = 220 + Math.random() * 320;
            }
        };
        (function loop() {
            ctx.fillStyle = '#15803d'; ctx.fillRect(0, 0, 760, 440);
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 6; ctx.strokeRect(160, 50, 440, 160);
            ctx.fillStyle = '#fbbf24'; ctx.fillRect(keeperX - 35, 135, 70, 70);
            if (ball.moving) {
                ball.x += (ball.tx - ball.x) * 0.18; ball.y += (ball.ty - ball.y) * 0.18;
                if (Math.hypot(ball.x - ball.tx, ball.y - ball.ty) < 6) {
                    shots++;
                    if (Math.abs(ball.x - keeperX) > 48) goals++;
                    ball = { x: 380, y: 380, tx: 380, ty: 380, moving: false };
                    if (shots >= 5) finishGame(goals * 40 + 20, `Séance terminée : ${goals}/5 buts marqués !`);
                }
            }
            ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ball.x, ball.y, 14, 0, Math.PI * 2); ctx.fill();
            ctx.font = 'bold 18px sans-serif'; ctx.fillText(`Tirs : ${shots}/5 | Buts : ${goals}`, 25, 35);
            if (!finished) requestAnimationFrame(loop);
        })();
    },

    'basket'() {
        hint.textContent = 'Clique et glisse vers le panier pour lancer le ballon (5 tirs) !';
        let ball = { x: 150, y: 350, vx: 0, vy: 0, fly: false }, hoop = { x: 600, y: 170, dir: 2 }, score = 0, tries = 0, drag = null;
        canvas.onmousedown = e => { if (!ball.fly) drag = getMousePos(e); };
        canvas.onmouseup = e => {
            if (!drag || ball.fly) return;
            const m = getMousePos(e);
            ball.vx = (m.x - drag.x) * 0.11; ball.vy = (m.y - drag.y) * 0.11;
            ball.fly = true; tries++; drag = null;
        };
        (function loop() {
            ctx.fillStyle = '#1e1b4b'; ctx.fillRect(0, 0, 760, 440);
            hoop.y += hoop.dir; if (hoop.y < 100 || hoop.y > 260) hoop.dir *= -1;
            ctx.fillStyle = '#f97316'; ctx.fillRect(hoop.x - 35, hoop.y, 70, 8);
            ctx.fillStyle = '#fff'; ctx.fillRect(hoop.x + 32, hoop.y - 50, 8, 70);
            if (ball.fly) {
                ball.vy += 0.35; ball.x += ball.vx; ball.y += ball.vy;
                if (Math.hypot(ball.x - hoop.x, ball.y - hoop.y) < 32 && ball.vy > 0) { score++; ball.fly = false; ball.x = 150; ball.y = 350; }
                if (ball.y > 450 || ball.x > 770) { ball.fly = false; ball.x = 150; ball.y = 350; }
                if (!ball.fly && tries >= 5) finishGame(score * 45 + 15, `Match terminé : ${score}/5 paniers !`);
            }
            ctx.fillStyle = '#ea580c'; ctx.beginPath(); ctx.arc(ball.x, ball.y, 16, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.font = 'bold 18px sans-serif'; ctx.fillText(`Tirs : ${tries}/5 | Paniers : ${score}`, 25, 35);
            if (!finished) requestAnimationFrame(loop);
        })();
    },

    'bowling'() {
        hint.textContent = 'Déplace la souris pour placer ta boule et clique pour lancer (2 lancers) !';
        let bx = 380, by = 390, rolling = false, rolls = 0;
        let pins = [];
        [[380,70],[360,95],[400,95],[340,120],[380,120],[420,120],[320,145],[360,145],[400,145],[440,145]].forEach(p => pins.push({x:p[0],y:p[1],up:true}));
        canvas.onmousemove = e => { if (!rolling) bx = Math.max(250, Math.min(510, getMousePos(e).x)); };
        canvas.onclick = () => { if (!rolling && !finished) { rolling = true; rolls++; } };
        (function loop() {
            ctx.fillStyle = '#78350f'; ctx.fillRect(220, 0, 320, 440);
            pins.forEach(p => {
                if (p.up && rolling && Math.hypot(bx - p.x, by - p.y) < 34) p.up = false;
                if (p.up) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p.x, p.y, 10, 0, Math.PI * 2); ctx.fill(); }
            });
            if (rolling) {
                by -= 9;
                if (by < 40) {
                    rolling = false; by = 390;
                    const down = pins.filter(p => !p.up).length;
                    if (down === 10 || rolls >= 2) finishGame(down * 18 + (down === 10 && rolls === 1 ? 50 : 0), `${down}/10 quilles tombées !`);
                }
            }
            ctx.fillStyle = '#2563eb'; ctx.beginPath(); ctx.arc(bx, by, 18, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif'; ctx.fillText(`Lancer : ${rolls}/2`, 20, 35);
            if (!finished) requestAnimationFrame(loop);
        })();
    },

    'ping-pong'() {
        hint.textContent = 'Déplace la souris verticalement pour contrôler ta raquette (Premier à 5) !';
        let py = 180, ay = 180, b = { x: 380, y: 220, vx: 6, vy: 4 }, ps = 0, as = 0;
        canvas.onmousemove = e => { py = getMousePos(e).y - 45; };
        (function loop() {
            ctx.fillStyle = '#0e7490'; ctx.fillRect(0, 0, 760, 440);
            ctx.fillStyle = '#fff'; ctx.fillRect(378, 0, 4, 440);
            ay += (b.y - (ay + 45)) * 0.085;
            b.x += b.vx; b.y += b.vy;
            if (b.y < 10 || b.y > 430) b.vy *= -1;
            if (b.x < 35 && b.y > py && b.y < py + 90) b.vx = Math.abs(b.vx) * 1.04;
            if (b.x > 725 && b.y > ay && b.y < ay + 90) b.vx = -Math.abs(b.vx) * 1.04;
            if (b.x < 0) { as++; b = { x: 380, y: 220, vx: 6, vy: 4 }; }
            if (b.x > 760) { ps++; b = { x: 380, y: 220, vx: -6, vy: 4 }; }
            ctx.fillRect(20, py, 14, 90); ctx.fillRect(726, ay, 14, 90);
            ctx.beginPath(); ctx.arc(b.x, b.y, 10, 0, Math.PI * 2); ctx.fill();
            ctx.font = 'bold 26px sans-serif'; ctx.fillText(`${ps}   -   ${as}`, 335, 45);
            if (ps >= 5 || as >= 5) finishGame(ps >= 5 ? 150 : 30, ps >= 5 ? `Victoire ${ps}-${as} au Ping-Pong !` : `Défaite ${ps}-${as}`);
            if (!finished) requestAnimationFrame(loop);
        })();
    },

    'badminton'() {
        hint.textContent = 'Déplace ta raquette à la souris et clique pour SMASHER le volant (Premier à 5) !';
        let px = 160, py = 340, ax = 580, s = { x: 200, y: 150, vx: 4, vy: 0 }, ps = 0, as = 0;
        canvas.onmousemove = e => { const m = getMousePos(e); px = Math.min(350, Math.max(30, m.x)); py = Math.max(180, m.y); };
        canvas.onclick = () => { if (Math.hypot(s.x - px, s.y - py) < 65) { s.vx = 9.5; s.vy = -6; } };
        (function loop() {
            ctx.fillStyle = '#115e59'; ctx.fillRect(0, 0, 760, 440);
            ctx.fillStyle = '#fff'; ctx.fillRect(378, 260, 4, 180);
            ax += (s.x - ax) * 0.06; ax = Math.max(410, Math.min(720, ax));
            s.vy += 0.22; s.x += s.vx; s.y += s.vy;
            if (Math.hypot(s.x - px, s.y - py) < 42 && s.vx < 0) { s.vx = 6.5; s.vy = -8.5; }
            if (Math.hypot(s.x - ax, s.y - 340) < 45 && s.vx > 0) { s.vx = -6.2; s.vy = -8.2; }
            if (s.y > 430) { if (s.x > 380) ps++; else as++; s = { x: 220, y: 140, vx: 4, vy: 0 }; }
            ctx.fillStyle = '#38bdf8'; ctx.beginPath(); ctx.arc(px, py, 24, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#f43f5e'; ctx.beginPath(); ctx.arc(ax, 340, 24, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(s.x, s.y, 9, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.font = 'bold 24px sans-serif'; ctx.fillText(`${ps} - ${as}`, 350, 42);
            if (ps >= 5 || as >= 5) finishGame(ps >= 5 ? 160 : 35, ps >= 5 ? `Match gagné ${ps}-${as} !` : `Match perdu ${ps}-${as}`);
            if (!finished) requestAnimationFrame(loop);
        })();
    },

    'billard'() {
        hint.textContent = 'Tire en arrière depuis la bille blanche pour empocher les 5 billes !';
        let cue = { x: 180, y: 220, vx: 0, vy: 0 }, drag = null, shots = 0;
        let balls = [{x:500,y:220,c:'#ef4444'},{x:530,y:200,c:'#eab308'},{x:530,y:240,c:'#3b82f6'},{x:560,y:180,c:'#a855f7'},{x:560,y:260,c:'#f97316'}].map(b=>({...b,vx:0,vy:0,in:false}));
        const pockets = [[25,25],[380,20],[735,25],[25,415],[380,420],[735,415]];
        canvas.onmousedown = e => { const m = getMousePos(e); if (Math.hypot(m.x - cue.x, m.y - cue.y) < 35) drag = m; };
        canvas.onmousemove = e => { if (drag) drag = getMousePos(e); };
        canvas.onmouseup = () => { if (drag) { cue.vx = (cue.x - drag.x) * 0.14; cue.vy = (cue.y - drag.y) * 0.14; shots++; drag = null; } };
        (function loop() {
            ctx.fillStyle = '#047857'; ctx.fillRect(0, 0, 760, 440);
            pockets.forEach(p => { ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(p[0], p[1], 18, 0, Math.PI * 2); ctx.fill(); });
            const all = [cue, ...balls.filter(b => !b.in)];
            all.forEach(b => {
                b.x += b.vx; b.y += b.vy; b.vx *= 0.982; b.vy *= 0.982;
                if (b.x < 25 || b.x > 735) b.vx *= -0.9;
                if (b.y < 25 || b.y > 415) b.vy *= -0.9;
            });
            for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
                const a = all[i], b = all[j], d = Math.hypot(b.x - a.x, b.y - a.y);
                if (d < 24 && d > 0) { const nx = (b.x - a.x) / d, ny = (b.y - a.y) / d; a.vx -= nx * 3; a.vy -= ny * 3; b.vx += nx * 3; b.vy += ny * 3; }
            }
            balls.forEach(b => {
                if (!b.in && pockets.some(p => Math.hypot(b.x - p[0], b.y - p[1]) < 22)) b.in = true;
                if (!b.in) { ctx.fillStyle = b.c; ctx.beginPath(); ctx.arc(b.x, b.y, 12, 0, Math.PI * 2); ctx.fill(); }
            });
            if (drag) { ctx.strokeStyle = '#fde047'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cue.x, cue.y); ctx.lineTo(cue.x + (cue.x - drag.x), cue.y + (cue.y - drag.y)); ctx.stroke(); }
            ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cue.x, cue.y, 12, 0, Math.PI * 2); ctx.fill();
            if (balls.every(b => b.in)) finishGame(Math.max(40, 220 - shots * 15), `Table nettoyée en ${shots} coups !`);
            if (!finished) requestAnimationFrame(loop);
        })();
    },

    'pinball'() {
        hint.textContent = 'Flèches Gauche/Droite (ou clic gauche/droit) pour actionner les flippers !';
        let ball = { x: 420, y: 80, vx: 3, vy: 2 }, score = 0, leftUp = false, rightUp = false;
        const bumpers = [[280,140],[480,140],[380,210],[240,260],[520,260]];
        window.onkeydown = e => { if (e.key === 'ArrowLeft') leftUp = true; if (e.key === 'ArrowRight') rightUp = true; };
        window.onkeyup = e => { if (e.key === 'ArrowLeft') leftUp = false; if (e.key === 'ArrowRight') rightUp = false; };
        canvas.onmousedown = () => { leftUp = true; rightUp = true; };
        canvas.onmouseup = () => { leftUp = false; rightUp = false; };
        (function loop() {
            ctx.fillStyle = '#1e1b4b'; ctx.fillRect(0, 0, 760, 440);
            ball.vy += 0.25; ball.x += ball.vx; ball.y += ball.vy;
            if (ball.x < 160 || ball.x > 600) ball.vx *= -0.95;
            if (ball.y < 20) ball.vy *= -0.9;
            bumpers.forEach(bp => {
                ctx.fillStyle = '#ec4899'; ctx.beginPath(); ctx.arc(bp[0], bp[1], 22, 0, Math.PI * 2); ctx.fill();
                const d = Math.hypot(ball.x - bp[0], ball.y - bp[1]);
                if (d < 34) { ball.vx = ((ball.x - bp[0]) / d) * 8; ball.vy = ((ball.y - bp[1]) / d) * 8; score += 25; }
            });
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(250, leftUp ? 360 : 385, 100, 14);
            ctx.fillRect(410, rightUp ? 360 : 385, 100, 14);
            if (ball.y > 365 && ball.y < 400 && ((ball.x > 245 && ball.x < 355 && leftUp) || (ball.x > 405 && ball.x < 515 && rightUp))) {
                ball.vy = -12; ball.vx += (Math.random() - 0.5) * 6;
            }
            ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ball.x, ball.y, 11, 0, Math.PI * 2); ctx.fill();
            ctx.font = 'bold 20px sans-serif'; ctx.fillText(`Score : ${score}`, 25, 38);
            if (ball.y > 445) finishGame(Math.max(20, Math.min(300, score)), `Partie de Pinball terminée : ${score} pts !`);
            if (!finished) requestAnimationFrame(loop);
        })();
    },

    'course-voiture'() {
        hint.textContent = 'Flèches Gauche / Droite pour éviter les voitures !';
        let lane = 1, cars = [], dist = 0, speed = 6;
        const lanes = [270, 380, 490];
        window.onkeydown = e => {
            if (e.key === 'ArrowLeft' && lane > 0) lane--;
            if (e.key === 'ArrowRight' && lane < 2) lane++;
        };
        (function loop() {
            ctx.fillStyle = '#1f2937'; ctx.fillRect(210, 0, 340, 440);
            dist++; if (dist % 42 === 0) { cars.push({ lane: Math.floor(Math.random() * 3), y: -60 }); speed += 0.15; }
            ctx.fillStyle = '#38bdf8'; ctx.fillRect(lanes[lane] - 22, 340, 44, 70);
            cars.forEach(c => {
                c.y += speed;
                ctx.fillStyle = '#ef4444'; ctx.fillRect(lanes[c.lane] - 22, c.y, 44, 70);
                if (c.lane === lane && c.y + 65 > 340 && c.y < 405) {
                    finishGame(Math.min(250, Math.floor(dist / 6)), `Crash après ${Math.floor(dist / 10)} m !`);
                }
            });
            ctx.fillStyle = '#fff'; ctx.font = 'bold 18px sans-serif'; ctx.fillText(`Distance : ${Math.floor(dist / 10)} m`, 25, 35);
            if (!finished) requestAnimationFrame(loop);
        })();
    },

    'snake-neon'() {
        hint.textContent = 'Flèches directionnelles pour diriger le serpent !';
        let snake = [{x:10,y:10}], dir = {x:1,y:0}, food = {x:15,y:10}, pts = 0, tick = 0;
        window.onkeydown = e => {
            if (e.key === 'ArrowUp' && dir.y === 0) dir = {x:0,y:-1};
            if (e.key === 'ArrowDown' && dir.y === 0) dir = {x:0,y:1};
            if (e.key === 'ArrowLeft' && dir.x === 0) dir = {x:-1,y:0};
            if (e.key === 'ArrowRight' && dir.x === 0) dir = {x:1,y:0};
        };
        (function loop() {
            tick++;
            if (tick % 6 === 0) {
                const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
                if (head.x < 0 || head.x >= 38 || head.y < 0 || head.y >= 22 || snake.some(s => s.x === head.x && s.y === head.y)) {
                    finishGame(pts + 10, `Snake terminé : ${pts} pts !`); return;
                }
                snake.unshift(head);
                if (head.x === food.x && head.y === food.y) { pts += 20; food = { x: Math.floor(Math.random()*38), y: Math.floor(Math.random()*22) }; }
                else snake.pop();
            }
            ctx.fillStyle = '#090d16'; ctx.fillRect(0, 0, 760, 440);
            ctx.fillStyle = '#f43f5e'; ctx.fillRect(food.x * 20, food.y * 20, 18, 18);
            ctx.fillStyle = '#22c55e'; snake.forEach(s => ctx.fillRect(s.x * 20, s.y * 20, 18, 18));
            if (!finished) requestAnimationFrame(loop);
        })();
    },

    'casse-briques'() {
        hint.textContent = 'Déplace la souris pour casser toutes les briques !';
        let px = 330, b = { x: 380, y: 300, vx: 5, vy: -5 }, bricks = [];
        for (let r = 0; r < 4; r++) for (let c = 0; c < 9; c++) bricks.push({ x: 45 + c * 76, y: 45 + r * 30, alive: true });
        canvas.onmousemove = e => { px = getMousePos(e).x - 55; };
        (function loop() {
            ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, 760, 440);
            b.x += b.vx; b.y += b.vy;
            if (b.x < 10 || b.x > 750) b.vx *= -1;
            if (b.y < 10) b.vy *= -1;
            if (b.y > 395 && b.x > px && b.x < px + 110) b.vy = -Math.abs(b.vy);
            bricks.forEach(br => {
                if (!br.alive) return;
                ctx.fillStyle = '#a855f7'; ctx.fillRect(br.x, br.y, 68, 20);
                if (b.x > br.x && b.x < br.x + 68 && b.y > br.y && b.y < br.y + 20) { br.alive = false; b.vy *= -1; }
            });
            ctx.fillStyle = '#38bdf8'; ctx.fillRect(px, 405, 110, 14);
            ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(b.x, b.y, 9, 0, Math.PI * 2); ctx.fill();
            const broken = bricks.filter(x => !x.alive).length;
            if (broken === bricks.length || b.y > 445) finishGame(broken * 6 + 15, `${broken}/${bricks.length} briques cassées !`);
            if (!finished) requestAnimationFrame(loop);
        })();
    },

    'uno'() {
        useDomMode('Clique sur une carte de même couleur ou même valeur que la carte centrale !');
        const cols = ['#ef4444', '#3b82f6', '#22c55e', '#eab308'];
        const randCard = () => ({ c: cols[Math.floor(Math.random() * 4)], v: Math.floor(Math.random() * 9) + 1 });
        let top = randCard(), hand = Array.from({ length: 6 }, randCard), botCount = 6;
        function render() {
            domArea.innerHTML = `
                <p>Cartes adverses restantes : <strong>${botCount}</strong></p>
                <div class="uno-card" style="background:${top.c};transform:scale(1.15);">${top.v}</div>
                <div class="card-hand">${hand.map((c, i) => `<div class="uno-card" data-i="${i}" style="background:${c.c};">${c.v}</div>`).join('')}</div>
                <button id="drawUno" class="btn btn-ghost">Piocher une carte</button>
            `;
            domArea.querySelectorAll('.uno-card[data-i]').forEach(el => el.onclick = () => {
                const c = hand[el.dataset.i];
                if (c.c === top.c || c.v === top.v) {
                    top = c; hand.splice(el.dataset.i, 1);
                    if (hand.length === 0) return finishGame(180, 'UNO ! Tu as vidé ta main en premier !');
                    botCount = Math.max(0, botCount + (Math.random() > 0.45 ? -1 : 1));
                    if (botCount === 0) return finishGame(30, 'L\'adversaire a fini avant toi !');
                    render();
                }
            });
            document.getElementById('drawUno').onclick = () => { hand.push(randCard()); render(); };
        }
        render();
    },

    'ludo'() {
        useDomMode('Lance le dé pour amener ton pion bleu à la case 24 avant le pion rouge !');
        let pPos = 0, bPos = 0, lastDice = '-';
        function render() {
            let cells = '';
            for (let i = 0; i <= 24; i++) {
                let mark = i === pPos && i === bPos ? '🔵🔴' : i === pPos ? '🔵' : i === bPos ? '🔴' : i === 24 ? '🏁' : i;
                cells += `<div style="width:42px;height:42px;border-radius:10px;background:#1b223c;display:grid;place-items:center;font-weight:700;">${mark}</div>`;
            }
            domArea.innerHTML = `
                <div style="display:flex;flex-wrap:wrap;gap:6px;max-width:560px;justify-content:center;">${cells}</div>
                <p>Dernier dé : <strong>${lastDice}</strong> · Toi : ${pPos}/24 · IA : ${bPos}/24</p>
                <button id="rollLudo" class="btn btn-primary">🎲 Lancer le dé</button>
            `;
            document.getElementById('rollLudo').onclick = () => {
                const d = Math.floor(Math.random() * 6) + 1; lastDice = d;
                pPos = Math.min(24, pPos + d);
                if (pPos === bPos && pPos < 24) bPos = 0;
                if (pPos >= 24) return finishGame(170, 'Victoire au Ludo Royal !');
                bPos = Math.min(24, bPos + Math.floor(Math.random() * 6) + 1);
                if (bPos >= 24) return finishGame(35, 'L\'adversaire rouge gagne la course !');
                render();
            };
        }
        render();
    },

    'puissance-4'() {
        useDomMode('Clique sur une colonne pour déposer ton jeton rouge !');
        const grid = Array.from({ length: 6 }, () => Array(7).fill(0));
        function win(p) {
            for (let r = 0; r < 6; r++) for (let c = 0; c < 7; c++) {
                if (c < 4 && [0,1,2,3].every(k => grid[r][c+k] === p)) return true;
                if (r < 3 && [0,1,2,3].every(k => grid[r+k][c] === p)) return true;
                if (r < 3 && c < 4 && [0,1,2,3].every(k => grid[r+k][c+k] === p)) return true;
                if (r > 2 && c < 4 && [0,1,2,3].every(k => grid[r-k][c+k] === p)) return true;
            }
            return false;
        }
        function drop(col, p) { for (let r = 5; r >= 0; r--) if (!grid[r][col]) { grid[r][col] = p; return true; } return false; }
        function render() {
            domArea.innerHTML = `<div class="c4-grid">${grid.flatMap((row, r) => row.map((v, c) =>
                `<div class="c4-cell" data-c="${c}" style="background:${v===1?'#ef4444':v===2?'#fbbf24':'#0b0e1a'}"></div>`)).join('')}</div>`;
            domArea.querySelectorAll('.c4-cell').forEach(el => el.onclick = () => {
                if (finished || !drop(+el.dataset.c, 1)) return;
                if (win(1)) { render(); return finishGame(160, 'Puissance 4 ! Victoire !'); }
                const cols = [0,1,2,3,4,5,6].filter(c => !grid[0][c]);
                if (cols.length) drop(cols[Math.floor(Math.random() * cols.length)], 2);
                render();
                if (win(2)) finishGame(30, 'L\'IA aligne 4 jetons !');
            });
        }
        render();
    },

    'morpion'() {
        useDomMode('Aligne 3 symboles X pour battre l\'IA !');
        const b = Array(9).fill('');
        const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
        const check = s => lines.some(l => l.every(i => b[i] === s));
        function render() {
            domArea.innerHTML = `<div class="ttt-grid">${b.map((v, i) => `<div class="ttt-cell" data-i="${i}" style="color:${v==='X'?'#38bdf8':'#f43f5e'}">${v}</div>`).join('')}</div>`;
            domArea.querySelectorAll('.ttt-cell').forEach(el => el.onclick = () => {
                const i = +el.dataset.i; if (b[i] || finished) return;
                b[i] = 'X';
                if (check('X')) { render(); return finishGame(110, 'Victoire au Morpion !'); }
                const free = b.map((v, idx) => v === '' ? idx : -1).filter(x => x >= 0);
                if (!free.length) { render(); return finishGame(50, 'Match nul !'); }
                b[free[Math.floor(Math.random() * free.length)]] = 'O';
                render();
                if (check('O')) finishGame(20, 'Défaite au Morpion !');
            });
        }
        render();
    },

    'pfc'() {
        useDomMode('Premier à 3 manches gagnantes !');
        let ps = 0, as = 0, msg = 'Choisis ton coup :';
        const coups = ['Pierre', 'Feuille', 'Ciseaux'];
        function render() {
            domArea.innerHTML = `
                <h2>${ps} - ${as}</h2><p>${msg}</p>
                <div style="display:flex;gap:12px;">${coups.map(c => `<button class="btn btn-primary" data-c="${c}">${c}</button>`).join('')}</div>
            `;
            domArea.querySelectorAll('button').forEach(btn => btn.onclick = () => {
                const p = btn.dataset.c, a = coups[Math.floor(Math.random() * 3)];
                if (p === a) msg = `Égalité (${p} vs ${a})`;
                else if ((p==='Pierre'&&a==='Ciseaux')||(p==='Feuille'&&a==='Pierre')||(p==='Ciseaux'&&a==='Feuille')) { ps++; msg = `Gagné ! ${p} bat ${a}`; }
                else { as++; msg = `Perdu ! ${a} bat ${p}`; }
                render();
                if (ps >= 3 || as >= 3) finishGame(ps >= 3 ? 120 : 25, ps >= 3 ? 'Tu remportes le duel !' : 'L\'IA remporte le duel !');
            });
        }
        render();
    },

    'plus-ou-moins'() {
        useDomMode('Trouve le nombre mystère compris entre 1 et 100 !');
        const target = Math.floor(Math.random() * 100) + 1;
        let tries = 0;
        domArea.innerHTML = `
            <p id="pomMsg">Entre une proposition :</p>
            <div style="display:flex;gap:10px;">
                <input id="pomIn" class="form-control" type="number" min="1" max="100" style="width:140px;">
                <button id="pomBtn" class="btn btn-primary">Tester</button>
            </div>
        `;
        document.getElementById('pomBtn').onclick = () => {
            const v = +document.getElementById('pomIn').value; if (!v) return;
            tries++;
            if (v < target) document.getElementById('pomMsg').textContent = `C'est PLUS ! (Essai ${tries})`;
            else if (v > target) document.getElementById('pomMsg').textContent = `C'est MOINS ! (Essai ${tries})`;
            else finishGame(Math.max(20, 140 - tries * 12), `Trouvé (${target}) en ${tries} essais !`);
        };
    },

    'quiz-geek'() {
        useDomMode('Réponds aux 5 questions tech & gaming !');
        const qs = [
            { q: 'Quel port réseau utilise HTTP par défaut ?', a: ['80', '443', '22'], ok: 0 },
            { q: 'Quelle extension PHP permet de connecter MySQL via PDO ?', a: ['pdo_mysql', 'gd', 'mbstring'], ok: 0 },
            { q: 'Quelle commande Git envoie les commits vers GitHub ?', a: ['git pull', 'git push', 'git init'], ok: 1 },
            { q: 'Dans Minecraft, quel minerai permet d\'activer un portail du Nether ?', a: ['Obsidienne', 'Émeraude', 'Redstone'], ok: 0 },
            { q: 'Quelle requête SQL récupère des lignes ?', a: ['UPDATE', 'SELECT', 'ALTER'], ok: 1 }
        ];
        let idx = 0, good = 0;
        function render() {
            if (idx >= qs.length) return finishGame(good * 35 + 15, `Quiz terminé : ${good}/${qs.length} bonnes réponses !`);
            const cur = qs[idx];
            domArea.innerHTML = `
                <p>Question ${idx + 1}/${qs.length}</p><h3>${cur.q}</h3>
                <div style="display:flex;flex-direction:column;gap:10px;width:320px;">
                    ${cur.a.map((ans, i) => `<button class="btn btn-ghost" data-i="${i}">${ans}</button>`).join('')}
                </div>
            `;
            domArea.querySelectorAll('button').forEach(b => b.onclick = () => { if (+b.dataset.i === cur.ok) good++; idx++; render(); });
        }
        render();
    }
};

if (games[window.GAME_CONFIG.slug]) games[window.GAME_CONFIG.slug]();