'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800', '900'], display: 'swap' });

// "Dominate Organic Search" landing — Redesign v2 port. Static HTML body rendered
// via dangerouslySetInnerHTML; nav toggle + Start/Login CTAs wired in useEffect.
const CSS = `


:root{
  --green:#063d20; --green2:#0b5b2f; --green3:#118447;
  --lime:#b7ef73; --orange:#ff6b1a; --cream:#f5f1e8; --paper:#fffdf8;
  --ink:#101510; --muted:#657067; --line:#dfe4dc;
  --white:#fff; --shadow:0 20px 60px rgba(4,45,23,.12);
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--ink);background:var(--paper);overflow-x:hidden}
a{color:inherit;text-decoration:none}
button{font:inherit}
.container{width:min(1180px,calc(100% - 40px));margin:auto}
h1,h2,h3,h4,p{margin:0}
h1,h2,h3,h4{letter-spacing:-.055em}
.btn{display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:999px;padding:14px 20px;font-weight:800;font-size:13px;cursor:pointer;transition:.2s}
.btn-orange{background:var(--orange);color:white;box-shadow:0 9px 24px rgba(255,107,26,.22)}
.btn-white{background:white;border:1px solid var(--line)}
.btn:hover{transform:translateY(-2px)}
.eyebrow{font-size:10px;letter-spacing:3px;text-transform:uppercase;font-weight:900;color:var(--orange);margin-bottom:15px}
/* NAV */
.nav{position:fixed;z-index:50;top:16px;left:50%;transform:translateX(-50%);width:min(1160px,calc(100% - 28px));height:60px;padding:8px 9px 8px 18px;background:rgba(255,253,248,.86);backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,.8);border-radius:999px;box-shadow:0 10px 35px rgba(0,0,0,.08);display:flex;align-items:center;justify-content:space-between}
.logo{width:152px;height:auto;display:block}
.navlinks{display:flex;gap:23px;font-size:12px;font-weight:700;color:#4b554e}
.navlinks a:hover{color:var(--green)}
.navbtn{padding:11px 17px}
.menu{display:none;background:none;border:0;font-size:21px}
/* HERO */
.hero{min-height:790px;background:var(--green);color:white;position:relative;overflow:hidden;padding:158px 0 115px}
.hero:before{content:"";position:absolute;width:700px;height:700px;border-radius:50%;right:-190px;top:-250px;background:radial-gradient(circle,rgba(183,239,115,.2),transparent 64%)}
.hero:after{content:"";position:absolute;left:-8%;right:-8%;bottom:-290px;height:420px;background:var(--paper);border-radius:50% 50% 0 0/45% 45% 0 0}
.hero-grid{position:relative;z-index:2;display:grid;grid-template-columns:1.04fr .96fr;gap:55px;align-items:center}
.kicker{font-size:10px;letter-spacing:3px;font-weight:900;color:var(--lime);margin-bottom:21px}
.hero h1{font-size:clamp(58px,8vw,103px);line-height:.84;letter-spacing:-6px;max-width:760px}
.hero h1 span{color:var(--lime)}
.hero-copy{font-size:18px;line-height:1.55;color:#d9e7dc;max-width:600px;margin-top:28px}
.hero-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:32px}
.hero-secondary{border:1px solid rgba(255,255,255,.3);color:white;padding:13px 19px;border-radius:999px;font-size:13px;font-weight:800;background:rgba(255,255,255,.06)}
.micro{font-size:11px;color:#aebfb3;margin-top:14px}
.hero-art{position:relative;height:460px}
.search-card{position:absolute;top:22px;right:0;width:min(475px,100%);background:white;color:var(--ink);border-radius:25px;padding:14px;box-shadow:0 35px 80px rgba(0,0,0,.28);transform:rotate(2deg);animation:float 5s ease-in-out infinite}
@keyframes float{50%{transform:rotate(-1deg) translateY(-9px)}}
.googlebar{height:44px;border:1px solid #ddd;border-radius:22px;display:flex;align-items:center;padding:0 15px;gap:10px;font-size:12px;color:#777}
.gdot{width:9px;height:9px;border-radius:50%;background:var(--orange)}
.search-result{border:1px solid #e8ece7;border-radius:17px;margin-top:11px;padding:17px}
.search-result small{font-size:9px;color:#778078;font-weight:800;letter-spacing:1px}
.search-result h3{font-size:20px;color:var(--green2);margin-top:8px}
.search-result p{font-size:11px;color:#69736c;line-height:1.5;margin-top:6px}
.tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:11px}
.tag{font-size:9px;background:#edf6eb;color:var(--green2);padding:6px 8px;border-radius:999px;font-weight:800}
.patient-card{position:absolute;left:0;bottom:35px;background:var(--lime);color:var(--green);border-radius:20px;padding:17px 19px;width:220px;box-shadow:0 22px 50px rgba(0,0,0,.2);transform:rotate(-5deg)}
.patient-card small{font-size:9px;letter-spacing:2px;font-weight:900}
.patient-card strong{display:block;font-size:24px;line-height:1.02;letter-spacing:-1px;margin-top:8px}
/* MARQUEE */
.marquee{border-top:1px solid var(--line);border-bottom:1px solid var(--line);overflow:hidden;white-space:nowrap;padding:17px 0;background:#f1eee5}
.track{display:flex;width:max-content;animation:marquee 24s linear infinite;font-weight:900;letter-spacing:1.7px;font-size:10px;color:var(--green)}
.mq{display:inline-flex;align-items:center;gap:31px;padding-right:31px;white-space:nowrap}
.track b{color:var(--orange)}
@keyframes marquee{to{transform:translateX(-50%)}}
/* GENERAL */
.section{padding:112px 0}
.section-head{max-width:820px}
.section-title{font-size:clamp(42px,6vw,75px);line-height:.89;letter-spacing:-4px}
.section-intro{font-size:17px;color:var(--muted);line-height:1.62;max-width:700px;margin-top:22px}
.dark{background:var(--green);color:white}
.dark .section-intro{color:#c6d8ca}
/* WHY GOOGLE */
.stats{display:grid;grid-template-columns:1.35fr 1fr 1fr 1fr;gap:1px;background:var(--line);border:1px solid var(--line);border-radius:25px;overflow:hidden;margin-top:55px}
.stat{background:var(--paper);padding:31px;min-height:210px}
.stat:first-child{background:var(--green);color:white}
.stat b{font-size:42px;letter-spacing:-3px;display:block;color:var(--green)}
.stat:first-child b{color:var(--lime);font-size:62px}
.stat h3{font-size:17px;margin-top:12px;letter-spacing:-.8px}
.stat p{font-size:12px;line-height:1.55;color:var(--muted);margin-top:7px}
.stat:first-child p{color:#c7d9cb}
/* GOOGLE WORKS — CRISP VISUAL */
.google-section{background:var(--cream)}
.google-intro{display:grid;grid-template-columns:1fr 1fr;gap:35px;align-items:end}
.google-intro .section-intro{margin-top:0}
.diagram{margin-top:58px;background:var(--paper);border:1px solid #d9e0d8;border-radius:30px;padding:35px;box-shadow:0 14px 40px rgba(0,0,0,.04)}
.diagram-top{display:grid;grid-template-columns:1fr 64px 1fr;align-items:center;gap:15px}
.node{border:1px solid var(--line);border-radius:24px;padding:27px;min-height:250px;background:white}
.node.green{background:var(--green);color:white;border-color:var(--green)}
.node-label{font-size:9px;letter-spacing:2px;font-weight:900;opacity:.55}
.node h3{font-size:27px;margin-top:27px}
.node p{font-size:12px;color:var(--muted);line-height:1.55;margin-top:9px}
.node.green p{color:#c8dacc}
.chips{display:flex;flex-wrap:wrap;gap:7px;margin-top:21px}
.chip{font-size:9px;font-weight:800;padding:7px 9px;border-radius:999px;background:#eef3ed}
.node.green .chip{background:#0b5b2f;color:#dceee0}
.big-arrow{width:60px;height:60px;border-radius:50%;background:var(--orange);color:white;display:grid;place-items:center;font-size:22px;font-weight:900}
.connector-caption{text-align:center;font-size:9px;text-transform:uppercase;letter-spacing:1.5px;font-weight:900;color:#7a847d;margin-top:7px}
.signals{margin-top:22px;display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.signal{padding:18px;border-radius:17px;background:white;border:1px solid var(--line);text-align:center}
.signal strong{display:block;color:var(--green);font-size:15px}
.signal span{font-size:10px;color:var(--muted)}
.discovery{margin-top:25px;display:grid;grid-template-columns:250px 55px 1fr;align-items:center;gap:15px}
.patient{background:#fff2c8;border:1px solid #eadfba;border-radius:20px;padding:20px;text-align:center}
.patient .emoji{font-size:31px}
.patient b{display:block;font-size:14px;margin-top:7px}
.discovery-arrow{font-size:27px;text-align:center;color:var(--orange);font-weight:900}
.result-box{background:white;border:1px solid var(--line);border-radius:20px;padding:20px}
.result-box-top{display:flex;justify-content:space-between;font-size:9px;font-weight:900;color:#6f7971;letter-spacing:1px}
.result-box h4{font-size:18px;color:var(--green2);margin-top:9px}
.result-box p{font-size:11px;color:var(--muted);margin-top:5px}
.result-buttons{display:flex;gap:6px;margin-top:12px;flex-wrap:wrap}
.result-buttons span{background:var(--green);color:white;padding:6px 8px;border-radius:6px;font-size:9px;font-weight:800}
/* AEO GEO */
.doors{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:22px}
.door{padding:24px;border:1px solid var(--line);border-radius:22px;background:white}
.door .label{font-size:9px;letter-spacing:2px;color:var(--orange);font-weight:900}
.door h3{font-size:24px;margin:10px 0 7px}
.door p{font-size:12px;color:var(--muted);line-height:1.55}
.question{margin-top:13px;padding:11px 13px;border-left:3px solid var(--lime);background:#f5f8f3;border-radius:0 10px 10px 0;font-size:11px;font-style:italic}
/* HOW TO WORK — CLEAR 3 STEPS */
.how-grid{display:grid;grid-template-columns:.8fr 1.2fr;gap:70px;align-items:start;margin-top:58px}
.workboard{margin-top:55px;display:grid;grid-template-columns:290px 1fr;gap:18px;align-items:stretch}.work-side{display:flex;flex-direction:column;gap:12px}.work-badge{font-size:9px;letter-spacing:2px;font-weight:900;color:var(--lime);margin-bottom:2px}.work-clinic{padding:22px;border-radius:20px;border:1px solid rgba(255,255,255,.14);position:relative;overflow:hidden}.work-clinic:after{content:"";position:absolute;width:90px;height:90px;border-radius:50%;right:-35px;bottom:-35px;background:rgba(183,239,115,.09)}.work-clinic small{display:block;font-size:8px;letter-spacing:1.8px;font-weight:900;color:var(--lime)}.work-clinic strong{display:block;font-size:22px;margin-top:8px}.work-clinic span{display:block;font-size:10px;color:#b9ccbe;line-height:1.5;margin-top:8px}.work-loop{min-height:470px;border:1px solid rgba(255,255,255,.14);border-radius:28px;position:relative;background:rgba(255,255,255,.035);overflow:hidden}.loop-title{position:absolute;top:22px;left:25px;font-size:9px;letter-spacing:2px;font-weight:900;color:#8fa496}.loop-center{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:180px;height:180px;border-radius:50%;background:var(--lime);color:var(--green);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;box-shadow:0 0 0 14px rgba(183,239,115,.08)}.loop-center span{font-size:8px;letter-spacing:2px;font-weight:900}.loop-center strong{font-size:17px;line-height:1.05;margin-top:9px}.loop-center em{font-style:normal;font-size:20px;margin-top:8px}.work-node{position:absolute;width:170px;padding:14px 15px;border-radius:16px;background:#fff;color:var(--ink);box-shadow:0 12px 25px rgba(0,0,0,.12)}.work-node b{font-size:8px;color:var(--orange);letter-spacing:1px}.work-node strong{display:block;font-size:13px;margin-top:4px}.work-node span{display:block;font-size:9px;color:var(--muted);line-height:1.4;margin-top:4px}.work-node:after{content:"↗";position:absolute;right:13px;top:13px;color:var(--orange);font-weight:900}.n1{left:28px;top:100px}.n2{right:28px;top:100px}.n3{right:20px;bottom:45px}.n4{left:50%;bottom:20px;transform:translateX(-50%)}.n5{left:20px;bottom:45px}.found-flow{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin:22px 0;padding:13px 14px;border:1px solid var(--line);border-radius:15px;background:#f6f8f4;font-size:9px;letter-spacing:1.1px;font-weight:900;color:var(--green)}.found-flow b{color:var(--orange);font-size:14px}.found-flow span:last-child{color:var(--orange)}
.how-copy h3{font-size:28px;line-height:1.05}
.how-copy p{font-size:14px;color:#bfd2c3;line-height:1.65;margin-top:14px;max-width:430px}
.signal-stack{display:grid;gap:11px}
.signal-row{display:grid;grid-template-columns:42px 1fr auto;gap:16px;align-items:center;padding:18px 20px;border:1px solid rgba(255,255,255,.15);border-radius:17px;background:rgba(255,255,255,.045)}
.signal-row .num{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:var(--lime);color:var(--green);font-size:11px;font-weight:900}
.signal-row h4{font-size:14px;letter-spacing:-.4px}
.signal-row p{font-size:10px;color:#b7c9bc;margin-top:3px}
.signal-row .side{font-size:10px;color:var(--lime);font-weight:900}
.how-bottom{margin-top:40px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
.how-bottom div{padding:18px;border-radius:17px;background:rgba(183,239,115,.08);border:1px solid rgba(183,239,115,.12);text-align:center;font-size:11px;font-weight:800}
.how-bottom span{display:block;color:var(--lime);font-size:17px;margin-bottom:5px}

/* V5 — redesigned HOW TO WORK section */
.work-v5{margin-top:55px;position:relative}
.work-stage{background:#f8f6ee;border:1px solid rgba(255,255,255,.16);border-radius:32px;padding:28px;position:relative;overflow:hidden}
.work-stage:before{content:"";position:absolute;width:360px;height:360px;border-radius:50%;right:-150px;top:-160px;background:rgba(183,239,115,.08)}
.work-topline{display:flex;justify-content:space-between;gap:20px;align-items:center;margin-bottom:25px}
.work-topline .caption{font-size:9px;letter-spacing:2px;font-weight:900;color:#7b897f}
.work-topline .rule{height:1px;background:#d9ddd5;flex:1}
.work-map{display:grid;grid-template-columns:1fr 80px 1.1fr;align-items:center;gap:14px}
.work-source{display:grid;gap:10px}
.work-source-card{background:white;border:1px solid #dce1d9;border-radius:21px;padding:19px 20px;position:relative;box-shadow:0 10px 25px rgba(0,0,0,.035)}
.work-source-card:after{content:"";position:absolute;right:17px;top:17px;width:7px;height:7px;border-radius:50%;background:var(--orange)}
.work-source-card small{display:block;font-size:8px;letter-spacing:1.7px;font-weight:900;color:var(--orange)}
.work-source-card strong{display:block;font-size:20px;letter-spacing:-1px;margin-top:5px;color:var(--green)}
.work-source-card span{display:block;font-size:10px;color:#737d75;margin-top:4px}
.work-arrow{text-align:center;color:var(--orange)}
.work-arrow .line{height:2px;background:#e0a88d;position:relative}
.work-arrow .line:after{content:"→";position:absolute;right:-2px;top:-11px;font-size:20px}
.work-arrow small{display:block;font-size:8px;letter-spacing:1px;font-weight:900;margin-top:10px;color:#8b786d}
.google-brain{background:var(--green);border-radius:28px;padding:24px;color:white;position:relative;min-height:215px;box-shadow:0 20px 45px rgba(0,0,0,.12)}
.google-brain .tiny{font-size:8px;letter-spacing:2px;color:var(--lime);font-weight:900}
.google-brain h3{font-size:28px;margin-top:12px;max-width:400px}
.google-brain p{font-size:11px;color:#c8d9cc;margin-top:8px;max-width:440px}
.google-questions{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:20px}
.google-question{padding:11px 10px;border:1px solid rgba(255,255,255,.15);border-radius:12px;background:rgba(255,255,255,.05);font-size:9px;font-weight:800;color:white}
.google-question b{display:block;color:var(--lime);font-size:8px;letter-spacing:1px;margin-bottom:4px}
.work-intention{margin-top:18px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:9px}
.intention{background:white;border:1px solid #dce1d9;border-radius:18px;padding:17px}
.intention .number{font-size:8px;letter-spacing:1.5px;color:var(--orange);font-weight:900}
.intention h4{font-size:16px;color:var(--green);margin-top:7px}
.intention p{font-size:10px;color:#737d75;line-height:1.45;margin-top:5px}
.work-loop-v5{margin-top:18px;padding:18px 20px;border-radius:18px;background:var(--lime);color:var(--green);display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;font-size:10px;font-weight:900;letter-spacing:.7px}
.work-loop-v5 b{font-size:16px}
@media(max-width:900px){
 .work-map{grid-template-columns:1fr}
 .work-arrow{transform:rotate(90deg);margin:3px auto}
 .work-intention{grid-template-columns:1fr}
 .google-questions{grid-template-columns:1fr}
}

/* CURAGO */
.cura{display:grid;grid-template-columns:.85fr 1.15fr;gap:65px;align-items:center}
.cura-word{font-size:clamp(75px,11vw,145px);line-height:.72;letter-spacing:-10px;font-weight:950;color:var(--green)}
.cura-copy{border-left:5px solid var(--orange);padding-left:26px}
.cura-copy h3{font-size:26px;line-height:1.2}
.cura-copy p{font-size:13px;color:var(--muted);line-height:1.65;margin-top:18px}
/* OFFER */
.offer-grid{display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-top:58px}
.offer{border:1px solid var(--line);border-radius:28px;padding:34px;background:white}
.offer.featured{background:var(--green);color:white;border-color:var(--green);box-shadow:var(--shadow)}
.offer-label{font-size:9px;letter-spacing:2px;font-weight:900;color:var(--orange)}
.featured .offer-label{color:var(--lime)}
.price{font-size:52px;line-height:1;letter-spacing:-3px;font-weight:950;margin-top:17px}
.price small{font-size:13px;letter-spacing:0;color:var(--muted)}
.featured .price small{color:#bdd0c3}
.offer h3{font-size:24px;margin-top:12px}
.offer>p{font-size:12px;color:var(--muted);line-height:1.55;margin-top:7px}
.featured>p{color:#c4d7c9}
.checks{display:grid;gap:9px;margin:24px 0}
.check{display:flex;gap:8px;font-size:11px;line-height:1.45}
.check i{font-style:normal;color:var(--green);font-weight:900}
.featured .check i{color:var(--lime)}
.approval{border-radius:16px;padding:16px;background:#f4f8f3;border:1px solid #dce6dd;font-size:11px;line-height:1.8}
.featured .approval{background:#ffffff0a;border-color:#ffffff1a}
.approval b{color:var(--green)}
.featured .approval b{color:var(--lime)}
.fullbtn{display:block;text-align:center;padding:14px;border-radius:999px;background:var(--orange);color:white;font-size:12px;font-weight:900;margin-top:22px}
/* ROADMAP */
.roadmap-wrap{margin-top:58px;overflow-x:auto;padding-bottom:10px}
.road{min-width:940px;height:430px;display:grid;grid-template-columns:repeat(6,1fr);align-items:end;gap:9px;padding:0 10px 45px;position:relative}
.road:after{content:"";position:absolute;left:10px;right:10px;bottom:43px;height:3px;background:#c8dfcc}
.step{width:auto;border:1px solid var(--line);background:white;border-radius:19px 19px 6px 6px;padding:16px;position:relative;z-index:2;box-shadow:0 12px 28px rgba(0,0,0,.04)}
.step:nth-child(1){height:120px} .step:nth-child(2){height:160px} .step:nth-child(3){height:205px}
.step:nth-child(4){height:250px} .step:nth-child(5){height:300px} .step:nth-child(6){height:355px;background:var(--green);color:white;border-color:var(--green)}
.step .num{font-size:8px;letter-spacing:1.5px;font-weight:900;opacity:.6}
.step h3{font-size:15px;margin-top:9px}
.step p{font-size:9px;color:var(--muted);line-height:1.45;margin-top:7px}
.step:last-child p{color:#c9efd1}
.road-label{position:absolute;left:10px;bottom:5px;font-size:9px;font-weight:900;letter-spacing:2px;color:var(--green);display:flex;gap:10px}.road-label b{color:var(--orange)}
.road-destination{margin-top:24px;background:var(--green);color:white;border-radius:24px;padding:25px;display:grid;grid-template-columns:220px 1fr;gap:30px;align-items:center}
.road-destination h3{font-size:55px;color:var(--lime);line-height:.8;letter-spacing:-4px}
.questions{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.questions div{padding:10px;border-left:2px solid var(--lime);font-size:10px;color:#d6e8da}
/* GUARANTEES */
.guarantees{display:grid;grid-template-columns:repeat(4,1fr);gap:13px;margin-top:55px}
.guarantee{padding:24px;border:1px solid var(--line);border-radius:22px;background:white}
.guarantee .icon{font-size:23px;color:var(--orange)}
.guarantee h3{font-size:16px;margin-top:18px}
.guarantee p{font-size:11px;color:var(--muted);line-height:1.55;margin-top:7px}
/* FINAL */
.final{background:var(--green);color:white;padding:105px 0 55px;position:relative;overflow:hidden}
.final:before{content:"";position:absolute;width:520px;height:520px;right:-190px;top:-240px;border-radius:50%;background:rgba(183,239,115,.12)}
.final h2{font-size:clamp(48px,7.5vw,96px);line-height:.84;letter-spacing:-5px;max-width:940px;position:relative}
.final h2 span{color:var(--lime)}
.final p{font-size:16px;color:#c7d9cb;max-width:650px;line-height:1.6;margin-top:25px;position:relative}
.final .btn{margin-top:28px;position:relative}
.footer{display:flex;justify-content:space-between;align-items:center;border-top:1px solid rgba(255,255,255,.13);padding-top:25px;margin-top:80px;color:#9fafa4;font-size:10px;position:relative}
.footer img{width:135px;height:auto;filter:none}
/* reveal */
@keyframes revealIn{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
.reveal{animation:revealIn .7s ease both}
@media(max-width:900px){
 .navlinks,.navbtn{display:none} .menu{display:block}
 .hero{padding-top:135px} .hero-grid,.google-intro,.how-grid,.cura,.offer-grid,.workboard{grid-template-columns:1fr}
 .hero-art{height:410px;margin-top:15px} .stats{grid-template-columns:1fr 1fr}
 .how-grid{gap:35px} .offer.featured{transform:none} .guarantees{grid-template-columns:1fr 1fr}
}
@media(max-width:620px){
 .container{width:calc(100% - 28px)} .section{padding:78px 0}
 .hero h1{font-size:62px;letter-spacing:-4px} .hero{min-height:880px}
 .stats,.guarantees{grid-template-columns:1fr} .diagram{padding:20px}
 .diagram-top,.discovery{grid-template-columns:1fr} .big-arrow{margin:auto;transform:rotate(90deg)}
 .signals,.doors,.how-bottom{grid-template-columns:1fr}.work-loop{min-height:560px}.work-node{width:150px}.n1{left:15px;top:90px}.n2{right:15px;top:90px}.n3{right:12px;bottom:35px}.n4{bottom:12px}.n5{left:12px;bottom:35px} .patient{max-width:none}
 .road-destination{grid-template-columns:1fr} .questions{grid-template-columns:1fr}
 .cura-word{font-size:85px} .final h2{letter-spacing:-4px}
}

/* ===== MOBILE-FIRST RESPONSIVE PATCH ===== */
html, body { max-width:100%; overflow-x:hidden; }
img { max-width:100%; }
@media (max-width: 900px) {
  .container { width: min(100% - 30px, 1180px); }

  /* navigation */
  .nav {
    top:10px;
    height:56px;
    padding:7px 8px 7px 15px;
  }
  .logo { width:132px; }
  .navlinks { display:none !important; }
  .navbtn { display:none !important; }
  .menu {
    display:block;
    width:42px;
    height:42px;
    border-radius:50%;
    background:var(--green);
    color:white;
    font-size:18px;
    line-height:42px;
    padding:0;
  }

  /* hero */
  .hero {
    min-height:auto;
    padding:130px 0 90px;
  }
  .hero:after { bottom:-250px; }
  .hero-grid {
    display:flex;
    flex-direction:column;
    gap:45px;
  }
  .hero h1 {
    font-size:clamp(54px,14vw,82px);
    letter-spacing:-4px;
  }
  .hero-copy {
    font-size:16px;
    max-width:100%;
  }
  .hero-art {
    width:100%;
    height:390px;
    min-height:0;
  }
  .search-card {
    width:min(100%,470px);
    left:50%;
    right:auto;
    transform:translateX(-50%) rotate(2deg);
  }
  .patient-card {
    left:4%;
    bottom:18px;
  }

  /* section typography */
  .section { padding:78px 0; }
  .section-title {
    font-size:clamp(42px,11vw,65px);
    letter-spacing:-3px;
  }
  .section-intro {
    font-size:15px;
  }

  /* stats */
  .stats {
    grid-template-columns:1fr 1fr;
    margin-top:35px;
  }
  .stat {
    min-height:175px;
    padding:22px;
  }
  .stat:first-child { grid-column:1/-1; }
  .stat:first-child b { font-size:55px; }
  .stat b { font-size:34px; }

  /* google works / diagram */
  .google-intro {
    display:flex;
    flex-direction:column;
    gap:18px;
  }
  .diagram {
    margin-top:35px;
    padding:18px;
    border-radius:24px;
  }
  .diagram-top {
    grid-template-columns:1fr;
    gap:10px;
  }
  .node {
    min-height:0;
    padding:22px;
  }
  .node h3 {
    font-size:25px;
    margin-top:17px;
  }
  .big-arrow {
    width:48px;
    height:48px;
    margin:0 auto;
    transform:rotate(90deg);
  }
  .connector-caption { margin-top:-3px; }
  .signals {
    grid-template-columns:1fr;
    gap:8px;
  }
  .signal {
    padding:14px;
  }
  .discovery {
    grid-template-columns:1fr;
    gap:9px;
  }
  .discovery-arrow {
    transform:rotate(90deg);
    height:32px;
    display:grid;
    place-items:center;
  }
  .doors {
    grid-template-columns:1fr;
  }

  /* HOW TO WORK */
  .work-v5 { margin-top:35px; }
  .work-stage {
    padding:18px;
    border-radius:24px;
  }
  .work-topline {
    align-items:flex-start;
    flex-direction:column;
    gap:7px;
  }
  .work-topline .rule { width:100%; flex:auto; }
  .work-map {
    grid-template-columns:1fr;
    gap:9px;
  }
  .work-source-card {
    padding:17px;
  }
  .work-arrow {
    transform:none;
    height:35px;
    display:flex;
    flex-direction:column;
    justify-content:center;
  }
  .work-arrow .line { width:100%; }
  .work-arrow .line:after {
    right:-1px;
    top:-11px;
  }
  .google-brain {
    min-height:0;
    padding:20px;
  }
  .google-brain h3 { font-size:25px; }
  .google-questions {
    grid-template-columns:1fr;
    gap:6px;
  }
  .work-intention {
    grid-template-columns:1fr;
  }
  .work-loop-v5 {
    gap:8px;
    padding:15px;
    line-height:1.8;
  }

  /* be found */
  .cura {
    grid-template-columns:1fr;
    gap:35px;
  }
  .cura-word {
    font-size:clamp(78px,22vw,125px);
    letter-spacing:-7px;
  }

  /* offer */
  .offer-grid {
    grid-template-columns:1fr;
    gap:15px;
    margin-top:35px;
  }
  .offer {
    padding:26px 22px;
    border-radius:24px;
  }
  .offer.featured {
    transform:none;
  }
  .price { font-size:46px; }

  /* roadmap — deliberately scrollable, but contained */
  .roadmap-wrap {
    width:100%;
    overflow-x:auto;
    -webkit-overflow-scrolling:touch;
    scrollbar-width:thin;
  }
  .road {
    min-width:930px;
  }
  .road-destination {
    grid-template-columns:1fr;
    gap:18px;
  }
  .road-destination h3 {
    font-size:50px;
  }
  .questions {
    grid-template-columns:1fr 1fr;
  }

  /* guarantees */
  .guarantees {
    grid-template-columns:1fr 1fr;
    margin-top:35px;
  }

  /* final */
  .final {
    padding:80px 0 40px;
  }
  .final h2 {
    font-size:clamp(48px,12vw,78px);
    letter-spacing:-4px;
  }

  .footer {
    flex-direction:column;
    align-items:flex-start;
    gap:12px;
    margin-top:60px;
  }
}

@media (max-width: 520px) {
  .container { width:calc(100% - 26px); }

  .hero { padding-top:120px; padding-bottom:70px; }
  .hero h1 { font-size:57px; letter-spacing:-3.5px; }
  .hero-copy { font-size:15px; }
  .hero-actions { flex-direction:column; align-items:stretch; }
  .hero-actions .btn,
  .hero-secondary { width:100%; text-align:center; }
  .hero-art { height:330px; }
  .search-card {
    width:96%;
    padding:10px;
    top:8px;
  }
  .search-result { padding:13px; }
  .search-result h3 { font-size:17px; }
  .patient-card {
    width:185px;
    padding:14px;
    left:2%;
    bottom:3px;
  }
  .patient-card strong { font-size:20px; }

  .stats { grid-template-columns:1fr; }
  .stat:first-child { grid-column:auto; }
  .stat { min-height:auto; padding:20px; }
  .stat:first-child b { font-size:50px; }

  .node { padding:19px; }
  .node h3 { font-size:23px; }
  .chips { gap:5px; }
  .chip { font-size:8px; padding:6px 8px; }

  .work-stage { padding:14px; }
  .work-source-card strong { font-size:18px; }
  .google-brain h3 { font-size:23px; }
  .intention { padding:15px; }

  .doors .door { padding:20px; }
  .cura-word { font-size:78px; letter-spacing:-6px; }

  .offer { padding:24px 19px; }
  .price { font-size:42px; }
  .checks { gap:8px; }

  .questions { grid-template-columns:1fr; }
  .guarantees { grid-template-columns:1fr; }

  .final h2 { font-size:51px; }
  .final .btn { width:100%; text-align:center; }
}


.navlinks.open{display:flex!important;position:absolute;top:66px;left:0;right:0;padding:18px;background:rgba(255,253,248,.98);border:1px solid #dfe4dc;border-radius:22px;flex-direction:column;gap:16px;box-shadow:0 20px 40px rgba(0,0,0,.12);z-index:60}
.found-flow{display:flex;flex-wrap:wrap;align-items:center;gap:9px;margin-top:18px;font-size:10px;font-weight:900;letter-spacing:1.4px;color:var(--green)}
.found-flow span{background:#eef3ed;border-radius:999px;padding:8px 12px}
.found-flow b{color:var(--orange)}
/* product-flow palette, same vocabulary as the landing */
:root{
  --forest:var(--green); --forest-2:#05311a; --forest-3:#042713; --forest-mid:var(--green3);
  --border:var(--line); --orange-2:#e65c0d; --orange-soft:#fff2e8;
  --leaf:#8fd77a; --leaf-2:var(--lime); --leaf-ink:#0b5b2f; --leaf-soft:#f2f8ef; --leaf-bd:#d8e6d2;
  --ink-70:#475049; --ink-50:var(--muted);
  --sans:Inter,ui-sans-serif,system-ui,sans-serif;
  --serif:Inter,ui-sans-serif,system-ui,sans-serif;
  --mono:Inter,ui-sans-serif,system-ui,sans-serif;
}
@keyframes rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}

/* --- CuraGo edits --- */
.dos h2, .dos .section-title, .dos .final h2 { font-weight:900; }
/* nav alignment: links push right, Login/Sign up cluster on the far right */
.dos .navlinks{margin-left:auto;align-items:center}
.dos .navcta{display:flex;gap:8px;align-items:center;margin-left:24px}
.dos .navcta .navbtn{padding:10px 16px}
.dos .navlinks-cta{display:none}           /* desktop: buttons live in .navcta */
@media(max-width:860px){
  .dos .navcta{display:none}               /* mobile: buttons move into the menu */
  .dos .navlinks.open .navlinks-cta{display:inline-flex!important;width:100%;justify-content:center}
}
.dos .acd{display:inline-block;font-size:clamp(30px,4.4vw,48px);font-weight:900;letter-spacing:-.05em;color:#fff;line-height:1.02;margin-bottom:12px}
.dos .acd b{color:var(--lime);font-weight:900;padding:0 4px}
.dos .hero-tier{display:block;font-weight:800;color:#fff;opacity:.95;font-size:clamp(14px,1.7vw,17px);letter-spacing:-.01em;margin-top:2px}
.dos .hero-tagline{margin:16px 0 4px;font-size:13.5px;font-weight:700;color:var(--lime)}
.dos .road{display:flex;flex-direction:column;gap:12px}
.dos .road .step{display:block}
.dos .foot-links{display:flex;flex-wrap:wrap;gap:16px;font-size:11px;font-weight:700;color:#9fafa4}
.dos .foot-links a:hover{color:#fff}

.dos .founder{font-size:10px;font-weight:900;letter-spacing:1.4px;color:var(--orange);margin-left:6px}
`;

