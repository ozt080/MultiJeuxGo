const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const domArea = document.getElementById('domGameArea');
const hint = document.getElementById('controlsHint');
const victoryBox = document.getElementById('victoryBox');
const waitingRoom = document.getElementById('waitingRoom');
const playersStatus = document.getElementById('playersStatus');
const SALON = window.GAME_CONFIG.salon;

let finished = false;
let salonState = null;
let soundEnabled = true;

// Synthétiseur audio Web Audio API (effets sonores façon Plato sans fichiers externes)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
    if (!soundEnabled) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'hit') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.08);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now); osc.stop(now + 0.08);
    } else if (type === 'pop') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.exponentialRampToValueAtTime(680, now + 0.07);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.07);
        osc.start(now); osc.stop(now + 0.07);
    } else if (type === 'score') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523, now);
        osc.frequency.setValueAtTime(659, now + 0.08);
        osc.frequency.setValueAtTime(784, now + 0.16);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now); osc.stop(now + 0.3);
    } else if (type === 'win') {
        [523, 659, 784, 1046].forEach((freq, idx) => {
            const o = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            o.type = 'triangle';
            o.frequency.setValueAtTime(freq, now + idx * 0.1);
            g.gain.setValueAtTime(0.2, now + idx * 0.1);
            g.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.25);
            o.connect(g); g.connect(audioCtx.destination);
            o.start(now + idx * 0.1); o.stop(now + idx * 0.1 + 0.25);
        });
    } else if (type === 'lose') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(110, now + 0.35);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now); osc.stop(now + 0.35);
    }
}

window.toggleSound = function () {
    soundEnabled = !soundEnabled;
    const btn = document.getElementById('soundToggleBtn');
    if (btn) btn.textContent = soundEnabled ? '🔊 Son' : '🔇 Muet';
};

function useDomMode(text) {
    canvas.style.display = 'none';
    domArea.style.display = 'flex';
    hint.textContent = text;
}

async function syncSalon(payload) {
    await fetch('api/salon.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'jouer', code: SALON, ...payload })
    });
}