const BODY = `<nav class="nav">
  <a href="#top"><img class="logo" src="/curago-logo.png" alt="CuraGo"></a>
  <div class="navlinks">
    <a href="#why" data-closenav="1">Why Google</a>
    <a href="#system" data-closenav="1">How to work on Google</a>
    <a href="#offer" data-closenav="1">How CuraGo helps</a>
    <button class="btn btn-white navbtn navlinks-cta" data-login="1">Login</button>
    <button class="btn btn-orange navbtn navlinks-cta" data-start="1">Sign up</button>
  </div>
  <div class="navcta">
    <button class="btn btn-white navbtn" data-login="1">Login</button>
    <button class="btn btn-orange navbtn" data-start="1">Sign up</button>
  </div>
  <button class="menu" aria-label="Menu" data-togglenav="1">☰</button>
</nav>

<header class="hero" id="top">
  <div class="container hero-grid">
    <div class="reveal">
      <div class="kicker">FREE TO START · ~20 MINUTES</div>
      <h1>Get found<br><span>on Google.</span></h1>
      <p class="hero-copy">Appear. Compete. Dominate.<br>Made for surgeons and specialists building practices in Tier 2 cities or smaller cities — and designed for all doctors, including dentists and dental surgeons.</p>
      <div class="hero-actions">
        <button class="btn btn-orange" data-start="1">Start Now →</button>
        <a class="hero-secondary" href="#google">See how it works</a>
      </div>
      <div class="micro">No subscription. No payment required to build the foundation.</div>
    </div>
    <div class="hero-art reveal">
      <div class="search-card">
        <div class="googlebar"><span class="gdot"></span> surgical specialist near me</div>
        <div class="search-result">
          <small>GOOGLE · LOCAL PRACTICE</small>
          <h3>Dr. YourName — Surgical Specialist</h3>
          <p>Expertise · Services · Location · Reviews</p>
          <div class="tags"><span class="tag">Relevant</span><span class="tag">Local</span><span class="tag">Trusted</span></div>
        </div>
        <div class="search-result">
          <small>PATIENT QUESTION</small>
          <h3>Can you help me?</h3>
          <p>Useful answers + connected practice information help the right patient find you.</p>
        </div>
      </div>
      <div class="patient-card"><small>DISCOVERY</small><strong>One question.<br>One patient.</strong></div>
    </div>
  </div>
</header>

<div class="marquee"><div class="track">
<span class="mq">BUILD YOUR PRESENCE <b>✦</b> GET DISCOVERED <b>✦</b> BUILD TRUST <b>✦</b> KEEP BUILDING <b>✦</b></span>
<span class="mq">BUILD YOUR PRESENCE <b>✦</b> GET DISCOVERED <b>✦</b> BUILD TRUST <b>✦</b> KEEP BUILDING <b>✦</b></span>
</div></div>

<section class="section reveal" id="why">
<div class="container">
  <div class="eyebrow">01 · WHY GOOGLE</div>
  <h2 class="section-title">Google is<br>opportunity.</h2>
  <p class="section-intro">Google is the front door of your clinical practice. And unlike something you have to pay for every time a patient sees it, organic presence can keep getting stronger.</p>
  <div class="stats">
    <div class="stat"><b>77%</b><h3>Search before booking</h3><p>Think with Google research reported that 77% of patients used search before scheduling a hospital appointment.</p></div>
    <div class="stat"><b>LOW</b><h3>Cost per discovery</h3><p>Organic visibility doesn't require paying for every individual click.</p></div>
    <div class="stat"><b>BUILD</b><h3>Not restart</h3><p>Keep strengthening the foundation instead of starting from zero every day.</p></div>
    <div class="stat"><b>∞</b><h3>Compounds</h3><p>The work you do today can continue contributing to tomorrow's presence.</p></div>
  </div>
</div>
</section>

<section class="section google-section reveal" id="google">
<div class="container">
  <div class="google-intro">
    <div>
      <div class="eyebrow">02 · HOW GOOGLE WORKS</div>
      <h2 class="section-title">One practice.<br>Two different clinics.</h2>
    </div>
    <p class="section-intro">Google doesn't see your clinic's website or Google Business Profile as two different entities. It builds an understanding from connected pieces of information about <b>who you are, what you do, where you are and how relevant you are.</b></p>
  </div>

  <div class="diagram">
    <div class="diagram-top">
      <div class="node green">
        <div class="node-label">GLOBAL CLINIC</div>
        <h3>Your website</h3>
        <p>Your website — the global version of your practice, accessible wherever a patient is searching from.</p>
        <div class="chips"><span class="chip">Experience</span><span class="chip">Expertise</span><span class="chip">Knowledge</span><span class="chip">Treatments</span></div>
      </div>
      <div>
        <div class="big-arrow">↔</div>
        <div class="connector-caption">connected</div>
      </div>
      <div class="node">
        <div class="node-label">LOCAL CLINIC</div>
        <h3>Your Google Business Profile</h3>
        <p>Your GBP — the local version of your practice, tied to where the patient is searching.</p>
        <div class="chips"><span class="chip">Location</span><span class="chip">Services</span><span class="chip">Reviews</span><span class="chip">Products</span><span class="chip">Booking</span></div>
      </div>
    </div>

    <div class="signals">
      <div class="signal"><strong>Prominence</strong><span>How established and recognised you are</span></div>
      <div class="signal"><strong>Proximity</strong><span>How close you are to the patient</span></div>
      <div class="signal"><strong>Relevance</strong><span>How well you match what they need</span></div>
    </div>

    <div class="discovery">
      <div class="patient"><div class="emoji">🧑‍💻</div><b>Patient searches</b><span style="font-size:9px;color:#776e49">question → discovery → comparison</span></div>
      <div class="discovery-arrow">→</div>
      <div class="result-box">
        <div class="result-box-top"><span>GOOGLE RESULT</span><span>LOCAL + ORGANIC</span></div>
        <h4>Your practice appears with context.</h4>
        <p>Speciality · services · expertise · location · reviews · useful information</p>
        <div class="result-buttons"><span>Call</span><span>Book</span><span>Directions</span><span>Website</span></div>
      </div>
    </div>

    <div class="doors">
      <div class="door">
        <div class="label">AEO · ANSWER ENGINE OPTIMIZATION</div>
        <h3>Patients ask questions.</h3>
        <p>Structure your knowledge so answer-focused search experiences can better understand and use it.</p>
        <div class="question">“When do gallstones need surgery?”</div>
      </div>
      <div class="door">
        <div class="label">GEO · GENERATIVE ENGINE OPTIMIZATION</div>
        <h3>Search is becoming conversational.</h3>
        <p>Make your expertise, entities, relationships and knowledge easier for generative search systems to understand and connect.</p>
        <div class="question">“Which specialist should I see for this?”</div>
      </div>
    </div>

    <div style="margin-top:25px;text-align:center;font-size:11px;font-weight:900;color:var(--green)">ONE PRACTICE · ONE CONNECTED PRESENCE · MULTIPLE DOORS FOR PATIENT DISCOVERY</div>
  </div>
</div>
</section>

<section class="section dark reveal" id="system">
<div class="container">
  <div class="eyebrow">03 · HOW TO WORK ON GOOGLE</div>
  <h2 class="section-title">Google has to<br><span style="color:var(--lime)">understand you.</span></h2>
  <p class="section-intro">So we don't chase a mysterious algorithm. We keep giving Google a clearer, more complete picture of your practice — then keep strengthening it.</p>

  <div class="work-v5">
    <div class="work-stage">
      <div class="work-topline">
        <span class="caption">THE WORK, VISUALLY</span>
        <span class="rule"></span>
        <span class="caption">BUILD → CONNECT → STRENGTHEN</span>
      </div>

      <div class="work-map">
        <div class="work-source">
          <div class="work-source-card">
            <small>GLOBAL CLINIC</small>
            <strong>Website</strong>
            <span>Expertise · knowledge · treatments · procedures</span>
          </div>
          <div class="work-source-card">
            <small>LOCAL CLINIC</small>
            <strong>Google Business Profile</strong>
            <span>Location · services · reviews · posts · booking</span>
          </div>
        </div>

        <div class="work-arrow">
          <div class="line"></div>
          <small>FEEDS</small>
        </div>

        <div class="google-brain">
          <div class="tiny">GOOGLE'S JOB</div>
          <h3>Build a picture of your practice.</h3>
          <p>The clearer the picture, the easier it is to understand where you fit when a patient searches.</p>
          <div class="google-questions">
            <div class="google-question"><b>01</b>Who are you?</div>
            <div class="google-question"><b>02</b>Where are you?</div>
            <div class="google-question"><b>03</b>How relevant are you?</div>
          </div>
        </div>
      </div>

      <div class="work-intention">
        <div class="intention">
          <div class="number">01 · BUILD DEPTH</div>
          <h4>Give Google something useful.</h4>
          <p>Build your website around your experience, expertise, knowledge, treatments and procedures.</p>
        </div>
        <div class="intention">
          <div class="number">02 · BUILD LOCAL RELEVANCE</div>
          <h4>Make the local clinic complete.</h4>
          <p>Keep your Google Business Profile accurate, complete and active with the information patients need.</p>
        </div>
        <div class="intention">
          <div class="number">03 · KEEP IT CONNECTED</div>
          <h4>Make the picture stronger.</h4>
          <p>Connect the website and local presence, answer real patient questions, and keep improving over time.</p>
        </div>
      </div>

      <div class="work-loop-v5">
        <span>BUILD</span><b>→</b><span>CONNECT</span><b>→</b><span>EVALUATE</span><b>→</b><span>IMPROVE</span><b>→</b><span>REPEAT ↻</span>
      </div>
    </div>
  </div>
</div>
</section>

<section class="section reveal" id="found">
<div class="container">
  <div class="cura">
    <div><div class="eyebrow">04 · BE FOUND</div><div class="cura-word">BE<br>FOUND.</div></div>
    <div class="cura-copy">
      <h3>Build a practice that Google can understand — and patients can find.</h3>
      <p>Your website is your <b>Global Clinic</b>. Your Google Business Profile is your <b>Local Clinic</b>. CuraGo helps connect the two, strengthen the signals between them, and keep building your presence over time.</p>
      <div class="found-flow"><span>GLOBAL CLINIC</span><b>↔</b><span>LOCAL CLINIC</span><b>→</b><span>BE FOUND</span></div>
      <p><b>Appear quickly. Build relevance. Keep becoming easier to find.</b></p>
    </div>
  </div>
</div>
</section>

<section class="section" id="offer">
<div class="container reveal">
  <div class="eyebrow">05 · WHERE DOES CURAGO COME IN?</div>
  <h2 class="section-title">You build the practice.<br><span style="color:var(--green)">CuraGo helps build the presence.</span></h2>
  <p class="section-intro">Start free to build the foundation. Upgrade when you want CuraGo to take on the ongoing work.</p>

  <div class="offer-grid">
    <div class="offer">
      <div class="offer-label">STEP 1 · THE FOUNDATION</div>
      <div class="price">FREE <small>~20 min</small></div>
      <h3>Build your organic presence.</h3>
      <p>Get the infrastructure you need to start.</p>
      <div class="checks">
        <div class="check"><i>✓</i> AI-built clinical practice website</div><div class="check"><i>✓</i> GBP setup guidance</div>
        <div class="check"><i>✓</i> Live on subdomain, or connect a custom domain instantly</div><div class="check"><i>✓</i> Your own dashboard</div>
        <div class="check"><i>✓</i> In-built booking management software</div><div class="check"><i>✓</i> Blog &amp; page builder</div>
      </div>
      <div class="approval"><b>No subscription. No expiry. No lock-in.</b></div>
      <button class="fullbtn" data-start="1">Start Free →</button>
    </div>

    <div class="offer featured">
      <div class="offer-label">STEP 2 · DOMINATE ORGANIC SEARCH</div>
      <div class="price">₹5,000 <small>/ month</small> <span class="founder">FOUNDER PRICE</span></div>
      <h3>Let CuraGo do the ongoing work with you.</h3>
      <p>Everything in Free, plus:</p>
      <div class="checks">
        <div class="check"><i>✓</i> Ongoing organic search optimisation</div><div class="check"><i>✓</i> Guided GBP optimisation</div>
        <div class="check"><i>✓</i> AI website and blog page builders</div><div class="check"><i>✓</i> Monthly competitor progress report</div>
        <div class="check"><i>✓</i> CuraGo workspace</div><div class="check"><i>✓</i> CuraGo content planner</div>
      </div>
      <div class="approval"><b>CURAGO</b> prepares → <b>YOU</b> review → <b>YOU</b> approve → <b>CURAGO</b> keeps building ↺</div>
      <p style="margin-top:13px;font-size:10px;color:#b9cdbd">Your involvement is designed to be at least once a week, depending on how you choose to work.</p>
      <button class="fullbtn" data-start="1">₹5,000 · Start now →</button>
      <p style="margin-top:12px;font-size:11px;color:#d7e6da;line-height:1.5">Accepting a limited number of doctors for the case study — finish the basic steps to apply.</p>
    </div>
  </div>
</div>
</section>

<section class="section reveal" id="roadmap">
<div class="container">
  <div class="eyebrow">06 · YOUR 12-MONTH ORGANIC GROWTH ROADMAP</div>
  <h2 class="section-title">You don't jump to domination.<br><span style="color:var(--green)">You climb towards it.</span></h2>
  <p class="section-intro">The mechanics stay behind the curtain. What you see is what your practice progressively becomes discoverable for.</p>

  <div class="roadmap-wrap">
    <div class="road">
      <div class="step"><div class="num">MONTHS 1–2</div><h3>Establish Your Identity</h3><p>Who are you? What do you specialise in?</p></div>
      <div class="step"><div class="num">MONTHS 3–4</div><h3>Become Relevant to Patients</h3><p>Can you help me with my problem?</p></div>
      <div class="step"><div class="num">MONTHS 5–6</div><h3>Establish Your Authority</h3><p>Why should I choose you?</p></div>
      <div class="step"><div class="num">MONTHS 7–8</div><h3>Become the Doctor for Difficult Cases</h3><p>Can you handle my complex case?</p></div>
      <div class="step"><div class="num">MONTHS 9–10</div><h3>Become Part of the Long-Term Journey</h3><p>Can I trust you beyond treatment?</p></div>
      <div class="step"><div class="num">MONTHS 11–12</div><h3>Establish Field Authority</h3><p>Are you an authority in this field?</p></div>
      <div class="road-label"><span>APPEAR</span><b>→</b><span>COMPETE</span><b>→</b><span>DOMINATE</span></div>
    </div>
  </div>
</div>
</section>

<section class="section reveal">
<div class="container">
  <div class="eyebrow">07 · OUR GUARANTEES</div>
  <h2 class="section-title">We build it.<br>You stay in control.</h2>
  <div class="guarantees">
    <div class="guarantee"><div class="icon">✦</div><h3>We do the boring work</h3><p>Strategy, content and ongoing work needed to build your organic presence.</p></div>
    <div class="guarantee"><div class="icon">◉</div><h3>You stay in control</h3><p>You review and approve the work before it moves forward.</p></div>
    <div class="guarantee"><div class="icon">↻</div><h3>Simple weekly involvement</h3><p>At least once a week, or whenever it fits your schedule.</p></div>
    <div class="guarantee"><div class="icon">⌁</div><h3>Cancel anytime</h3><p>Finish the running month. No long-term lock-in. Your work remains part of your practice.</p></div>
  </div>
  <p style="font-size:11px;color:var(--muted);margin-top:20px">₹5,000 charged monthly · No bulk payments.</p>
</div>
</section>

<section class="final" id="start">
<div class="container">
  <div class="eyebrow" style="color:var(--lime)">CURAGO IN ONE SENTENCE</div>
  <h2>CuraGo helps doctors build and continuously strengthen their organic practice presence on <span>Google.</span></h2>
  <p>Start with a free foundation. Then decide how far you want to climb.</p>
  <button class="btn btn-orange" data-start="1">Start Building My Organic Presence →</button>
  <div class="micro">Free to start. Most doctors finish the foundation in about 20 minutes.</div>
  <div class="footer">
    <img src="/curago-logo.png" alt="CuraGo">
    <div class="foot-links">
      <a href="/services">Services</a>
      <a href="/privacy">Privacy Policy</a>
      <a href="/terms">Terms</a>
      <a href="mailto:support@curago.in">Contact</a>
    </div>
    <span>© 2026 CuraGo. All rights reserved.</span>
  </div>
</div>`;

export default function DominateLanding() {
  const router = useRouter();
  useEffect(() => {
    const root = document.querySelector('.dos');
    if (!root) return;
    const nav = root.querySelector('.navlinks');
    let signedIn = false;

    // (Re)wire click behaviour. Uses onclick so re-running after the auth check
    // is idempotent. When signed in, CTAs go to the app and Login is hidden — so
    // a logged-in doctor never sees "Login/Sign up" and think they're logged out.
    const wire = () => {
      const dash = () => router.push('/app/zero-to-practice-builder');
      root.querySelectorAll('[data-start]').forEach((el) => {
        if (signedIn && el.classList.contains('navbtn')) el.textContent = 'My dashboard';
        el.onclick = signedIn ? dash : () => router.push('/signup?entry=practice-os');
      });
      root.querySelectorAll('[data-login]').forEach((el) => {
        el.style.display = signedIn ? 'none' : '';
        el.onclick = signedIn ? dash : () => router.push('/login?entry=practice-os');
      });
      root.querySelectorAll('[data-togglenav]').forEach((el) => { el.onclick = () => nav && nav.classList.toggle('open'); });
      root.querySelectorAll('[data-closenav]').forEach((el) => { el.onclick = () => nav && nav.classList.remove('open'); });
    };
    wire();

    // Detect an existing session (cookie persists on the homepage — this only
    // updates the nav; it never logs anyone out).
    let alive = true;
    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive && d && d.doctor) { signedIn = true; wire(); } })
      .catch(() => {});
    return () => { alive = false; };
  }, [router]);

  return (
    <div className="dos" style={{ fontFamily: inter.style.fontFamily }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div dangerouslySetInnerHTML={{ __html: BODY }} />
    </div>
  );
}