async function finishGame(points, message) {
    if (finished) return;
    finished = true;
    playSound(points >= 100 ? 'win' : 'lose');

    if (SALON && salonState) {
        const e = salonState.etat_jeu || {};
        if (salonState.role === 'hote') e.hote_fini = true;
        else e.invite_fini = true;
        const bothDone = e.hote_fini && e.invite_fini;
        const sh = salonState.role === 'hote' ? points : salonState.score_hote;
        const si = salonState.role === 'invite' ? points : salonState.score_invite;
        const ptsH = sh >= si ? 180 : 60;
        const ptsI = si >= sh ? 180 : 60;

        await syncSalon({
            score: points,
            etat_jeu: e,
            termine: bothDone,
            pts_hote: ptsH,
            pts_invite: ptsI
        });

        victoryBox.style.display = 'block';
        victoryBox.innerHTML = bothDone
            ? `<h2>🏆 Duel terminé !</h2><p>👑 ${salonState.hote_pseudo} : <strong>${sh} pts</strong> vs 🎮 ${salonState.invite_pseudo} : <strong>${si} pts</strong></p><a href="index.php" class="btn btn-primary" style="margin-top:10px;">Retour au lobby</a>`
            : `<h2>✅ ${message} (${points} pts)</h2><p>En attente que ton ami termine sa manche pour départager le duel...</p>`;
        return;
    }

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

function drawAimDots(x1, y1, vx, vy, steps = 10, color = '#fbbf24') {
    for (let i = 1; i <= steps; i++) {
        const px = x1 + vx * i * 2.4;
        const py = y1 + vy * i * 2.4;
        ctx.fillStyle = color;
        ctx.globalAlpha = 1 - i / (steps + 1);
        ctx.beginPath();
        ctx.arc(px, py, Math.max(2, 5 - i * 0.3), 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

const games = {
    // 1. MINI-GOLF PLATO (3 parcours avec sable, eau, bumpers et trajectoire pointillée)
    'mini-golf'() {
        hint.textContent = 'Clique sur la balle et tire en arrière pour viser (3 parcours) !';
        const courses = [
            {
                par: 2, start: { x: 110, y: 230 }, hole: { x: 640, y: 230 },
                walls: [{ x: 350, y: 90, w: 26, h: 210 }],
                sand: [{ x: 470, y: 170, r: 44 }], water: [], bumpers: []
            },
            {
                par: 3, start: { x: 100, y: 360 }, hole: { x: 650, y: 110 },
                walls: [{ x: 260, y: 180, w: 24, h: 250 }, { x: 470, y: 30, w: 24, h: 240 }],
                sand: [], water: [{ x: 370, y: 230, r: 48 }], bumpers: [{ x: 560, y: 320, r: 22 }]
            },
            {
                par: 3, start: { x: 95, y: 230 }, hole: { x: 665, y: 230 },
                walls: [{ x: 370, y: 30, w: 22, h: 145 }, { x: 370, y: 285, w: 22, h: 145 }],
                sand: [{ x: 240, y: 130, r: 38 }, { x: 240, y: 330, r: 38 }],
                water: [{ x: 510, y: 230, r: 42 }],
                bumpers: [{ x: 381, y: 230, r: 24 }]
            }
        ];
        let lvl = 0, totalShots = 0, holeShots = 0, drag = null;
        let ball = { x: 110, y: 230, vx: 0, vy: 0, r: 10 };

        function loadCourse(i) {
            const c = courses[i];
            ball = { x: c.start.x, y: c.start.y, vx: 0, vy: 0, r: 10 };
            holeShots = 0; drag = null;
        }
        loadCourse(0);

        canvas.onmousedown = e => {
            const m = getMousePos(e);
            if (Math.hypot(m.x - ball.x, m.y - ball.y) < 38 && Math.hypot(ball.vx, ball.vy) < 0.25) drag = m;
        };
        canvas.onmousemove = e => { if (drag) drag = getMousePos(e); };
        canvas.onmouseup = () => {
            if (!drag) return;
            const vx = Math.max(-15, Math.min(15, (ball.x - drag.x) * 0.11));
            const vy = Math.max(-15, Math.min(15, (ball.y - drag.y) * 0.11));
            if (Math.hypot(vx, vy) > 0.6) {
                ball.vx = vx; ball.vy = vy;
                holeShots++; totalShots++;
                playSound('hit');
            }
            drag = null;
        };

        (function loop() {
            const c = courses[lvl];
            ctx.fillStyle = '#064e3b'; ctx.fillRect(0, 0, 760, 460);
            ctx.fillStyle = '#059669'; ctx.fillRect(24, 24, 712, 412);
            ctx.strokeStyle = '#a7f3d0'; ctx.lineWidth = 4; ctx.strokeRect(24, 24, 712, 412);

            c.sand.forEach(s => { ctx.fillStyle = '#fde68a'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill(); });
            c.water.forEach(w => { ctx.fillStyle = '#0284c7'; ctx.beginPath(); ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2); ctx.fill(); });
            c.walls.forEach(w => { ctx.fillStyle = '#b45309'; ctx.fillRect(w.x, w.y, w.w, w.h); });
            c.bumpers.forEach(bp => {
                ctx.fillStyle = '#ec4899'; ctx.beginPath(); ctx.arc(bp.x, bp.y, bp.r, 0, Math.PI * 2); ctx.fill();
                const d = Math.hypot(ball.x - bp.x, ball.y - bp.y);
                if (d < ball.r + bp.r && d > 0) {
                    ball.vx = ((ball.x - bp.x) / d) * 9;
                    ball.vy = ((ball.y - bp.y) / d) * 9;
                    playSound('pop');
                }
            });

            // Trou + drapeau
            ctx.fillStyle = '#090d16'; ctx.beginPath(); ctx.arc(c.hole.x, c.hole.y, 16, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.fillRect(c.hole.x, c.hole.y - 44, 3, 44);
            ctx.fillStyle = '#ef4444'; ctx.fillRect(c.hole.x + 3, c.hole.y - 44, 22, 14);

            // Physique balle
            let friction = 0.985;
            if (c.sand.some(s => Math.hypot(ball.x - s.x, ball.y - s.y) < s.r)) friction = 0.92;
            ball.x += ball.vx; ball.y += ball.vy;
            ball.vx *= friction; ball.vy *= friction;
            if (Math.hypot(ball.vx, ball.vy) < 0.12) { ball.vx = 0; ball.vy = 0; }

            if (ball.x < 34) { ball.x = 34; ball.vx *= -0.88; playSound('hit'); }
            if (ball.x > 726) { ball.x = 726; ball.vx *= -0.88; playSound('hit'); }
            if (ball.y < 34) { ball.y = 34; ball.vy *= -0.88; playSound('hit'); }
            if (ball.y > 426) { ball.y = 426; ball.vy *= -0.88; playSound('hit'); }

            c.walls.forEach(w => {
                if (ball.x + ball.r > w.x && ball.x - ball.r < w.x + w.w && ball.y + ball.r > w.y && ball.y - ball.r < w.y + w.h) {
                    const overlapLeft = (ball.x + ball.r) - w.x;
                    const overlapRight = (w.x + w.w) - (ball.x - ball.r);
                    const overlapTop = (ball.y + ball.r) - w.y;
                    const overlapBottom = (w.y + w.h) - (ball.y - ball.r);
                    const minO = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
                    if (minO === overlapLeft || minO === overlapRight) ball.vx *= -0.88;
                    else ball.vy *= -0.88;
                    playSound('hit');
                }
            });

            if (c.water.some(w => Math.hypot(ball.x - w.x, ball.y - w.y) < w.r - 4)) {
                playSound('lose');
                ball.x = c.start.x; ball.y = c.start.y; ball.vx = 0; ball.vy = 0;
            }

            if (drag) {
                const vx = Math.max(-15, Math.min(15, (ball.x - drag.x) * 0.11));
                const vy = Math.max(-15, Math.min(15, (ball.y - drag.y) * 0.11));
                drawAimDots(ball.x, ball.y, vx, vy, 9, '#fbbf24');
            }

            ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif';
            ctx.fillText(`Parcours ${lvl + 1}/3 · Coups : ${holeShots} (Total : ${totalShots})`, 38, 48);

            if (Math.hypot(ball.x - c.hole.x, ball.y - c.hole.y) < 16 && Math.hypot(ball.vx, ball.vy) < 7.5) {
                playSound('score');
                lvl++;
                if (lvl >= courses.length) {
                    finishGame(Math.max(40, 240 - totalShots * 18), `3 parcours terminés en ${totalShots} coups !`);
                } else {
                    loadCourse(lvl);
                }
            }
            if (!finished) requestAnimationFrame(loop);
        })();
    },

    // 2. TABLE SOCCER PLATO (Palets à propulser, collisions physiques, Solo + PvP)
    'foot-soccer'() {
        hint.textContent = 'Clique sur un de tes palets et tire en arrière pour propulser le ballon (Premier à 3 buts) !';
        const isPvp = Boolean(SALON && salonState);
        let state = {
            ball: { x: 380, y: 230, vx: 0, vy: 0, r: 14 },
            hote: [{ x: 180, y: 130, vx: 0, vy: 0, r: 22 }, { x: 130, y: 230, vx: 0, vy: 0, r: 22 }, { x: 180, y: 330, vx: 0, vy: 0, r: 22 }],
            invite: [{ x: 580, y: 130, vx: 0, vy: 0, r: 22 }, { x: 630, y: 230, vx: 0, vy: 0, r: 22 }, { x: 580, y: 330, vx: 0, vy: 0, r: 22 }],
            buts_hote: 0, buts_invite: 0, tour: 'hote'
        };
        let selected = null, drag = null, moving = false, aiWait = false;

        function resetPositions() {
            state.ball = { x: 380, y: 230, vx: 0, vy: 0, r: 14 };
            state.hote = [{ x: 180, y: 130, vx: 0, vy: 0, r: 22 }, { x: 130, y: 230, vx: 0, vy: 0, r: 22 }, { x: 180, y: 330, vx: 0, vy: 0, r: 22 }];
            state.invite = [{ x: 580, y: 130, vx: 0, vy: 0, r: 22 }, { x: 630, y: 230, vx: 0, vy: 0, r: 22 }, { x: 580, y: 330, vx: 0, vy: 0, r: 22 }];
        }

        function myPieces() {
            if (!isPvp) return state.hote;
            return salonState.role === 'hote' ? state.hote : state.invite;
        }

        function isMyTurn() {
            if (moving || finished) return false;
            if (!isPvp) return state.tour === 'hote';
            return salonState && salonState.etat_jeu && salonState.etat_jeu.tour === salonState.role;
        }

        canvas.onmousedown = e => {
            if (!isMyTurn()) return;
            const m = getMousePos(e);
            myPieces().forEach(p => { if (Math.hypot(m.x - p.x, m.y - p.y) <= p.r + 6) { selected = p; drag = m; } });
        };
        canvas.onmousemove = e => { if (drag) drag = getMousePos(e); };
        canvas.onmouseup = () => {
            if (!selected || !drag) return;
            const vx = Math.max(-18, Math.min(18, (selected.x - drag.x) * 0.14));
            const vy = Math.max(-18, Math.min(18, (selected.y - drag.y) * 0.14));
            if (Math.hypot(vx, vy) > 1) {
                selected.vx = vx; selected.vy = vy;
                moving = true;
                playSound('hit');
            }
            selected = null; drag = null;
        };

        function resolveCollisions(objs) {
            for (let i = 0; i < objs.length; i++) {
                for (let j = i + 1; j < objs.length; j++) {
                    const a = objs[i], b = objs[j];
                    const dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy), minD = a.r + b.r;
                    if (dist < minD && dist > 0) {
                        const nx = dx / dist, ny = dy / dist;
                        const overlap = (minD - dist) / 2;
                        a.x -= nx * overlap; a.y -= ny * overlap;
                        b.x += nx * overlap; b.y += ny * overlap;
                        const dvx = b.vx - a.vx, dvy = b.vy - a.vy;
                        const dot = dvx * nx + dvy * ny;
                        if (dot < 0) {
                            const imp = (b === state.ball || a === state.ball) ? 1.25 : 0.95;
                            a.vx += dot * nx * imp; a.vy += dot * ny * imp;
                            b.vx -= dot * nx * imp; b.vy -= dot * ny * imp;
                            playSound('hit');
                        }
                    }
                }
            }
        }

        (function loop() {
            if (isPvp && !moving && salonState && salonState.etat_jeu) {
                const e = salonState.etat_jeu;
                state.ball.x = e.ball.x; state.ball.y = e.ball.y;
                e.hote.forEach((p, i) => { state.hote[i].x = p.x; state.hote[i].y = p.y; });
                e.invite.forEach((p, i) => { state.invite[i].x = p.x; state.invite[i].y = p.y; });
                state.buts_hote = e.buts_hote || 0;
                state.buts_invite = e.buts_invite || 0;
                state.tour = e.tour;
                if (e.gagnant && !finished) {
                    finished = true;
                    victoryBox.style.display = 'block';
                    victoryBox.innerHTML = `<h2>🏆 ${e.gagnant} remporte le match (${state.buts_hote}-${state.buts_invite}) !</h2><a href="index.php" class="btn btn-primary" style="margin-top:10px;">Retour au lobby</a>`;
                }
            }

            // Terrain
            ctx.fillStyle = '#15803d'; ctx.fillRect(0, 0, 760, 460);
            ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.lineWidth = 3;
            ctx.strokeRect(45, 25, 670, 410);
            ctx.beginPath(); ctx.moveTo(380, 25); ctx.lineTo(380, 435); ctx.stroke();
            ctx.beginPath(); ctx.arc(380, 230, 58, 0, Math.PI * 2); ctx.stroke();
            // Cages gauche & droite
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(18, 165, 27, 130);
            ctx.fillRect(715, 165, 27, 130);

            const all = [state.ball, ...state.hote, ...state.invite];
            if (moving) {
                all.forEach(o => {
                    o.x += o.vx; o.y += o.vy;
                    o.vx *= 0.965; o.vy *= 0.965;
                    if (Math.hypot(o.vx, o.vy) < 0.15) { o.vx = 0; o.vy = 0; }
                    if (o.y < 25 + o.r) { o.y = 25 + o.r; o.vy *= -0.88; }
                    if (o.y > 435 - o.r) { o.y = 435 - o.r; o.vy *= -0.88; }
                    const inGoalY = o.y > 165 && o.y < 295;
                    if (o !== state.ball || !inGoalY) {
                        if (o.x < 45 + o.r) { o.x = 45 + o.r; o.vx *= -0.88; }
                        if (o.x > 715 - o.r) { o.x = 715 - o.r; o.vx *= -0.88; }
                    }
                });
                resolveCollisions(all);

                // But marqué ?
                let goalScored = false;
                if (state.ball.x < 35) { state.buts_invite++; goalScored = true; playSound('score'); resetPositions(); }
                else if (state.ball.x > 725) { state.buts_hote++; goalScored = true; playSound('score'); resetPositions(); }

                if (goalScored || all.every(o => o.vx === 0 && o.vy === 0)) {
                    moving = false;
                    state.tour = state.tour === 'hote' ? 'invite' : 'hote';
                    if (isPvp) {
                        const winName = state.buts_hote >= 3 ? salonState.hote_pseudo : (state.buts_invite >= 3 ? salonState.invite_pseudo : null);
                        syncSalon({
                            etat_jeu: {
                                ball: { x: state.ball.x, y: state.ball.y },
                                hote: state.hote.map(p => ({ x: p.x, y: p.y })),
                                invite: state.invite.map(p => ({ x: p.x, y: p.y })),
                                buts_hote: state.buts_hote,
                                buts_invite: state.buts_invite,
                                tour: state.tour,
                                gagnant: winName
                            },
                            termine: !!winName,
                            pts_hote: state.buts_hote >= 3 ? 190 : 60,
                            pts_invite: state.buts_invite >= 3 ? 190 : 60
                        });
                    } else {
                        if (state.buts_hote >= 3) finishGame(190, `Victoire ${state.buts_hote}-${state.buts_invite} au Table Soccer !`);
                        else if (state.buts_invite >= 3) finishGame(40, `Défaite ${state.buts_hote}-${state.buts_invite}`);
                        else if (state.tour === 'invite' && !aiWait) {
                            aiWait = true;
                            setTimeout(() => {
                                aiWait = false;
                                const p = state.invite.reduce((best, cur) => Math.hypot(cur.x - state.ball.x, cur.y - state.ball.y) < Math.hypot(best.x - state.ball.x, best.y - state.ball.y) ? cur : best);
                                const ang = Math.atan2(state.ball.y - p.y, state.ball.x - p.x) + (Math.random() - 0.5) * 0.16;
                                p.vx = Math.cos(ang) * 14.5; p.vy = Math.sin(ang) * 14.5;
                                moving = true; playSound('hit');
                            }, 650);
                        }
                    }
                }
            }

            if (selected && drag) {
                const vx = Math.max(-18, Math.min(18, (selected.x - drag.x) * 0.14));
                const vy = Math.max(-18, Math.min(18, (selected.y - drag.y) * 0.14));
                drawAimDots(selected.x, selected.y, vx, vy, 8, '#fbbf24');
            }

            state.hote.forEach(p => {
                ctx.fillStyle = '#0284c7'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
            });
            state.invite.forEach(p => {
                ctx.fillStyle = '#e11d48'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
            });
            ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(state.ball.x, state.ball.y, state.ball.r, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2; ctx.stroke();

            ctx.fillStyle = '#fff'; ctx.font = 'bold 20px sans-serif';
            ctx.fillText(`🔵 ${state.buts_hote}  -  ${state.buts_invite} 🔴   (${isMyTurn() ? 'Ton tour' : 'Tour adverse'})`, 245, 20);
            if (!finished) requestAnimationFrame(loop);
        })();
    },

    // 3. BASKET SHOOT PLATO (Trajectoire parabolique, rebond panneau, swish x2, panier mobile)
    'basket'() {
        hint.textContent = 'Clique et glisse vers le panier pour tirer (7 tirs, panier sans toucher l\'arceau = x2) !';
        let ball = { x: 140, y: 340, vx: 0, vy: 0, fly: false, hitRim: false };
        let hoop = { x: 610, y: 195, dir: 0 }, score = 0, tries = 0, streak = 0, drag = null;

        canvas.onmousedown = e => { if (!ball.fly && !finished) drag = getMousePos(e); };
        canvas.onmousemove = e => { if (drag) drag = getMousePos(e); };
        canvas.onmouseup = () => {
            if (!drag || ball.fly) return;
            ball.vx = Math.max(2, Math.min(18, (drag.x - ball.x) * 0.055));
            ball.vy = Math.max(-21, Math.min(-4, (drag.y - ball.y) * 0.065));
            ball.fly = true; ball.hitRim = false; tries++; drag = null;
            playSound('pop');
        };

        (function loop() {
            ctx.fillStyle = '#1e1b4b'; ctx.fillRect(0, 0, 760, 460);
            ctx.fillStyle = '#312e81'; ctx.fillRect(0, 405, 760, 55);

            if (tries >= 3) hoop.dir = hoop.dir === 0 ? 1.8 : hoop.dir;
            hoop.y += hoop.dir;
            if (hoop.y < 120 || hoop.y > 270) hoop.dir *= -1;

            // Panneau & filet
            ctx.fillStyle = '#f8fafc'; ctx.fillRect(hoop.x + 36, hoop.y - 65, 10, 85);
            ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(hoop.x - 32, hoop.y); ctx.lineTo(hoop.x - 22, hoop.y + 42);
            ctx.lineTo(hoop.x + 22, hoop.y + 42); ctx.lineTo(hoop.x + 32, hoop.y);
            ctx.stroke();
            ctx.fillStyle = '#f97316'; ctx.fillRect(hoop.x - 36, hoop.y - 3, 72, 7);

            if (drag && !ball.fly) {
                const vx = Math.max(2, Math.min(18, (drag.x - ball.x) * 0.055));
                const vy = Math.max(-21, Math.min(-4, (drag.y - ball.y) * 0.065));
                for (let t = 1; t <= 14; t++) {
                    const px = ball.x + vx * t * 2;
                    const py = ball.y + vy * t * 2 + 0.5 * 0.36 * Math.pow(t * 2, 2);
                    ctx.fillStyle = '#fbbf24';
                    ctx.globalAlpha = 1 - t / 15;
                    ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill();
                }
                ctx.globalAlpha = 1;
            }

            if (ball.fly) {
                ball.vy += 0.36; ball.x += ball.vx; ball.y += ball.vy;
                // Rebond panneau
                if (ball.x + 17 > hoop.x + 36 && ball.x - 17 < hoop.x + 46 && ball.y > hoop.y - 65 && ball.y < hoop.y + 20) {
                    ball.vx *= -0.72; ball.x = hoop.x + 36 - 17; ball.hitRim = true; playSound('hit');
                }
                // Rebond bord avant de l'arceau
                if (Math.hypot(ball.x - (hoop.x - 36), ball.y - hoop.y) < 18) {
                    ball.vx *= -0.65; ball.vy = -Math.abs(ball.vy) * 0.6; ball.hitRim = true; playSound('hit');
                }
                // Panier réussi !
                if (Math.abs(ball.x - hoop.x) < 28 && Math.abs(ball.y - hoop.y) < 14 && ball.vy > 0) {
                    streak++;
                    const pts = ball.hitRim ? 25 : 45;
                    score += pts + (streak > 1 ? 10 : 0);
                    playSound('score');
                    ball = { x: 110 + Math.random() * 90, y: 340, vx: 0, vy: 0, fly: false, hitRim: false };
                    if (tries >= 7) finishGame(score, `Session terminée : ${score} pts !`);
                } else if (ball.y > 460 || ball.x > 770) {
                    streak = 0; playSound('lose');
                    ball = { x: 110 + Math.random() * 90, y: 340, vx: 0, vy: 0, fly: false, hitRim: false };
                    if (tries >= 7) finishGame(score, `Session terminée : ${score} pts !`);
                }
            }

            ctx.fillStyle = '#ea580c'; ctx.beginPath(); ctx.arc(ball.x, ball.y, 17, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#431407'; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = '#fff'; ctx.font = 'bold 18px sans-serif';
            ctx.fillText(`Tirs : ${tries}/7 · Score : ${score} pts ${streak > 1 ? '🔥 Série x' + streak : ''}`, 25, 36);
            if (!finished) requestAnimationFrame(loop);
        })();
    },

    // 4. BOWLING PLATO (Placement + flèche d'angle + physique des 10 quilles en chaîne + 2 frames)
    'bowling'() {
        hint.textContent = '1) Déplace la souris pour placer la boule et clique · 2) Clique pour fixer l\'angle de tir !';
        let phase = 'pos', bx = 380, by = 400, angle = 0, angleDir = 0.035, vx = 0, vy = 0;
        let frame = 1, ballInFrame = 1, totalScore = 0, pins = [];

        function setupPins() {
            pins = [];
            const rows = [[380, 75], [360, 102], [400, 102], [340, 129], [380, 129], [420, 129], [320, 156], [360, 156], [400, 156], [440, 156]];
            rows.forEach(p => pins.push({ x: p[0], y: p[1], vx: 0, vy: 0, up: true }));
        }
        setupPins();

        canvas.onmousemove = e => {
            if (phase === 'pos') bx = Math.max(255, Math.min(505, getMousePos(e).x));
        };
        canvas.onclick = () => {
            if (finished) return;
            if (phase === 'pos') { phase = 'aim'; playSound('pop'); }
            else if (phase === 'aim') {
                phase = 'roll';
                vx = Math.sin(angle) * 10;
                vy = -Math.cos(angle) * 10;
                playSound('hit');
            }
        };

        (function loop() {
            ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, 760, 460);
            // Gouttières + piste vernie
            ctx.fillStyle = '#1e293b'; ctx.fillRect(215, 0, 330, 460);
            ctx.fillStyle = '#d97706'; ctx.fillRect(240, 0, 280, 460);
            ctx.fillStyle = '#b45309';
            for (let x = 260; x <= 500; x += 40) ctx.fillRect(x, 0, 2, 460);

            if (phase === 'aim') {
                angle += angleDir;
                if (angle > 0.42 || angle < -0.42) angleDir *= -1;
                drawAimDots(bx, by, Math.sin(angle) * 9, -Math.cos(angle) * 9, 10, '#38bdf8');
            }

            if (phase === 'roll') {
                bx += vx; by += vy;
                if (bx < 242 || bx > 518) vx = 0; // tombée dans la gouttière

                pins.forEach(p => {
                    if (p.up && Math.hypot(bx - p.x, by - p.y) < 30) {
                        p.up = false;
                        p.vx = (p.x - bx) * 0.28 + vx * 0.3;
                        p.vy = -5 - Math.random() * 3;
                        playSound('hit');
                    }
                });
                // Réaction en chaîne entre quilles
                for (let i = 0; i < pins.length; i++) {
                    const a = pins[i];
                    if (!a.up) { a.x += a.vx; a.y += a.vy; }
                    for (let j = 0; j < pins.length; j++) {
                        const b = pins[j];
                        if (!a.up && b.up && Math.hypot(a.x - b.x, a.y - b.y) < 24) {
                            b.up = false; b.vx = (b.x - a.x) * 0.3; b.vy = -4;
                            playSound('hit');
                        }
                    }
                }

                if (by < 30) {
                    const down = pins.filter(p => !p.up).length;
                    if (down === 10 || ballInFrame === 2) {
                        const bonus = (down === 10 && ballInFrame === 1) ? 40 : (down === 10 ? 20 : 0);
                        totalScore += down * 10 + bonus;
                        if (down === 10) playSound('score');
                        frame++; ballInFrame = 1;
                        if (frame > 2) {
                            finishGame(totalScore, `Partie de Bowling terminée : ${totalScore} pts !`);
                        } else {
                            setupPins();
                        }
                    } else {
                        ballInFrame = 2;
                    }
                    bx = 380; by = 400; angle = 0; phase = 'pos';
                }
            }

            pins.forEach(p => {
                if (p.y < 15) return;
                ctx.fillStyle = p.up ? '#ffffff' : '#94a3b8';
                ctx.beginPath(); ctx.arc(p.x, p.y, 10, 0, Math.PI * 2); ctx.fill();
                if (p.up) { ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill(); }
            });

            ctx.fillStyle = '#2563eb'; ctx.beginPath(); ctx.arc(bx, by, 18, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#93c5fd'; ctx.lineWidth = 2; ctx.stroke();

            ctx.fillStyle = '#fff'; ctx.font = 'bold 17px sans-serif';
            ctx.fillText(`Frame ${Math.min(2, frame)}/2 · Lancer ${ballInFrame}/2 · Score : ${totalScore} pts`, 20, 34);
            if (!finished) requestAnimationFrame(loop);
        })();
    },

    // 5. PING-PONG PLATO (Effet lifté selon mouvement de raquette + traînée lumineuse, premier à 7)
    'ping-pong'() {
        hint.textContent = 'Déplace la souris verticalement pour renvoyer et lifter la balle (Premier à 7) !';
        let py = 185, prevPy = 185, ay = 185, b = { x: 380, y: 230, vx: 6.5, vy: 3.5 }, ps = 0, as = 0, trail = [];
        canvas.onmousemove = e => { prevPy = py; py = Math.max(10, Math.min(360, getMousePos(e).y - 45)); };
        (function loop() {
            ctx.fillStyle = '#0e7490'; ctx.fillRect(0, 0, 760, 460);
            ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 4; ctx.strokeRect(10, 10, 740, 440);
            ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(378, 10, 4, 440);

            ay += (b.y - (ay + 45)) * 0.095;
            b.x += b.vx; b.y += b.vy;
            trail.push({ x: b.x, y: b.y }); if (trail.length > 10) trail.shift();

            if (b.y < 20 || b.y > 440) { b.vy *= -1; playSound('hit'); }
            if (b.x < 38 && b.x > 16 && b.y > py - 6 && b.y < py + 96) {
                const spin = (py - prevPy) * 0.25;
                b.vx = Math.min(13, Math.abs(b.vx) * 1.05);
                b.vy = Math.max(-9, Math.min(9, b.vy + spin));
                playSound('hit');
            }
            if (b.x > 722 && b.x < 744 && b.y > ay - 6 && b.y < ay + 96) {
                b.vx = -Math.min(13, Math.abs(b.vx) * 1.04);
                playSound('hit');
            }
            if (b.x < 0) { as++; playSound('lose'); b = { x: 380, y: 230, vx: 6.5, vy: (Math.random() - 0.5) * 6 }; trail = []; }
            if (b.x > 760) { ps++; playSound('score'); b = { x: 380, y: 230, vx: -6.5, vy: (Math.random() - 0.5) * 6 }; trail = []; }

            trail.forEach((t, idx) => {
                ctx.fillStyle = `rgba(251, 191, 36, ${idx / 14})`;
                ctx.beginPath(); ctx.arc(t.x, t.y, 8, 0, Math.PI * 2); ctx.fill();
            });
            ctx.fillStyle = '#38bdf8'; ctx.fillRect(20, py, 14, 90);
            ctx.fillStyle = '#f43f5e'; ctx.fillRect(726, ay, 14, 90);
            ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(b.x, b.y, 10, 0, Math.PI * 2); ctx.fill();

            ctx.fillStyle = '#fff'; ctx.font = 'bold 28px sans-serif';
            ctx.fillText(`${ps}   -   ${as}`, 335, 48);
            if (ps >= 7 || as >= 7) finishGame(ps >= 7 ? 170 : 40, ps >= 7 ? `Victoire ${ps}-${as} au Ping-Pong !` : `Défaite ${ps}-${as}`);
            if (!finished) requestAnimationFrame(loop);
        })();
    },

    // 6. BADMINTON SMASH PLATO (Saut, lob, smash enflammé au clic, premier à 7)
    'badminton'() {
        hint.textContent = 'Déplace-toi à la souris, clique pour SMASHER le volant (Premier à 7) !';
        let px = 170, py = 365, vyP = 0, ax = 580, smashFlash = 0;
        let s = { x: 200, y: 150, vx: 4.5, vy: 0, fire: false }, ps = 0, as = 0;

        canvas.onmousemove = e => { px = Math.min(345, Math.max(35, getMousePos(e).x)); };
        canvas.onclick = () => {
            if (py >= 365) vyP = -9.5;
            if (Math.hypot(s.x - px, s.y - py) < 75) {
                s.vx = 11.5; s.vy = 2.8; s.fire = true; smashFlash = 10;
                playSound('score');
            }
        };

        (function loop() {
            ctx.fillStyle = '#115e59'; ctx.fillRect(0, 0, 760, 460);
            ctx.fillStyle = '#0f766e'; ctx.fillRect(0, 395, 760, 65);
            ctx.fillStyle = '#fff'; ctx.fillRect(378, 255, 4, 140);

            py += vyP; vyP += 0.55;
            if (py > 365) { py = 365; vyP = 0; }

            ax += (s.x - ax) * 0.07; ax = Math.max(415, Math.min(720, ax));
            s.vy += 0.22; s.vx *= 0.992; s.x += s.vx; s.y += s.vy;
            if (s.x < 15 || s.x > 745) s.vx *= -0.8;

            // Filet
            if (Math.abs(s.x - 380) < 10 && s.y > 255) { s.vx *= -0.6; playSound('hit'); }

            if (Math.hypot(s.x - px, s.y - py) < 46 && s.vx < 0) {
                s.vx = 7.2; s.vy = -9.2; s.fire = false; playSound('hit');
            }
            if (Math.hypot(s.x - ax, s.y - 365) < 48 && s.vx > 0) {
                s.vx = -6.8; s.vy = -8.8; s.fire = false; playSound('hit');
            }
            if (s.y > 395) {
                if (s.x > 380) { ps++; playSound('score'); } else { as++; playSound('lose'); }
                s = { x: 220, y: 140, vx: 4.5, vy: 0, fire: false };
            }

            ctx.fillStyle = '#38bdf8'; ctx.beginPath(); ctx.arc(px, py, 24, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#f43f5e'; ctx.beginPath(); ctx.arc(ax, 365, 24, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = s.fire ? '#ef4444' : '#fbbf24';
            ctx.beginPath(); ctx.arc(s.x, s.y, s.fire ? 12 : 9, 0, Math.PI * 2); ctx.fill();
            if (smashFlash > 0) { smashFlash--; ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 22px sans-serif'; ctx.fillText('SMASH !', px - 25, py - 35); }

            ctx.fillStyle = '#fff'; ctx.font = 'bold 26px sans-serif'; ctx.fillText(`${ps} - ${as}`, 350, 44);
            if (ps >= 7 || as >= 7) finishGame(ps >= 7 ? 175 : 40, ps >= 7 ? `Victoire ${ps}-${as} au Badminton !` : `Match perdu ${ps}-${as}`);
            if (!finished) requestAnimationFrame(loop);
        })();
    },

    // 7. BILLARD 8-BALL PLATO (Queue de billard, visée pointillée, 7 billes colorées + Noire 8, Solo & PvP)
    'billard'() {
        hint.textContent = 'Clique sur la bille blanche et tire en arrière pour viser (empoche tes billes puis la 8 noire) !';
        const isPvp = Boolean(SALON && salonState);
        const pockets = [[32, 32], [380, 26], [728, 32], [32, 428], [380, 434], [728, 428]];
        let balls = [
            { id: 0, x: 190, y: 230, vx: 0, vy: 0, c: '#ffffff', team: 'cue', in: false },
            { id: 1, x: 510, y: 230, vx: 0, vy: 0, c: '#ef4444', team: 'hote', in: false },
            { id: 2, x: 534, y: 216, vx: 0, vy: 0, c: '#fbbf24', team: 'invite', in: false },
            { id: 3, x: 534, y: 244, vx: 0, vy: 0, c: '#ef4444', team: 'hote', in: false },
            { id: 8, x: 558, y: 230, vx: 0, vy: 0, c: '#0f172a', team: 'eight', in: false },
            { id: 4, x: 558, y: 202, vx: 0, vy: 0, c: '#fbbf24', team: 'invite', in: false },
            { id: 5, x: 558, y: 258, vx: 0, vy: 0, c: '#ef4444', team: 'hote', in: false },
            { id: 6, x: 582, y: 230, vx: 0, vy: 0, c: '#fbbf24', team: 'invite', in: false }
        ];
        let tour = 'hote', drag = null, moving = false, aiWait = false;

        function isMyTurn() {
            if (moving || finished) return false;
            if (!isPvp) return tour === 'hote';
            return salonState && salonState.etat_jeu && salonState.etat_jeu.tour === salonState.role;
        }

        canvas.onmousedown = e => {
            if (!isMyTurn()) return;
            const m = getMousePos(e), cue = balls[0];
            if (Math.hypot(m.x - cue.x, m.y - cue.y) < 42) drag = m;
        };
        canvas.onmousemove = e => { if (drag) drag = getMousePos(e); };
        canvas.onmouseup = () => {
            if (!drag) return;
            const cue = balls[0];
            const vx = Math.max(-18, Math.min(18, (cue.x - drag.x) * 0.14));
            const vy = Math.max(-18, Math.min(18, (cue.y - drag.y) * 0.14));
            if (Math.hypot(vx, vy) > 0.8) {
                cue.vx = vx; cue.vy = vy; moving = true; playSound('hit');
            }
            drag = null;
        };

        (function loop() {
            if (isPvp && !moving && salonState && salonState.etat_jeu) {
                const e = salonState.etat_jeu;
                if (e.balls) {
                    e.balls.forEach((sb, i) => { balls[i].x = sb.x; balls[i].y = sb.y; balls[i].in = sb.in; });
                }
                tour = e.tour || 'hote';
                if (e.gagnant && !finished) {
                    finished = true;
                    victoryBox.style.display = 'block';
                    victoryBox.innerHTML = `<h2>🎱 ${e.gagnant} remporte la partie de Billard !</h2><a href="index.php" class="btn btn-primary" style="margin-top:10px;">Retour au lobby</a>`;
                }
            }

            // Cadre bois & tapis vert
            ctx.fillStyle = '#78350f'; ctx.fillRect(0, 0, 760, 460);
            ctx.fillStyle = '#047857'; ctx.fillRect(24, 24, 712, 412);
            pockets.forEach(p => { ctx.fillStyle = '#090d16'; ctx.beginPath(); ctx.arc(p[0], p[1], 19, 0, Math.PI * 2); ctx.fill(); });

            const active = balls.filter(b => !b.in);
            if (moving) {
                active.forEach(b => {
                    b.x += b.vx; b.y += b.vy; b.vx *= 0.982; b.vy *= 0.982;
                    if (Math.hypot(b.vx, b.vy) < 0.12) { b.vx = 0; b.vy = 0; }
                    if (b.x < 36) { b.x = 36; b.vx *= -0.88; }
                    if (b.x > 724) { b.x = 724; b.vx *= -0.88; }
                    if (b.y < 36) { b.y = 36; b.vy *= -0.88; }
                    if (b.y > 424) { b.y = 424; b.vy *= -0.88; }
                });

                for (let i = 0; i < active.length; i++) {
                    for (let j = i + 1; j < active.length; j++) {
                        const a = active[i], b = active[j];
                        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
                        if (d < 24 && d > 0) {
                            const nx = dx / d, ny = dy / d, ov = (24 - d) / 2;
                            a.x -= nx * ov; a.y -= ny * ov; b.x += nx * ov; b.y += ny * ov;
                            const p = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
                            if (p > 0) {
                                a.vx -= p * nx; a.vy -= p * ny;
                                b.vx += p * nx; b.vy += p * ny;
                                playSound('hit');
                            }
                        }
                    }
                }

                let pottedThisTurn = [];
                active.forEach(b => {
                    if (pockets.some(p => Math.hypot(b.x - p[0], b.y - p[1]) < 22)) {
                        b.vx = 0; b.vy = 0;
                        if (b.id === 0) { b.x = 190; b.y = 230; playSound('lose'); }
                        else { b.in = true; pottedThisTurn.push(b); playSound('score'); }
                    }
                });

                if (active.every(b => b.vx === 0 && b.vy === 0)) {
                    moving = false;
                    const eight = balls.find(b => b.id === 8);
                    const hoteLeft = balls.filter(b => b.team === 'hote' && !b.in).length;
                    const invLeft = balls.filter(b => b.team === 'invite' && !b.in).length;
                    let winnerRole = null;

                    if (eight.in) {
                        if (tour === 'hote') winnerRole = hoteLeft === 0 ? 'hote' : 'invite';
                        else winnerRole = invLeft === 0 ? 'invite' : 'hote';
                    }

                    const keptTurn = pottedThisTurn.some(b => b.team === tour);
                    if (!keptTurn) tour = tour === 'hote' ? 'invite' : 'hote';

                    if (isPvp) {
                        const winPseudo = winnerRole === 'hote' ? salonState.hote_pseudo : (winnerRole === 'invite' ? salonState.invite_pseudo : null);
                        syncSalon({
                            etat_jeu: {
                                balls: balls.map(b => ({ x: b.x, y: b.y, in: b.in })),
                                tour,
                                gagnant: winPseudo
                            },
                            termine: !!winPseudo,
                            pts_hote: winnerRole === 'hote' ? 210 : 60,
                            pts_invite: winnerRole === 'invite' ? 210 : 60
                        });
                    } else {
                        if (winnerRole === 'hote') finishGame(210, 'Tu as empoché la 8 Noire ! Victoire !');
                        else if (winnerRole === 'invite') finishGame(40, 'Partie perdue au Billard 8-Ball !');
                        else if (tour === 'invite' && !aiWait) {
                            aiWait = true;
                            setTimeout(() => {
                                aiWait = false;
                                const targets = balls.filter(b => !b.in && (invLeft === 0 ? b.id === 8 : b.team === 'invite'));
                                const t = targets[0] || balls[0];
                                const ang = Math.atan2(t.y - balls[0].y, t.x - balls[0].x) + (Math.random() - 0.5) * 0.1;
                                balls[0].vx = Math.cos(ang) * 14; balls[0].vy = Math.sin(ang) * 14;
                                moving = true; playSound('hit');
                            }, 700);
                        }
                    }
                }
            }

            balls.forEach(b => {
                if (b.in) return;
                ctx.fillStyle = b.c; ctx.beginPath(); ctx.arc(b.x, b.y, 12, 0, Math.PI * 2); ctx.fill();
                if (b.id === 8) {
                    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(b.x, b.y, 5, 0, Math.PI * 2); ctx.fill();
                }
            });

            if (drag) {
                const cue = balls[0];
                const vx = Math.max(-18, Math.min(18, (cue.x - drag.x) * 0.14));
                const vy = Math.max(-18, Math.min(18, (cue.y - drag.y) * 0.14));
                drawAimDots(cue.x, cue.y, vx, vy, 11, '#fde047');
                // Queue de billard
                const ang = Math.atan2(drag.y - cue.y, drag.x - cue.x);
                ctx.strokeStyle = '#fde68a'; ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.moveTo(cue.x + Math.cos(ang) * 18, cue.y + Math.sin(ang) * 18);
                ctx.lineTo(cue.x + Math.cos(ang) * 115, cue.y + Math.sin(ang) * 115);
                ctx.stroke();
            }

            const rLeft = balls.filter(b => b.team === 'hote' && !b.in).length;
            const yLeft = balls.filter(b => b.team === 'invite' && !b.in).length;
            ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif';
            ctx.fillText(`🔴 Toi : ${rLeft} · 🟡 Adv : ${yLeft} · ${isMyTurn() ? 'À toi de tirer' : 'Tour adverse...'}`, 230, 18);
            if (!finished) requestAnimationFrame(loop);
        })();
    },

    // 8. UNO EXPRESS PLATO (+2, Passer, Joker Couleur, +4, sélecteur de couleur, Solo & PvP)
    'uno'() {
        useDomMode('Joue une carte de même couleur, même symbole, ou un Joker (+2, 🚫 Passer, 🎨 Couleur, +4) !');
        const cols = ['#ef4444', '#3b82f6', '#22c55e', '#eab308'];
        const randCard = (numOnly = false) => {
            const c = cols[Math.floor(Math.random() * 4)];
            if (numOnly) return { c, v: String(Math.floor(Math.random() * 9) + 1) };
            const r = Math.random();
            if (r < 0.65) return { c, v: String(Math.floor(Math.random() * 9) + 1) };
            if (r < 0.78) return { c, v: '+2' };
            if (r < 0.88) return { c, v: '🚫' };
            if (r < 0.95) return { c: '#1e293b', v: '🎨' };
            return { c: '#1e293b', v: '+4' };
        };

        if (SALON && salonState) {
            const e = salonState.etat_jeu;
            const myKey = salonState.role === 'hote' ? 'hand_hote' : 'hand_invite';
            const oppKey = salonState.role === 'hote' ? 'hand_invite' : 'hand_hote';
            const myHand = e[myKey] || [];
            const oppHand = e[oppKey] || [];
            const myTurn = e.tour === salonState.role && !e.gagnant;

            domArea.innerHTML = `
                <div class="plato-hud-bar">
                    <span>Cartes de ton ami : <strong>${oppHand.length}</strong></span>
                    <span>·</span>
                    <strong style="color:#fbbf24;">${e.gagnant ? '🏆 ' + e.gagnant : (myTurn ? 'C\'est ton tour !' : 'Tour de ton ami...')}</strong>
                </div>
                <p style="font-size:0.88rem;color:var(--text-muted);">${e.info || ''}</p>
                <div class="uno-table">
                    <div class="uno-card" id="unoDeckPvp" style="background:#1e293b;">UNO<br><small style="font-size:0.7rem;">Pioche</small></div>
                    <div class="uno-card" style="background:${e.top.c};transform:scale(1.12);">${e.top.v}</div>
                </div>
                <div id="unoColorBox"></div>
                <div class="card-hand">${myHand.map((c, i) => {
                    const ok = myTurn && (c.c === e.top.c || c.v === e.top.v || c.c === '#1e293b');
                    return `<div class="uno-card ${ok ? 'playable' : 'disabled'}" data-i="${i}" style="background:${c.c};">${c.v}</div>`;
                }).join('')}</div>
            `;

            if (myTurn) {
                const applyMove = async (card, chosenColor) => {
                    const played = { c: chosenColor || card.c, v: card.v };
                    e.top = played;
                    let skip = false;
                    if (card.v === '+2') { oppHand.push(randCard(), randCard()); skip = true; e.info = '+2 cartes envoyées à l\'adversaire !'; }
                    else if (card.v === '+4') { oppHand.push(randCard(), randCard(), randCard(), randCard()); skip = true; e.info = '+4 cartes envoyées !'; }
                    else if (card.v === '🚫') { skip = true; e.info = 'Tour adverse passé !'; }
                    else { e.info = `Carte ${card.v} jouée !`; }

                    if (myHand.length === 0) e.gagnant = (salonState.role === 'hote' ? salonState.hote_pseudo : salonState.invite_pseudo) + ' fait UNO et gagne !';
                    if (!skip) e.tour = salonState.role === 'hote' ? 'invite' : 'hote';

                    await syncSalon({
                        etat_jeu: e,
                        termine: !!e.gagnant,
                        pts_hote: e.gagnant && salonState.role === 'hote' ? 200 : 60,
                        pts_invite: e.gagnant && salonState.role === 'invite' ? 200 : 60
                    });
                };

                domArea.querySelectorAll('.uno-card.playable').forEach(el => el.onclick = () => {
                    const idx = +el.dataset.i;
                    const card = myHand[idx];
                    myHand.splice(idx, 1);
                    playSound('pop');
                    if (card.c === '#1e293b') {
                        document.getElementById('unoColorBox').innerHTML = `<div class="color-picker-row">${cols.map(col => `<div class="color-dot" data-col="${col}" style="background:${col};"></div>`).join('')}</div>`;
                        document.querySelectorAll('.color-dot').forEach(dot => dot.onclick = () => applyMove(card, dot.dataset.col));
                    } else {
                        applyMove(card, null);
                    }
                });

                document.getElementById('unoDeckPvp').onclick = async () => {
                    myHand.push(randCard());
                    playSound('pop');
                    e.tour = salonState.role === 'hote' ? 'invite' : 'hote';
                    e.info = 'Un joueur a pioché une carte.';
                    await syncSalon({ etat_jeu: e });
                };
            }
            return;
        }

        let top = randCard(true), hand = Array.from({ length: 7 }, () => randCard()), botHand = Array.from({ length: 7 }, () => randCard());
        let info = 'À toi de jouer !', pickingColor = null;

        function botPlay() {
            if (finished) return;
            const idx = botHand.findIndex(c => c.c === top.c || c.v === top.v || c.c === '#1e293b');
            if (idx >= 0) {
                const c = botHand.splice(idx, 1)[0];
                const chosen = c.c === '#1e293b' ? cols[Math.floor(Math.random() * 4)] : c.c;
                top = { c: chosen, v: c.v };
                playSound('pop');
                if (botHand.length === 0) return finishGame(35, 'L\'IA a crié UNO avant toi !');
                if (c.v === '+2') { hand.push(randCard(), randCard()); info = 'L\'IA te met +2 et rejoue !'; render(); return setTimeout(botPlay, 700); }
                if (c.v === '+4') { hand.push(randCard(), randCard(), randCard(), randCard()); info = 'L\'IA te met +4 et rejoue !'; render(); return setTimeout(botPlay, 700); }
                if (c.v === '🚫') { info = 'L\'IA passe ton tour et rejoue !'; render(); return setTimeout(botPlay, 700); }
                info = 'À toi de jouer !';
            } else {
                botHand.push(randCard());
                info = 'L\'IA a pioché une carte. À toi !';
            }
            render();
        }

        function render() {
            domArea.innerHTML = `
                <div class="plato-hud-bar">
                    <span>Cartes IA : <strong>${botHand.length}</strong></span>
                    <span>·</span>
                    <strong style="color:#fbbf24;">${info}</strong>
                </div>
                <div class="uno-table">
                    <div class="uno-card" id="drawUno" style="background:#1e293b;">UNO<br><small style="font-size:0.7rem;">Pioche</small></div>
                    <div class="uno-card" style="background:${top.c};transform:scale(1.12);">${top.v}</div>
                </div>
                ${pickingColor ? `<div class="color-picker-row">${cols.map(col => `<div class="color-dot" data-col="${col}" style="background:${col};"></div>`).join('')}</div>` : ''}
                <div class="card-hand">${hand.map((c, i) => {
                    const ok = !pickingColor && (c.c === top.c || c.v === top.v || c.c === '#1e293b');
                    return `<div class="uno-card ${ok ? 'playable' : 'disabled'}" data-i="${i}" style="background:${c.c};">${c.v}</div>`;
                }).join('')}</div>
            `;

            if (pickingColor) {
                domArea.querySelectorAll('.color-dot').forEach(dot => dot.onclick = () => {
                    const card = pickingColor; pickingColor = null;
                    top = { c: dot.dataset.col, v: card.v };
                    if (card.v === '+4') { botHand.push(randCard(), randCard(), randCard(), randCard()); info = '+4 ! Tu rejoues !'; return render(); }
                    info = 'Tour de l\'IA...'; render(); setTimeout(botPlay, 650);
                });
                return;
            }

            domArea.querySelectorAll('.uno-card.playable').forEach(el => el.onclick = () => {
                const c = hand.splice(+el.dataset.i, 1)[0];
                playSound('pop');
                if (hand.length === 0) return finishGame(200, 'UNO ! Tu as vidé ta main en premier !');
                if (c.c === '#1e293b') { pickingColor = c; info = 'Choisis une couleur :'; return render(); }
                top = c;
                if (c.v === '+2') { botHand.push(randCard(), randCard()); info = '+2 ! Tu rejoues !'; return render(); }
                if (c.v === '🚫') { info = 'Tour passé ! Tu rejoues !'; return render(); }
                info = 'Tour de l\'IA...'; render(); setTimeout(botPlay, 650);
            });

            document.getElementById('drawUno').onclick = () => {
                hand.push(randCard()); playSound('pop');
                info = 'Tu as pioché. Tour de l\'IA...'; render(); setTimeout(botPlay, 650);
            };
        }
        render();
    },

    // 9. LUDO ROYAL PLATO (Vrai plateau en croix 9x9, 2 pions par joueur, 6 = sortir/rejouer, cases étoiles)
    'ludo'() {
        useDomMode('Fais un 6 pour sortir un pion bleu, capture les pions rouges hors des étoiles ⭐ et amène tes 2 pions au centre 🏆 !');
        // Parcours de 28 cases autour de la grille 9x9 (indices r*9 + c)
        const track = [
            36,37,38,29,20,11,2,3,4,5,6,15,24,33,42,43,44,53,62,61,60,59,68,77,76,75,74,65,56,47,38
        ].slice(0, 28);
        const stars = [0, 7, 14, 21]; // positions sur track protégées

        function buildBoardHtml(bluePawns, redPawns, canMoveBlue, onMoveIdx) {
            const blueBaseCells = [10, 19], redBaseCells = [61, 70];
            let cells = '';
            for (let idx = 0; idx < 81; idx++) {
                let cls = 'ludo-cell', content = '';
                if (idx === 40) { cls += ' goal'; content = '🏆'; }
                else if (blueBaseCells.includes(idx)) cls += ' home-blue';
                else if (redBaseCells.includes(idx)) cls += ' home-red';
                else {
                    const tIdx = track.indexOf(idx);
                    if (tIdx >= 0 && stars.includes(tIdx)) { cls += ' star'; content = '⭐'; }
                }

                // Pions dans leurs bases
                bluePawns.forEach((pos, pi) => {
                    if (pos === 0 && blueBaseCells[pi] === idx) {
                        content = `<div class="ludo-pawn blue ${canMoveBlue ? 'movable' : ''}" data-pi="${pi}">B${pi + 1}</div>`;
                    } else if (pos > 0 && pos < 29 && track[(pos - 1) % 28] === idx) {
                        content = `<div class="ludo-pawn blue ${canMoveBlue ? 'movable' : ''}" data-pi="${pi}">B${pi + 1}</div>`;
                    }
                });
                redPawns.forEach((pos, pi) => {
                    if (pos === 0 && redBaseCells[pi] === idx) {
                        content = `<div class="ludo-pawn red">R${pi + 1}</div>`;
                    } else if (pos > 0 && pos < 29 && track[(pos + 13) % 28] === idx) {
                        content = `<div class="ludo-pawn red">R${pi + 1}</div>`;
                    }
                });

                cells += `<div class="${cls}">${content}</div>`;
            }
            return `<div class="ludo-board">${cells}</div>`;
        }

        if (SALON && salonState) {
            const e = salonState.etat_jeu;
            const isHote = salonState.role === 'hote';
            const myPions = isHote ? e.pions_hote : e.pions_invite;
            const oppPions = isHote ? e.pions_invite : e.pions_hote;
            const myTurn = e.tour === salonState.role && !e.gagnant;

            domArea.innerHTML = `
                <div class="plato-hud-bar">
                    <span>Dé : <strong>${e.de ?? '-'}</strong></span>
                    <span>·</span>
                    <strong style="color:#fbbf24;">${e.gagnant ? '🏆 ' + e.gagnant : e.info}</strong>
                </div>
                ${buildBoardHtml(e.pions_hote, e.pions_invite, myTurn && e.peut_jouer)}
                ${myTurn && !e.peut_jouer ? '<button id="rollLudoPvp" class="btn btn-primary">🎲 Lancer le dé</button>' : ''}
            `;

            if (myTurn && !e.peut_jouer) {
                document.getElementById('rollLudoPvp').onclick = async () => {
                    const d = Math.floor(Math.random() * 6) + 1;
                    playSound('pop');
                    e.de = d;
                    const canMove = myPions.some(p => (p === 0 && d === 6) || (p > 0 && p < 29));
                    if (!canMove) {
                        e.info = `Dé ${d} : aucun pion déplaçable.`;
                        e.tour = isHote ? 'invite' : 'hote';
                    } else {
                        e.peut_jouer = true;
                        e.info = `Dé ${d} ! Clique sur un de tes pions pour avancer.`;
                    }
                    await syncSalon({ etat_jeu: e });
                };
            }
            if (myTurn && e.peut_jouer) {
                domArea.querySelectorAll('.ludo-pawn.movable').forEach(el => el.onclick = async () => {
                    const pi = +el.dataset.pi;
                    const d = e.de;
                    if (myPions[pi] === 0 && d !== 6) return;
                    myPions[pi] = myPions[pi] === 0 ? 1 : Math.min(29, myPions[pi] + d);
                    playSound('hit');

                    // Capture ?
                    if (myPions[pi] > 0 && myPions[pi] < 29) {
                        const myTile = (myPions[pi] - 1 + (isHote ? 0 : 14)) % 28;
                        if (!stars.includes(myTile)) {
                            oppPions.forEach((op, oi) => {
                                const opTile = (op - 1 + (isHote ? 14 : 0)) % 28;
                                if (op > 0 && op < 29 && myTile === opTile) { oppPions[oi] = 0; playSound('score'); }
                            });
                        }
                    }
                    e.peut_jouer = false;
                    if (myPions.every(p => p >= 29)) {
                        e.gagnant = (isHote ? salonState.hote_pseudo : salonState.invite_pseudo) + ' gagne au Ludo Royal !';
                    } else if (d !== 6) {
                        e.tour = isHote ? 'invite' : 'hote';
                    } else {
                        e.info = 'Un 6 ! Rejoue !';
                    }
                    await syncSalon({
                        etat_jeu: e,
                        termine: !!e.gagnant,
                        pts_hote: e.gagnant && isHote ? 210 : 60,
                        pts_invite: e.gagnant && !isHote ? 210 : 60
                    });
                });
            }
            return;
        }

        let blue = [0, 0], red = [0, 0], dice = '-', canMove = false, msg = 'Lance le dé !';
        function render() {
            domArea.innerHTML = `
                <div class="plato-hud-bar">
                    <span>Dé : <strong>${dice}</strong></span>
                    <span>·</span>
                    <span>Bleu arrivés : ${blue.filter(x=>x>=29).length}/2 · Rouge : ${red.filter(x=>x>=29).length}/2</span>
                </div>
                <p style="color:#fbbf24;font-weight:700;">${msg}</p>
                ${buildBoardHtml(blue, red, canMove)}
                ${!canMove ? '<button id="rollLudo" class="btn btn-primary">🎲 Lancer le dé</button>' : ''}
            `;
            if (!canMove) {
                document.getElementById('rollLudo').onclick = () => {
                    dice = Math.floor(Math.random() * 6) + 1;
                    playSound('pop');
                    if (blue.some(p => (p === 0 && dice === 6) || (p > 0 && p < 29))) {
                        canMove = true; msg = `Tu as fait ${dice} ! Clique sur un pion bleu (B1 ou B2).`;
                        render();
                    } else {
                        msg = `Dé ${dice} : aucun pion ne peut bouger. Tour de l'IA...`;
                        render(); setTimeout(aiTurn, 700);
                    }
                };
            } else {
                domArea.querySelectorAll('.ludo-pawn.movable').forEach(el => el.onclick = () => {
                    const pi = +el.dataset.pi;
                    if (blue[pi] === 0 && dice !== 6) return;
                    blue[pi] = blue[pi] === 0 ? 1 : Math.min(29, blue[pi] + dice);
                    playSound('hit');
                    if (blue[pi] > 0 && blue[pi] < 29) {
                        const bTile = (blue[pi] - 1) % 28;
                        if (!stars.includes(bTile)) {
                            red.forEach((rp, ri) => { if (rp > 0 && rp < 29 && ((rp + 13) % 28) === bTile) { red[ri] = 0; playSound('score'); } });
                        }
                    }
                    canMove = false;
                    if (blue.every(p => p >= 29)) return finishGame(210, 'Victoire au Ludo Royal !');
                    if (dice === 6) { msg = 'Tu as fait 6 ! Relance le dé !'; render(); }
                    else { msg = 'Tour de l\'IA rouge...'; render(); setTimeout(aiTurn, 700); }
                });
            }
        }

        function aiTurn() {
            if (finished) return;
            const d = Math.floor(Math.random() * 6) + 1;
            const idx = red.findIndex(p => (p === 0 && d === 6) || (p > 0 && p < 29));
            if (idx >= 0) {
                red[idx] = red[idx] === 0 ? 1 : Math.min(29, red[idx] + d);
                if (red[idx] > 0 && red[idx] < 29) {
                    const rTile = (red[idx] + 13) % 28;
                    if (!stars.includes(rTile)) {
                        blue.forEach((bp, bi) => { if (bp > 0 && bp < 29 && ((bp - 1) % 28) === rTile) blue[bi] = 0; });
                    }
                }
                if (red.every(p => p >= 29)) return finishGame(40, 'L\'IA rouge a gagné au Ludo !');
                if (d === 6) return setTimeout(aiTurn, 600);
            }
            msg = `L'IA a fait ${d}. À ton tour !`;
            render();
        }
        render();
    },

    // 10. PUISSANCE 4 PLATO (IA intelligente + surbrillance des 4 jetons gagnants + PvP)
    'puissance-4'() {
        function getWinCells(grid, p) {
            for (let r = 0; r < 6; r++) for (let c = 0; c < 7; c++) {
                if (c < 4 && [0,1,2,3].every(k => grid[r][c+k] === p)) return [0,1,2,3].map(k => `${r}-${c+k}`);
                if (r < 3 && [0,1,2,3].every(k => grid[r+k][c] === p)) return [0,1,2,3].map(k => `${r+k}-${c}`);
                if (r < 3 && c < 4 && [0,1,2,3].every(k => grid[r+k][c+k] === p)) return [0,1,2,3].map(k => `${r+k}-${c+k}`);
                if (r > 2 && c < 4 && [0,1,2,3].every(k => grid[r-k][c+k] === p)) return [0,1,2,3].map(k => `${r-k}-${c+k}`);
            }
            return null;
        }

        if (SALON && salonState) {
            useDomMode('Puissance 4 en ligne : 🔴 Hôte vs 🟡 Invité');
            const e = salonState.etat_jeu;
            const myNum = salonState.role === 'hote' ? 1 : 2;
            const myTurn = e.tour === salonState.role && !e.gagnant;
            const winSet = new Set(e.winCells || []);
            domArea.innerHTML = `
                <p style="color:#fbbf24;font-weight:700;">${e.gagnant ? '🏆 ' + e.gagnant + ' gagne la partie !' : (myTurn ? 'À toi de jouer (' + (myNum === 1 ? '🔴' : '🟡') + ')' : 'En attente du coup de ton ami...')}</p>
                <div class="c4-grid">${e.grid.flatMap((row, r) => row.map((v, c) =>
                    `<div class="c4-cell ${winSet.has(`${r}-${c}`) ? 'win-glow' : ''}" data-c="${c}" style="background:${v===1?'#ef4444':v===2?'#fbbf24':'#0b0e1a'}"></div>`)).join('')}</div>
            `;
            if (myTurn) {
                domArea.querySelectorAll('.c4-cell').forEach(el => el.onclick = async () => {
                    const col = +el.dataset.c;
                    let placed = false;
                    for (let r = 5; r >= 0; r--) if (!e.grid[r][col]) { e.grid[r][col] = myNum; placed = true; break; }
                    if (!placed) return;
                    playSound('pop');
                    const wc = getWinCells(e.grid, myNum);
                    if (wc) { e.gagnant = myNum === 1 ? salonState.hote_pseudo : salonState.invite_pseudo; e.winCells = wc; }
                    e.tour = salonState.role === 'hote' ? 'invite' : 'hote';
                    await syncSalon({
                        etat_jeu: e,
                        termine: !!e.gagnant,
                        pts_hote: e.gagnant === salonState.hote_pseudo ? 180 : 60,
                        pts_invite: e.gagnant === salonState.invite_pseudo ? 180 : 60
                    });
                });
            }
            return;
        }

        useDomMode('Clique sur une colonne pour déposer ton jeton rouge et aligner 4 jetons !');
        const grid = Array.from({ length: 6 }, () => Array(7).fill(0));
        let winSet = new Set();
        function drop(col, p) { for (let r = 5; r >= 0; r--) if (!grid[r][col]) { grid[r][col] = p; return true; } return false; }
        function render() {
            domArea.innerHTML = `<div class="c4-grid">${grid.flatMap((row, r) => row.map((v, c) =>
                `<div class="c4-cell ${winSet.has(`${r}-${c}`) ? 'win-glow' : ''}" data-c="${c}" style="background:${v===1?'#ef4444':v===2?'#fbbf24':'#0b0e1a'}"></div>`)).join('')}</div>`;
            domArea.querySelectorAll('.c4-cell').forEach(el => el.onclick = () => {
                if (finished || !drop(+el.dataset.c, 1)) return;
                playSound('pop');
                const w1 = getWinCells(grid, 1);
                if (w1) { winSet = new Set(w1); render(); return finishGame(180, 'Puissance 4 ! Victoire !'); }

                // IA tactique : gagne si possible, sinon bloque le joueur, sinon joue au centre
                const cols = [3, 2, 4, 1, 5, 0, 6].filter(c => !grid[0][c]);
                let chosen = cols[0];
                for (const pCheck of [2, 1]) {
                    for (const c of cols) {
                        const copy = grid.map(r => [...r]);
                        for (let r = 5; r >= 0; r--) if (!copy[r][c]) { copy[r][c] = pCheck; break; }
                        if (getWinCells(copy, pCheck)) { chosen = c; break; }
                    }
                }
                if (chosen !== undefined) drop(chosen, 2);
                const w2 = getWinCells(grid, 2);
                if (w2) { winSet = new Set(w2); render(); return finishGame(35, 'L\'IA aligne 4 jetons !'); }
                render();
            });
        }
        render();
    },

    // 11. MORPION PRO PLATO (IA intelligente + surbrillance de la ligne gagnante + PvP)
    'morpion'() {
        const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
        const getWinLine = (b, s) => lines.find(l => l.every(i => b[i] === s)) || null;

        if (SALON && salonState) {
            useDomMode('Morpion en ligne : X (Hôte) vs O (Invité)');
            const e = salonState.etat_jeu;
            const mySym = salonState.role === 'hote' ? 'X' : 'O';
            const myTurn = e.tour === salonState.role && !e.gagnant;
            const wl = new Set(e.winLine || []);
            domArea.innerHTML = `
                <p style="color:#fbbf24;font-weight:700;">${e.gagnant ? '🏆 ' + e.gagnant : (myTurn ? 'À toi (' + mySym + ')' : 'Tour de ton ami...')}</p>
                <div class="ttt-grid">${e.board.map((v, i) => `<div class="ttt-cell ${wl.has(i) ? 'win-glow' : ''}" data-i="${i}" style="color:${v==='X'?'#38bdf8':'#f43f5e'}">${v}</div>`).join('')}</div>
            `;
            if (myTurn) {
                domArea.querySelectorAll('.ttt-cell').forEach(el => el.onclick = async () => {
                    const i = +el.dataset.i;
                    if (e.board[i]) return;
                    e.board[i] = mySym; playSound('pop');
                    let done = false;
                    const wlFound = getWinLine(e.board, mySym);
                    if (wlFound) { e.gagnant = (mySym === 'X' ? salonState.hote_pseudo : salonState.invite_pseudo) + ' gagne !'; e.winLine = wlFound; done = true; }
                    else if (!e.board.includes('')) { e.gagnant = 'Match nul !'; done = true; }
                    e.tour = salonState.role === 'hote' ? 'invite' : 'hote';
                    await syncSalon({
                        etat_jeu: e,
                        termine: done,
                        pts_hote: e.gagnant && e.gagnant.startsWith(salonState.hote_pseudo) ? 150 : 60,
                        pts_invite: e.gagnant && e.gagnant.startsWith(salonState.invite_pseudo) ? 150 : 60
                    });
                });
            }
            return;
        }

        useDomMode('Aligne 3 symboles X pour battre l\'IA !');
        const b = Array(9).fill('');
        let wl = new Set();
        function render() {
            domArea.innerHTML = `<div class="ttt-grid">${b.map((v, i) => `<div class="ttt-cell ${wl.has(i) ? 'win-glow' : ''}" data-i="${i}" style="color:${v==='X'?'#38bdf8':'#f43f5e'}">${v}</div>`).join('')}</div>`;
            domArea.querySelectorAll('.ttt-cell').forEach(el => el.onclick = () => {
                const i = +el.dataset.i; if (b[i] || finished) return;
                b[i] = 'X'; playSound('pop');
                const w1 = getWinLine(b, 'X');
                if (w1) { wl = new Set(w1); render(); return finishGame(130, 'Victoire au Morpion !'); }
                const free = b.map((v, idx) => v === '' ? idx : -1).filter(x => x >= 0);
                if (!free.length) { render(); return finishGame(60, 'Match nul !'); }

                // IA intelligente : gagne, bloque, ou prend le centre
                let move = free.includes(4) ? 4 : free[Math.floor(Math.random() * free.length)];
                for (const sym of ['O', 'X']) {
                    for (const idx of free) {
                        const test = [...b]; test[idx] = sym;
                        if (getWinLine(test, sym)) { move = idx; break; }
                    }
                }
                b[move] = 'O';
                const w2 = getWinLine(b, 'O');
                if (w2) { wl = new Set(w2); render(); return finishGame(30, 'Défaite au Morpion !'); }
                render();
            });
        }
        render();
    },

    // 12. PINBALL ARCADE PLATO (3 billes, slingshots, multiplicateur x2/x3, bumpers lumineux)
    'pinball'() {
        hint.textContent = 'Flèches Gauche/Droite (ou clic gauche/droit) pour actionner les flippers (3 billes) !';
        let ball = { x: 430, y: 85, vx: 3.5, vy: 2 }, score = 0, ballsLeft = 3, mult = 1, leftUp = false, rightUp = false;
        const bumpers = [{ x: 290, y: 145, hit: 0 }, { x: 470, y: 145, hit: 0 }, { x: 380, y: 215, hit: 0 }, { x: 250, y: 265, hit: 0 }, { x: 510, y: 265, hit: 0 }];

        window.onkeydown = e => {
            if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
            if (e.key === 'ArrowLeft') leftUp = true;
            if (e.key === 'ArrowRight') rightUp = true;
        };
        window.onkeyup = e => {
            if (e.key === 'ArrowLeft') leftUp = false;
            if (e.key === 'ArrowRight') rightUp = false;
        };
        canvas.onmousedown = e => { const m = getMousePos(e); if (m.x < 380) leftUp = true; else rightUp = true; };
        canvas.onmouseup = () => { leftUp = false; rightUp = false; };

        (function loop() {
            ctx.fillStyle = '#1e1b4b'; ctx.fillRect(0, 0, 760, 460);
            ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 5; ctx.strokeRect(165, 16, 430, 444);

            // Couloirs bonus haut
            [250, 380, 510].forEach((lx, i) => {
                ctx.fillStyle = mult > i + 1 ? '#10b981' : '#312e81';
                ctx.fillRect(lx - 18, 28, 36, 12);
                if (Math.abs(ball.x - lx) < 20 && ball.y < 46) { mult = Math.min(3, mult + 1); playSound('score'); }
            });

            ball.vy += 0.24; ball.x += ball.vx; ball.y += ball.vy;
            if (ball.x < 178) { ball.x = 178; ball.vx *= -0.92; playSound('hit'); }
            if (ball.x > 582) { ball.x = 582; ball.vx *= -0.92; playSound('hit'); }
            if (ball.y < 28) { ball.y = 28; ball.vy *= -0.9; playSound('hit'); }

            // Guides obliques vers flippers
            if (ball.y > 320 && ball.x < 250) { ball.vx = Math.abs(ball.vx) + 2; ball.vy = -6; playSound('hit'); }
            if (ball.y > 320 && ball.x > 510) { ball.vx = -Math.abs(ball.vx) - 2; ball.vy = -6; playSound('hit'); }

            bumpers.forEach(bp => {
                if (bp.hit > 0) bp.hit--;
                ctx.fillStyle = bp.hit > 0 ? '#fbbf24' : '#ec4899';
                ctx.beginPath(); ctx.arc(bp.x, bp.y, bp.hit > 0 ? 26 : 22, 0, Math.PI * 2); ctx.fill();
                const d = Math.hypot(ball.x - bp.x, ball.y - bp.y);
                if (d < 34 && d > 0) {
                    ball.vx = ((ball.x - bp.x) / d) * 9;
                    ball.vy = ((ball.y - bp.y) / d) * 9;
                    score += 30 * mult; bp.hit = 8; playSound('pop');
                }
            });

            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(250, leftUp ? 375 : 400, 102, 14);
            ctx.fillRect(408, rightUp ? 375 : 400, 102, 14);
            if (ball.y > 375 && ball.y < 415 && ((ball.x > 245 && ball.x < 355 && leftUp) || (ball.x > 405 && ball.x < 515 && rightUp))) {
                ball.vy = -12.5; ball.vx += (Math.random() - 0.5) * 6; playSound('hit');
            }

            ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ball.x, ball.y, 11, 0, Math.PI * 2); ctx.fill();
            ctx.font = 'bold 17px sans-serif';
            ctx.fillText(`Score : ${score}`, 20, 38);
            ctx.fillText(`Billes : ${ballsLeft} · x${mult}`, 20, 64);

            if (ball.y > 465) {
                ballsLeft--; mult = 1; playSound('lose');
                if (ballsLeft <= 0) finishGame(Math.max(30, Math.min(320, Math.floor(score / 4))), `Pinball terminé : ${score} pts !`);
                else ball = { x: 350 + Math.random() * 80, y: 80, vx: (Math.random() - 0.5) * 6, vy: 2 };
            }
            if (!finished) requestAnimationFrame(loop);
        })();
    },

    // 13. COURSE TURBO PLATO (4 voies, pièces d'or, bouclier, nitro)
    'course-voiture'() {
        hint.textContent = 'Flèches Gauche/Droite pour changer de voie · Flèche Haut pour le Turbo !';
        let lane = 1, items = [], dist = 0, coins = 0, shield = false, speed = 6.5, turbo = false;
        const lanes = [245, 335, 425, 515];

        window.onkeydown = e => {
            if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
            if (e.key === 'ArrowLeft' && lane > 0) { lane--; playSound('pop'); }
            if (e.key === 'ArrowRight' && lane < 3) { lane++; playSound('pop'); }
            if (e.key === 'ArrowUp') turbo = true;
        };
        window.onkeyup = e => { if (e.key === 'ArrowUp') turbo = false; };

        (function loop() {
            ctx.fillStyle = '#064e3b'; ctx.fillRect(0, 0, 760, 460);
            ctx.fillStyle = '#1f2937'; ctx.fillRect(195, 0, 370, 460);
            ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 2; ctx.setLineDash([16, 14]);
            [290, 380, 470].forEach(lx => { ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, 460); ctx.stroke(); });
            ctx.setLineDash([]);

            const curSpeed = turbo ? speed * 1.45 : speed;
            dist += turbo ? 2 : 1;
            if (dist % 36 === 0) {
                const r = Math.random();
                const type = r < 0.72 ? 'car' : (r < 0.93 ? 'coin' : 'shield');
                items.push({ lane: Math.floor(Math.random() * 4), y: -60, type });
                speed = Math.min(13, speed + 0.12);
            }

            // Voiture joueur
            const px = lanes[lane];
            if (turbo) { ctx.fillStyle = '#f97316'; ctx.fillRect(px - 10, 422, 20, 18); }
            ctx.fillStyle = '#38bdf8'; ctx.fillRect(px - 20, 355, 40, 68);
            ctx.fillStyle = '#0f172a'; ctx.fillRect(px - 14, 370, 28, 16);
            if (shield) { ctx.strokeStyle = '#34d399'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(px, 389, 44, 0, Math.PI * 2); ctx.stroke(); }

            items.forEach(it => {
                it.y += curSpeed;
                const ix = lanes[it.lane];
                if (it.type === 'car') {
                    ctx.fillStyle = '#ef4444'; ctx.fillRect(ix - 20, it.y, 40, 68);
                    ctx.fillStyle = '#fef08a'; ctx.fillRect(ix - 15, it.y + 62, 8, 5); ctx.fillRect(ix + 7, it.y + 62, 8, 5);
                } else if (it.type === 'coin') {
                    ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(ix, it.y + 20, 13, 0, Math.PI * 2); ctx.fill();
                } else {
                    ctx.fillStyle = '#10b981'; ctx.beginPath(); ctx.arc(ix, it.y + 20, 14, 0, Math.PI * 2); ctx.fill();
                }

                if (!it.done && it.lane === lane && it.y + 55 > 355 && it.y < 415) {
                    it.done = true;
                    if (it.type === 'coin') { coins++; it.y = 600; playSound('score'); }
                    else if (it.type === 'shield') { shield = true; it.y = 600; playSound('score'); }
                    else if (shield) { shield = false; it.y = 600; playSound('hit'); }
                    else {
                        finishGame(Math.min(260, Math.floor(dist / 7) + coins * 12), `${Math.floor(dist / 10)} m parcourus + ${coins} pièces !`);
                    }
                }
            });

            ctx.fillStyle = '#fff'; ctx.font = 'bold 17px sans-serif';
            ctx.fillText(`Distance : ${Math.floor(dist / 10)} m`, 20, 36);
            ctx.fillText(`🪙 Pièces : ${coins}`, 20, 62);
            if (!finished) requestAnimationFrame(loop);
        })();
    },

    // 14. SNAKE NEON PLATO (Orbes normaux + Orbes dorés bonus + grille néon)
    'snake-neon'() {
        hint.textContent = 'Flèches directionnelles pour guider le serpent et attraper les orbes dorés !';
        let snake = [{ x: 10, y: 11 }, { x: 9, y: 11 }], dir = { x: 1, y: 0 };
        let food = { x: 16, y: 11 }, gold = { x: 24, y: 7, timer: 90 }, pts = 0, tick = 0;

        window.onkeydown = e => {
            if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
            if (e.key === 'ArrowUp' && dir.y === 0) dir = { x: 0, y: -1 };
            if (e.key === 'ArrowDown' && dir.y === 0) dir = { x: 0, y: 1 };
            if (e.key === 'ArrowLeft' && dir.x === 0) dir = { x: -1, y: 0 };
            if (e.key === 'ArrowRight' && dir.x === 0) dir = { x: 1, y: 0 };
        };

        (function loop() {
            tick++;
            if (tick % 6 === 0) {
                const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
                if (head.x < 0 || head.x >= 38 || head.y < 0 || head.y >= 23 || snake.some(s => s.x === head.x && s.y === head.y)) {
                    finishGame(pts + 15, `Snake Neon terminé : ${pts} pts !`); return;
                }
                snake.unshift(head);
                if (head.x === food.x && head.y === food.y) {
                    pts += 15; playSound('pop');
                    food = { x: Math.floor(Math.random() * 38), y: Math.floor(Math.random() * 23) };
                } else if (gold && head.x === gold.x && head.y === gold.y) {
                    pts += 45; playSound('score');
                    gold = { x: Math.floor(Math.random() * 38), y: Math.floor(Math.random() * 23), timer: 110 };
                } else {
                    snake.pop();
                }
                if (gold) {
                    gold.timer--;
                    if (gold.timer <= 0) gold = { x: Math.floor(Math.random() * 38), y: Math.floor(Math.random() * 23), timer: 110 };
                }
            }

            ctx.fillStyle = '#090d16'; ctx.fillRect(0, 0, 760, 460);
            ctx.fillStyle = '#f43f5e'; ctx.beginPath(); ctx.arc(food.x * 20 + 10, food.y * 20 + 10, 8, 0, Math.PI * 2); ctx.fill();
            if (gold) {
                ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(gold.x * 20 + 10, gold.y * 20 + 10, 9, 0, Math.PI * 2); ctx.fill();
            }
            snake.forEach((s, idx) => {
                ctx.fillStyle = idx === 0 ? '#4ade80' : '#16a34a';
                ctx.fillRect(s.x * 20 + 1, s.y * 20 + 1, 18, 18);
            });
            ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif'; ctx.fillText(`Score : ${pts} pts`, 16, 26);
            if (!finished) requestAnimationFrame(loop);
        })();
    },

    // 15. CASSE-BRIQUES PLATO (Briques blindées + bonus Raquette Large & Multi-Balle + 3 vies)
    'casse-briques'() {
        hint.textContent = 'Déplace la souris pour casser toutes les briques et attraper les bonus !';
        let px = 320, pw = 115, lives = 3, score = 0;
        let balls = [{ x: 380, y: 310, vx: 4.8, vy: -5.2 }], bricks = [], powerups = [];
        const rowColors = ['#ec4899', '#a855f7', '#6366f1', '#38bdf8', '#10b981'];
        for (let r = 0; r < 5; r++) for (let c = 0; c < 9; c++) {
            bricks.push({ x: 45 + c * 76, y: 48 + r * 28, hp: r === 0 ? 2 : 1, color: rowColors[r] });
        }

        canvas.onmousemove = e => { px = Math.max(10, Math.min(750 - pw, getMousePos(e).x - pw / 2)); };

        (function loop() {
            ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, 760, 460);

            bricks.forEach(br => {
                if (br.hp <= 0) return;
                ctx.fillStyle = br.hp === 2 ? '#fbbf24' : br.color;
                ctx.fillRect(br.x, br.y, 68, 20);
            });

            powerups.forEach(pu => {
                pu.y += 3.2;
                ctx.fillStyle = pu.type === 'wide' ? '#38bdf8' : '#f59e0b';
                ctx.fillRect(pu.x - 14, pu.y - 8, 28, 16);
                if (!pu.done && pu.y > 410 && pu.y < 435 && pu.x > px && pu.x < px + pw) {
                    pu.done = true; pu.y = 500; playSound('score');
                    if (pu.type === 'wide') pw = Math.min(180, pw + 40);
                    else balls.push({ x: px + pw / 2, y: 405, vx: -4.5, vy: -5.5 });
                }
            });

            balls.forEach(b => {
                b.x += b.vx; b.y += b.vy;
                if (b.x < 10 || b.x > 750) { b.vx *= -1; playSound('hit'); }
                if (b.y < 10) { b.vy *= -1; playSound('hit'); }
                if (b.y > 412 && b.y < 432 && b.x > px && b.x < px + pw && b.vy > 0) {
                    b.vy = -Math.abs(b.vy);
                    b.vx = ((b.x - (px + pw / 2)) / (pw / 2)) * 6.5;
                    playSound('hit');
                }
                bricks.forEach(br => {
                    if (br.hp <= 0) return;
                    if (b.x + 8 > br.x && b.x - 8 < br.x + 68 && b.y + 8 > br.y && b.y - 8 < br.y + 20) {
                        br.hp--; b.vy *= -1; score += 12; playSound('pop');
                        if (br.hp === 0 && Math.random() < 0.28) {
                            powerups.push({ x: br.x + 34, y: br.y, type: Math.random() < 0.5 ? 'wide' : 'multi' });
                        }
                    }
                });
                ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(b.x, b.y, 9, 0, Math.PI * 2); ctx.fill();
            });

            balls = balls.filter(b => b.y <= 465);
            if (balls.length === 0) {
                lives--; pw = 115; playSound('lose');
                if (lives <= 0) return finishGame(Math.max(25, Math.floor(score / 2)), `Partie terminée : ${score} pts !`);
                balls = [{ x: px + pw / 2, y: 395, vx: 4.5, vy: -5.2 }];
            }

            ctx.fillStyle = '#38bdf8'; ctx.fillRect(px, 420, pw, 14);
            ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif';
            ctx.fillText(`Vies : ${'❤️'.repeat(lives)} · Score : ${score}`, 20, 28);

            if (bricks.every(br => br.hp <= 0)) finishGame(230, 'Toutes les briques détruites !');
            if (!finished) requestAnimationFrame(loop);
        })();
    },

    // 16. PLUS OU MOINS PLATO (Radar thermique Glacial/Froid/Tiède/Chaud/Brûlant + historique)
    'plus-ou-moins'() {
        useDomMode('Trouve le nombre mystère (1 à 100) en 7 essais grâce au radar thermique !');
        const target = Math.floor(Math.random() * 100) + 1;
        let tries = 0, history = [];

        function getHeat(diff) {
            if (diff <= 3) return { label: '🔥 BRÛLANT !', color: '#ef4444' };
            if (diff <= 10) return { label: '♨️ Très chaud', color: '#f97316' };
            if (diff <= 22) return { label: '☀️ Tiède', color: '#eab308' };
            return { label: '❄️ Glacial', color: '#38bdf8' };
        }

        function render() {
            domArea.innerHTML = `
                <div class="plato-hud-bar">
                    <span>Essais : <strong>${tries}/7</strong></span>
                    <span>·</span>
                    <span>Intervalle : <strong>1 – 100</strong></span>
                </div>
                <div style="display:flex;gap:10px;">
                    <input id="pomIn" class="form-control" type="number" min="1" max="100" placeholder="1-100" style="width:140px;text-align:center;font-weight:800;">
                    <button id="pomBtn" class="btn btn-primary">Tester</button>
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;max-width:480px;">
                    ${history.map(h => `<span style="background:#1b223c;border:1px solid ${h.color};color:${h.color};padding:6px 12px;border-radius:10px;font-weight:700;font-size:0.85rem;">${h.val} ${h.arrow} (${h.label})</span>`).join('')}
                </div>
            `;
            const submit = () => {
                const v = +document.getElementById('pomIn').value;
                if (!v || v < 1 || v > 100 || finished) return;
                tries++;
                if (v === target) return finishGame(Math.max(50, 210 - tries * 20), `Nombre mystère (${target}) trouvé en ${tries} essai(s) !`);
                const heat = getHeat(Math.abs(target - v));
                history.push({ val: v, arrow: v < target ? '⬆️ Plus' : '⬇️ Moins', label: heat.label, color: heat.color });
                playSound('pop');
                if (tries >= 7) return finishGame(25, `Perdu ! Le nombre était ${target}.`);
                render();
            };
            document.getElementById('pomBtn').onclick = submit;
            document.getElementById('pomIn').onkeydown = e => { if (e.key === 'Enter') submit(); };
            document.getElementById('pomIn').focus();
        }
        render();
    },

    // 17. PIERRE FEUILLE CISEAUX PLATO (Barres de vie 100 PV, icônes géantes, Solo & PvP)
    'pfc'() {
        const coups = [
            { name: 'Pierre', icon: '✊' },
            { name: 'Feuille', icon: '✋' },
            { name: 'Ciseaux', icon: '✌️' }
        ];

        if (SALON && salonState) {
            useDomMode('Duel Pierre-Feuille-Ciseaux en ligne (100 PV chacun) !');
            const e = salonState.etat_jeu;
            const hpH = e.hp_hote ?? 100, hpI = e.hp_invite ?? 100;
            const myChoice = salonState.role === 'hote' ? e.choix_hote : e.choix_invite;
            domArea.innerHTML = `
                <div class="plato-hud-bar">
                    <div><strong>${salonState.hote_pseudo}</strong><div class="hp-bar"><div class="hp-fill" style="width:${hpH}%;background:#38bdf8;"></div></div></div>
                    <span>VS</span>
                    <div><strong>${salonState.invite_pseudo}</strong><div class="hp-bar"><div class="hp-fill" style="width:${hpI}%;background:#f43f5e;"></div></div></div>
                </div>
                <p style="color:#fbbf24;font-weight:700;">${e.info}</p>
                ${e.gagnant ? `<h3>🏆 ${e.gagnant} remporte le combat !</h3>` :
                    (myChoice ? `<p>Ton attaque (<strong>${myChoice}</strong>) est prête ! En attente de ton ami...</p>` :
                    `<div style="display:flex;gap:14px;">${coups.map(c => `<button class="btn btn-primary" data-c="${c.name}" style="font-size:1.2rem;padding:14px 20px;">${c.icon} ${c.name}</button>`).join('')}</div>`)}
            `;
            domArea.querySelectorAll('button').forEach(btn => btn.onclick = async () => {
                playSound('pop');
                if (salonState.role === 'hote') e.choix_hote = btn.dataset.c;
                else e.choix_invite = btn.dataset.c;

                if (e.choix_hote && e.choix_invite) {
                    const h = e.choix_hote, i = e.choix_invite;
                    if (h === i) e.info = `Égalité (${h} vs ${i}) ! Aucun dégât.`;
                    else if ((h==='Pierre'&&i==='Ciseaux')||(h==='Feuille'&&i==='Pierre')||(h==='Ciseaux'&&i==='Feuille')) {
                        e.hp_invite = Math.max(0, hpI - 34);
                        e.info = `${salonState.hote_pseudo} frappe avec ${h} (-34 PV) !`;
                    } else {
                        e.hp_hote = Math.max(0, hpH - 34);
                        e.info = `${salonState.invite_pseudo} frappe avec ${i} (-34 PV) !`;
                    }
                    e.choix_hote = null; e.choix_invite = null;
                    if (e.hp_invite <= 0) e.gagnant = salonState.hote_pseudo;
                    if (e.hp_hote <= 0) e.gagnant = salonState.invite_pseudo;
                }
                await syncSalon({
                    etat_jeu: e,
                    termine: !!e.gagnant,
                    pts_hote: e.gagnant === salonState.hote_pseudo ? 160 : 50,
                    pts_invite: e.gagnant === salonState.invite_pseudo ? 160 : 50
                });
            });
            return;
        }

        useDomMode('Bats l\'IA en réduisant ses 100 PV à zéro !');
        let hpP = 100, hpA = 100, msg = 'Choisis ton attaque :', duelView = '🤜 🆚 🤛';
        function render() {
            domArea.innerHTML = `
                <div class="plato-hud-bar">
                    <div><strong>Toi (${hpP} PV)</strong><div class="hp-bar"><div class="hp-fill" style="width:${hpP}%;background:#38bdf8;"></div></div></div>
                    <span style="font-size:1.6rem;">${duelView}</span>
                    <div><strong>IA (${hpA} PV)</strong><div class="hp-bar"><div class="hp-fill" style="width:${hpA}%;background:#f43f5e;"></div></div></div>
                </div>
                <p style="color:#fbbf24;font-weight:700;">${msg}</p>
                <div style="display:flex;gap:14px;">${coups.map(c => `<button class="btn btn-primary" data-c="${c.name}" style="font-size:1.15rem;padding:13px 18px;">${c.icon} ${c.name}</button>`).join('')}</div>
            `;
            domArea.querySelectorAll('button').forEach(btn => btn.onclick = () => {
                const p = coups.find(x => x.name === btn.dataset.c);
                const a = coups[Math.floor(Math.random() * 3)];
                duelView = `${p.icon} 🆚 ${a.icon}`;
                if (p.name === a.name) { msg = `Égalité (${p.name}) !`; playSound('hit'); }
                else if ((p.name==='Pierre'&&a.name==='Ciseaux')||(p.name==='Feuille'&&a.name==='Pierre')||(p.name==='Ciseaux'&&a.name==='Feuille')) {
                    hpA = Math.max(0, hpA - 34); msg = `Touché ! ${p.name} bat ${a.name} (-34 PV)`; playSound('score');
                } else {
                    hpP = Math.max(0, hpP - 34); msg = `Aïe ! ${a.name} bat ${p.name} (-34 PV)`; playSound('lose');
                }
                render();
                if (hpA <= 0) finishGame(160, 'K.O. ! Tu remportes le combat !');
                else if (hpP <= 0) finishGame(35, 'K.O. ! L\'IA remporte le combat !');
            });
        }
        render();
    },

    // 18. QUIZ CULTURE GEEK PLATO (Chrono 12s, Bonus rapidité, Joker 50/50, 8 questions variées)
    'quiz-geek'() {
        useDomMode('Réponds vite aux 8 questions : plus tu es rapide, plus tu gagnes de points !');
        const bank = [
            { q: 'Quel port réseau utilise HTTPS par défaut ?', a: ['80', '443', '22', '3306'], ok: 1 },
            { q: 'Quelle commande Docker affiche les conteneurs en cours d\'exécution ?', a: ['docker ps', 'docker init', 'docker build', 'docker pull'], ok: 0 },
            { q: 'Quelle requête SQL permet de supprimer des lignes d\'une table ?', a: ['DROP', 'REMOVE', 'DELETE', 'TRUNCATE'], ok: 2 },
            { q: 'Dans Minecraft, combien de blocs d\'obsidienne faut-il au minimum pour un portail du Nether ?', a: ['8', '10', '12', '14'], ok: 1 },
            { q: 'Quel protocole attribue automatiquement une adresse IP sur un réseau local ?', a: ['DNS', 'ARP', 'DHCP', 'ICMP'], ok: 2 },
            { q: 'Quel langage s\'exécute nativement dans tous les navigateurs web ?', a: ['PHP', 'Python', 'JavaScript', 'C#'], ok: 2 },
            { q: 'Quelle commande Git permet de récupérer les dernières modifications distantes ?', a: ['git push', 'git pull', 'git commit', 'git status'], ok: 1 },
            { q: 'Quel composant stocke temporairement les données actives d\'un PC ?', a: ['SSD NVMe', 'RAM', 'Carte mère', 'Alimentation'], ok: 1 },
            { q: 'Quel code HTTP indique qu\'une page est introuvable ?', a: ['200', '301', '403', '404'], ok: 3 },
            { q: 'Quel studio a développé Grand Theft Auto V ?', a: ['Ubisoft', 'Rockstar Games', 'Electronic Arts', 'Valve'], ok: 1 }
        ].sort(() => Math.random() - 0.5).slice(0, 8);

        let idx = 0, score = 0, good = 0, timeLeft = 12, jokerUsed = false, hiddenOpts = [], timerId = null;

        function startTimer() {
            clearInterval(timerId);
            timeLeft = 12;
            timerId = setInterval(() => {
                if (finished) return clearInterval(timerId);
                timeLeft -= 0.2;
                const bar = document.getElementById('quizTimerBar');
                if (bar) bar.style.width = `${Math.max(0, (timeLeft / 12) * 100)}%`;
                if (timeLeft <= 0) {
                    clearInterval(timerId);
                    playSound('lose');
                    idx++; hiddenOpts = []; render();
                }
            }, 200);
        }

        function render() {
            clearInterval(timerId);
            if (idx >= bank.length) return finishGame(Math.max(30, score), `Quiz terminé : ${good}/${bank.length} bonnes réponses (${score} pts) !`);
            const cur = bank[idx];
            domArea.innerHTML = `
                <div class="plato-hud-bar">
                    <span>Question <strong>${idx + 1}/${bank.length}</strong></span>
                    <span>·</span>
                    <span>Score : <strong>${score} pts</strong></span>
                    ${!jokerUsed ? '<button id="joker5050" class="btn btn-ghost" style="padding:4px 10px;font-size:0.78rem;">⚡ 50/50</button>' : ''}
                </div>
                <div class="timer-track"><div class="timer-fill" id="quizTimerBar" style="width:100%;"></div></div>
                <h3 style="max-width:520px;">${cur.q}</h3>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%;max-width:480px;">
                    ${cur.a.map((ans, i) => hiddenOpts.includes(i) ? '<div></div>' : `<button class="btn btn-ghost" data-i="${i}" style="padding:12px;">${ans}</button>`).join('')}
                </div>
            `;
            if (!jokerUsed) {
                document.getElementById('joker5050').onclick = () => {
                    jokerUsed = true; playSound('pop');
                    const wrongs = [0, 1, 2, 3].filter(i => i !== cur.ok).sort(() => Math.random() - 0.5);
                    hiddenOpts = wrongs.slice(0, 2);
                    render();
                };
            }
            domArea.querySelectorAll('button[data-i]').forEach(b => b.onclick = () => {
                clearInterval(timerId);
                if (+b.dataset.i === cur.ok) {
                    good++;
                    score += 18 + Math.round(timeLeft * 1.5);
                    playSound('score');
                } else {
                    playSound('lose');
                }
                idx++; hiddenOpts = []; render();
            });
            startTimer();
        }
        render();
    }
};

const domPvpSlugs = ['morpion', 'puissance-4', 'pfc', 'ludo', 'uno'];
const canvasPvpSlugs = ['foot-soccer', 'billard'];
let gameBooted = false;

async function pollSalon() {
    const res = await fetch(`api/salon.php?action=etat&code=${encodeURIComponent(SALON)}`);
    const data = await res.json();
    if (!data.ok) return;
    salonState = data;

    playersStatus.innerHTML = `👑 ${data.hote_pseudo} (${data.score_hote}) &nbsp;vs&nbsp; 🎮 ${data.invite_pseudo || 'En attente...'} (${data.score_invite})`;

    if (data.statut === 'attente') {
        waitingRoom.style.display = 'flex';
        canvas.style.display = 'none';
        domArea.style.display = 'none';
        return;
    }

    waitingRoom.style.display = 'none';
    const slug = window.GAME_CONFIG.slug;

    if (domPvpSlugs.includes(slug)) {
        games[slug]();
    } else if (!gameBooted) {
        gameBooted = true;
        canvas.style.display = 'block';
        games[slug]();
    }

    if (data.statut === 'termine' && !domPvpSlugs.includes(slug) && !canvasPvpSlugs.includes(slug)) {
        victoryBox.style.display = 'block';
        victoryBox.innerHTML = `<h2>🏆 Duel terminé !</h2><p>👑 ${data.hote_pseudo} : <strong>${data.score_hote} pts</strong> vs 🎮 ${data.invite_pseudo} : <strong>${data.score_invite} pts</strong></p><a href="index.php" class="btn btn-primary" style="margin-top:10px;">Retour au lobby</a>`;
    }
}

if (SALON) {
    canvas.style.display = 'none';
    pollSalon();
    setInterval(pollSalon, 1000);
} else if (games[window.GAME_CONFIG.slug]) {
    games[window.GAME_CONFIG.slug]();
}